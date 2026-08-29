import { createHash, randomInt, timingSafeEqual } from "node:crypto";

import { AppError } from "@/core/app-error";
import { OTP_RESEND_COOLDOWN_SECONDS } from "@/config/backendless";
import {
  assertOtpResendCooldown,
  assertOtpSendAllowed,
  assertOtpVerifyAllowed,
  clearOtpVerifyFailures,
  deleteCacheValue,
  getCacheValue,
  parentOtpCacheKey,
  putCacheValue,
  recordOtpSend,
} from "@/server/connectors/backendless/cache-client";
import { sendOtpEmail } from "@/server/connectors/backendless/email-client";
import { findEnrolledStudents } from "@/modules/students/repository";
import { getServerEnv } from "@/config/env";
import { resolveParentEmailChoice } from "@/server/auth/parent-email-choice";

function generateOtp(): string {
  return String(randomInt(100000, 1000000));
}

function normalizeOtp(value: unknown): string {
  return String(value).trim();
}

function hashOtp(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}

function otpMatches(cached: unknown, input: string): boolean {
  const cachedValue = normalizeOtp(cached);
  const submitted = normalizeOtp(input);

  if (/^\d{6}$/.test(cachedValue)) {
    return cachedValue === submitted;
  }

  const hashed = hashOtp(submitted);
  const left = Buffer.from(hashed);
  const right = Buffer.from(cachedValue);
  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export async function sendParentOtp(
  leadId: string,
  emailChoiceToken?: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ cooldownSeconds: number }> {
  if (!getServerEnv().backendlessCodeUrl) {
    throw new AppError({
      code: "INTERNAL_ERROR",
      message: "OTP email is not configured.",
    });
  }

  await assertOtpResendCooldown(leadId, fetchImpl);

  const email = await resolveParentEmailChoice(leadId, emailChoiceToken, fetchImpl);
  if (!email) {
    throw new AppError({
      code: "INVALID_INPUT",
      message:
        "We do not have a parent email on file for this registration link. Contact help@brilliantmicroschool.org.",
    });
  }

  await assertOtpSendAllowed(leadId, fetchImpl);

  const otp = generateOtp();
  await putCacheValue(parentOtpCacheKey(leadId), hashOtp(otp), undefined, fetchImpl);
  await recordOtpSend(leadId, fetchImpl);
  await sendOtpEmail(leadId, email, Number(otp), fetchImpl);

  return { cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS };
}

export async function verifyParentOtp(
  leadId: string,
  otpInput: string,
  studentName?: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{
  redirectUrl: string;
  studentName: string;
  students: { studentName: string; objectId: string }[];
}> {
  const cachedOtp = await getCacheValue<number | string>(
    parentOtpCacheKey(leadId),
    fetchImpl,
  );

  if (cachedOtp === null || cachedOtp === undefined) {
    throw new AppError({
      code: "INVALID_INPUT",
      message: "One time pin expired. Please send a new one and try again",
    });
  }

  if (!otpMatches(cachedOtp, otpInput)) {
    await assertOtpVerifyAllowed(leadId, fetchImpl);
    throw new AppError({
      code: "INVALID_INPUT",
      message: "Invalid one time pin. Please check and try again",
    });
  }

  await clearOtpVerifyFailures(leadId, fetchImpl);
  await deleteCacheValue(parentOtpCacheKey(leadId), fetchImpl);

  const students = await findEnrolledStudents(leadId, fetchImpl);

  if (students.length === 0) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "No enrolled student found for this registration link.",
    });
  }

  const resolvedStudentName =
    studentName?.trim() ? studentName.trim() : students[0].studentName;

  const { publicAppUrl } = getServerEnv();
  const redirectUrl = `${publicAppUrl}/reg/sis?lead_id=${encodeURIComponent(leadId)}&student_name=${encodeURIComponent(resolvedStudentName)}`;

  return {
    redirectUrl,
    studentName: resolvedStudentName,
    students,
  };
}
