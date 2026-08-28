import { invokeCloudCode } from "@/server/connectors/backendless/cloud-code-client";
import { EMAIL_FROM, OTP_EMAIL_SUBJECT } from "@/config/backendless";
import { buildOtpEmailHtml } from "@/modules/otp/email-template";
import { AppError } from "@/core/app-error";
import { z } from "zod";

const adminEmailReceipt = z.object({
  id: z.string().regex(/^acti_[a-zA-Z0-9]+$/),
  status: z.enum(["outbox", "sent"]),
  lead_id: z.string(),
  to: z.array(z.string()).length(1),
});

type EmailFrontendPayload = {
  status: string;
  lead_id: string;
  sender_name: string;
  sender_email: string;
  to: string;
  subject: string;
  body_html: string;
  date_scheduled?: string;
};

export function buildOtpEmailBody(otp: number): string {
  return buildOtpEmailHtml(otp);
}

export async function sendScheduledDocumentEmail(
  leadId: string,
  toEmail: string,
  subject: string,
  bodyHtml: string,
  fetchImpl: typeof fetch = fetch,
  delaySeconds = 300,
): Promise<void> {
  const payload: EmailFrontendPayload = {
    status: "scheduled",
    lead_id: leadId,
    sender_name: EMAIL_FROM.name,
    sender_email: EMAIL_FROM.address,
    to: toEmail,
    subject,
    body_html: bodyHtml,
    date_scheduled: String(Date.now() + delaySeconds * 1000),
  };

  await invokeCloudCode({
    service: "uiBuilder",
    method: "emailFrontend",
    body: payload,
    fetchImpl,
  });
}

export async function sendOtpEmail(
  leadId: string,
  toEmail: string,
  otp: number,
  fetchImpl: typeof fetch = fetch,
  options?: { ttlSeconds?: number; admin?: boolean },
): Promise<void> {
  const payload: EmailFrontendPayload = {
    status: "outbox",
    lead_id: leadId,
    sender_name: EMAIL_FROM.name,
    sender_email: EMAIL_FROM.address,
    to: toEmail,
    subject: options?.admin ? "Your BMS admin login code" : OTP_EMAIL_SUBJECT,
    body_html: buildOtpEmailHtml(otp, options),
  };

  const result = await invokeCloudCode<unknown>({
    service: "uiBuilder",
    method: "emailFrontend",
    body: payload,
    fetchImpl,
  });

  if (options?.admin) {
    // The live helper can swallow a Close error and return HTTP 200 with null.
    const receipt = adminEmailReceipt.safeParse(result);
    if (!receipt.success || receipt.data.lead_id !== leadId || receipt.data.to[0].toLowerCase() !== toEmail.toLowerCase()) {
      throw new AppError({ code: "EXTERNAL_WRITE_FAILED", message: "The admin login email was not accepted for sending.", status: 502 });
    }
    // A queue receipt is not proof of inbox delivery. Do not log addresses, bodies, or codes.
    console.info("[admin-otp-email]", { activityId: receipt.data.id, status: receipt.data.status });
  }
}
