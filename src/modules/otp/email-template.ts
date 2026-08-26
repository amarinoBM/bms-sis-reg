import {
  buildBrandedEmailHtml,
  escapeHtml,
  BMS_EMAIL_COLORS,
} from "@/modules/email/bms-email-template";
import { OTP_CACHE_TTL_SECONDS } from "@/config/backendless";

function otpExpiryLabel(): string {
  const minutes = OTP_CACHE_TTL_SECONDS / 60;
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }

  return `${minutes} minutes`;
}

export function buildOtpEmailHtml(otp: number): string {
  const otpDisplay = escapeHtml(String(otp));
  const { navy, navyMuted, orange, border, support } = BMS_EMAIL_COLORS;

  const middleHtml = `
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${navyMuted};">
      Enter this code on the registration page you already have open.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center" style="padding:20px;background-color:${support};border:1px solid ${border};border-radius:10px;">
          <p style="margin:0 0 8px;font-size:12px;line-height:1.4;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${navyMuted};">
            One-time pin
          </p>
          <p style="margin:0;font-size:36px;line-height:1.1;font-weight:700;color:${orange};font-family:Consolas,Monaco,monospace;">
            ${otpDisplay}
          </p>
        </td>
      </tr>
    </table>
    <p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:${navyMuted};">
      The code expires in <strong style="color:${navy};">${escapeHtml(otpExpiryLabel())}</strong>.
    </p>`;

  return buildBrandedEmailHtml({
    title: "Your login code",
    middleHtml,
    footerNote: "If you did not request this code, you can ignore this email.",
  });
}
