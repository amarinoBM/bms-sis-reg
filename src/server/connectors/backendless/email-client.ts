import { invokeCloudCode } from "@/server/connectors/backendless/cloud-code-client";
import { EMAIL_FROM, OTP_EMAIL_SUBJECT } from "@/config/backendless";
import { buildOtpEmailHtml } from "@/modules/otp/email-template";

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
): Promise<void> {
  const payload: EmailFrontendPayload = {
    status: "outbox",
    lead_id: leadId,
    sender_name: EMAIL_FROM.name,
    sender_email: EMAIL_FROM.address,
    to: toEmail,
    subject: OTP_EMAIL_SUBJECT,
    body_html: buildOtpEmailBody(otp),
  };

  await invokeCloudCode({
    service: "uiBuilder",
    method: "emailFrontend",
    body: payload,
    fetchImpl,
  });
}
