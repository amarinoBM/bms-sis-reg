import { EMAIL_FROM } from "@/config/backendless";
import { getServerEnv } from "@/config/env";

const BMS_LOGO_URL = "https://brilliantmicroschools.org/brand/brilliant-microschools-logo.png";

const COLORS = {
  navy: "#12324a",
  navyMuted: "#456882",
  orange: "#d43d16",
  page: "#f0f5f8",
  card: "#ffffff",
  border: "#c5d9e4",
  support: "#e3f0f6",
} as const;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildOtpEmailHtml(otp: number): string {
  const otpDisplay = escapeHtml(String(otp));
  const registrationUrl = getServerEnv().publicAppUrl;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your Brilliant Microschools login code</title>
  </head>
  <body style="margin:0;padding:0;background-color:${COLORS.page};font-family:Arial,Helvetica,sans-serif;color:${COLORS.navy};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${COLORS.page};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:${COLORS.card};border:1px solid ${COLORS.border};border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 20px;background-color:${COLORS.card};border-bottom:1px solid ${COLORS.border};">
                <img
                  src="${BMS_LOGO_URL}"
                  alt="Brilliant Microschools"
                  width="220"
                  height="44"
                  style="display:block;width:220px;height:auto;border:0;"
                />
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 12px;font-size:24px;line-height:1.3;font-weight:700;color:${COLORS.navy};">
                  Your login code
                </p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${COLORS.navyMuted};">
                  Use this one-time code to open the Student Information form and continue your registration.
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center" style="padding:20px;background-color:${COLORS.support};border:1px solid ${COLORS.border};border-radius:10px;">
                      <p style="margin:0 0 8px;font-size:12px;line-height:1.4;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${COLORS.navyMuted};">
                        One-time pin
                      </p>
                      <p style="margin:0;font-size:36px;line-height:1.1;font-weight:700;color:${COLORS.orange};font-family:Consolas,Monaco,monospace;">
                        ${otpDisplay}
                      </p>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:${COLORS.navyMuted};">
                  Enter this code on the registration page when prompted. The code expires in <strong style="color:${COLORS.navy};">2 hours</strong>.
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:28px;">
                  <tr>
                    <td style="border-radius:8px;background-color:${COLORS.orange};">
                      <a
                        href="${escapeHtml(registrationUrl)}"
                        style="display:inline-block;padding:12px 20px;font-size:15px;line-height:1.4;font-weight:700;color:#ffffff;text-decoration:none;"
                      >
                        Open registration
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:${COLORS.navyMuted};">
                  If you did not request this code, you can ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:${COLORS.page};border-top:1px solid ${COLORS.border};">
                <p style="margin:0;font-size:13px;line-height:1.5;color:${COLORS.navyMuted};">
                  Thank you,<br />
                  ${escapeHtml(EMAIL_FROM.name)}<br />
                  <a href="mailto:${escapeHtml(EMAIL_FROM.address)}" style="color:${COLORS.orange};text-decoration:none;">
                    ${escapeHtml(EMAIL_FROM.address)}
                  </a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
