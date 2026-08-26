import { randomInt } from "node:crypto";

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
import {
  collectLeadParentEmails,
  isEmailAllowedForLead,
} from "@/modules/students/student-wizard-dto";
import {
  findEnrolledStudents,
  loadStudentRecord,
} from "@/modules/students/repository";
import { getServerEnv } from "@/config/env";

function generateOtp(): string {
  return String(randomInt(100000, 1000000));
}

function normalizeOtp(value: unknown): string {
  return String(value).trim();
}

function validateEmail(email: string): void {
  if (!email.trim()) {
    throw new AppError({
      code: "INVALID_INPUT",
      message: "You need to enter an email to proceed.",
    });
  }

  if (email.includes(" ")) {
    throw new AppError({
      code: "INVALID_INPUT",
      message: "Check email if it's correct.",
    });
  }
}

async function loadAllowedParentEmails(
  leadId: string,
  fetchImpl: typeof fetch,
): Promise<string[]> {
  const enrolledStudents = await findEnrolledStudents(leadId, fetchImpl);
  const rows: Record<string, unknown>[] = [];

  for (const student of enrolledStudents) {
    const loaded = await loadStudentRecord(leadId, student.studentName, fetchImpl);
    rows.push(loaded.student);
  }

  return collectLeadParentEmails(rows);
}

export async function sendParentOtp(
  leadId: string,
  email: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ cooldownSeconds: number }> {
  validateEmail(email);

  if (!getServerEnv().backendlessCodeUrl) {
    throw new AppError({
      code: "INTERNAL_ERROR",
      message: "OTP email is not configured.",
    });
  }

  await assertOtpSendAllowed(leadId, fetchImpl);
  await assertOtpResendCooldown(leadId, fetchImpl);

  const allowedEmails = await loadAllowedParentEmails(leadId, fetchImpl);
  if (!isEmailAllowedForLead(email, allowedEmails)) {
    throw new AppError({
      code: "INVALID_INPUT",
      message:
        "That email does not match our records for this registration link. Use the parent email on your enrollment paperwork or contact help@brilliantmicroschool.org.",
    });
  }

  const otp = generateOtp();
  await putCacheValue(parentOtpCacheKey(leadId), otp, undefined, fetchImpl);
  await clearOtpVerifyFailures(leadId, fetchImpl);
  await recordOtpSend(leadId, fetchImpl);
  await sendOtpEmail(leadId, email.trim(), Number(otp), fetchImpl);

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

  if (normalizeOtp(cachedOtp) !== normalizeOtp(otpInput)) {
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
