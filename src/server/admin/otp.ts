import { randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { AppError } from "@/core/app-error";
import { ADMIN_EMAIL, ADMIN_OTP_SECONDS, isAllowedAdmin } from "@/modules/admin/policy";
import { sendOtpEmail } from "@/server/connectors/backendless/email-client";
import { adminConfig } from "./config";
import { adminRateLimit, adminRef, incrementAdminCounter, readAdminValue, writeAdminValue, removeAdminValue } from "./store";

type Challenge = { digest: string; email: string; expiresAt: number };
function invalidCode(): never {
  throw new AppError({ code: "INVALID_INPUT", message: "That code is invalid or expired. Request a new code if needed." });
}
export async function sendAdminOtp(email: string): Promise<{ challengeId: string; cooldownSeconds: number }> {
  const { emailLeadId } = adminConfig();
  const challengeId = randomUUID();
  // Same public response for every address; only the exact allowlisted address receives mail.
  if (!isAllowedAdmin(email)) return { challengeId, cooldownSeconds: 30 };
  const lastSend = await readAdminValue<number>("last-send");
  if (lastSend && Date.now() - lastSend < 30_000) {
    throw new AppError({ code: "FORBIDDEN", message: "Please wait 30 seconds before requesting another code." });
  }
  await adminRateLimit("send", 3600, 10);
  await adminRateLimit("send-cooldown", 30, 1);
  await writeAdminValue("last-send", Date.now(), 30);
  const otp = String(randomInt(100000, 1000000));
  const name = "otp:" + challengeId;
  await writeAdminValue(name, {
    email: ADMIN_EMAIL, digest: adminRef("otp:" + challengeId, otp),
    expiresAt: Date.now() + ADMIN_OTP_SECONDS * 1000,
  } satisfies Challenge, ADMIN_OTP_SECONDS);
  try {
    // Close requires a lead: use the operator-approved test lead, never a viewed family's lead.
    await sendOtpEmail(emailLeadId, ADMIN_EMAIL, Number(otp), fetch, { ttlSeconds: ADMIN_OTP_SECONDS, admin: true });
  } catch {
    await removeAdminValue(name);
    throw new AppError({ code: "INTERNAL_ERROR", message: "Could not send your login code. Please try again." });
  }
  return { challengeId, cooldownSeconds: 30 };
}
export async function verifyAdminOtp(email: string, challengeId: string, otp: string): Promise<string> {
  adminConfig();
  if (!isAllowedAdmin(email)) invalidCode();
  await adminRateLimit("verify", 300, 20);
  const name = "otp:" + challengeId;
  const challenge = await readAdminValue<Challenge>(name);
  if (!challenge || challenge.email !== ADMIN_EMAIL || challenge.expiresAt <= Date.now()) invalidCode();
  if (await incrementAdminCounter("attempt:" + challengeId) > 5) invalidCode();
  const expected = Buffer.from(challenge.digest, "hex");
  const actual = Buffer.from(adminRef("otp:" + challengeId, otp), "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) invalidCode();
  if (await incrementAdminCounter("redeem:" + challengeId) !== 1) invalidCode();
  await removeAdminValue(name);
  return ADMIN_EMAIL;
}
