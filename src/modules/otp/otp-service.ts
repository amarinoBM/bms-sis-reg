import { AppError } from "@/core/app-error";
import { OTP_RESEND_COOLDOWN_SECONDS } from "@/config/backendless";
import {
  getCacheValue,
  parentOtpCacheKey,
  putCacheValue,
} from "@/server/connectors/backendless/cache-client";
import { sendOtpEmail } from "@/server/connectors/backendless/email-client";
import { findEnrolledStudents } from "@/modules/students/repository";
import { getServerEnv } from "@/config/env";

function generateOtp(): number {
  return Math.floor(Math.random() * 999999) + 1;
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

  const otp = generateOtp();
  await putCacheValue(parentOtpCacheKey(leadId), otp, undefined, fetchImpl);
  await sendOtpEmail(leadId, email.trim(), otp, fetchImpl);

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
    throw new AppError({
      code: "INVALID_INPUT",
      message: "Invalid one time pin. Please check and try again",
    });
  }

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
