import { invokeCloudCode } from "@/server/connectors/backendless/cloud-code-client";
import { EMAIL_FROM, OTP_EMAIL_SUBJECT } from "@/config/backendless";

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
  return [
    `Your OTP is ${otp}`,
    "<br><br>Please enter your OTP in the corresponding text box to access the Student Information Form.",
    "<br>Please note that the OTP will expire in 2 hours<br><br>",
    "Thank you!",
  ].join("");
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
