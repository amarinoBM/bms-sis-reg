import { EMAIL_FROM } from "@/config/backendless";

const BMS_LOGO_URL = "https://brilliantmicroschools.org/brand/brilliant-microschools-logo.png";

export const BMS_EMAIL_COLORS = {
  navy: "#12324a",
  navyMuted: "#456882",
  orange: "#d43d16",
  page: "#f0f5f8",
  card: "#ffffff",
  border: "#c5d9e4",
  support: "#e3f0f6",
} as const;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type BrandedEmailOptions = {
  title: string;
  paragraphs?: string[];
  middleHtml?: string;
  primaryLink?: { href: string; label: string };
  footerNote?: string;
};

export function buildBrandedEmailHtml(options: BrandedEmailOptions): string {
  const { navy, navyMuted, orange, page, card, border } = BMS_EMAIL_COLORS;

  const bodyParagraphs = (options.paragraphs ?? [])
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${navyMuted};">${paragraph}</p>`,
    )
    .join("");

  const middleHtml = options.middleHtml ?? "";

  const primaryLinkBlock = options.primaryLink
    ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:8px 0 0;">
          <tr>
            <td style="border-radius:8px;background-color:${orange};">
              <a
                href="${escapeHtml(options.primaryLink.href)}"
                style="display:inline-block;padding:12px 20px;font-size:15px;line-height:1.4;font-weight:700;color:#ffffff;text-decoration:none;"
              >
                ${escapeHtml(options.primaryLink.label)}
              </a>
            </td>
          </tr>
        </table>`
    : "";

  const footerNoteBlock = options.footerNote
    ? `<p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:${navyMuted};">${options.footerNote}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(options.title)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${page};font-family:Arial,Helvetica,sans-serif;color:${navy};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${page};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:${card};border:1px solid ${border};border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 20px;background-color:${card};border-bottom:1px solid ${border};">
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
                <p style="margin:0 0 12px;font-size:24px;line-height:1.3;font-weight:700;color:${navy};">
                  ${escapeHtml(options.title)}
                </p>
                ${bodyParagraphs}
                ${middleHtml}
                ${primaryLinkBlock}
                ${footerNoteBlock}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:${page};border-top:1px solid ${border};">
                <p style="margin:0;font-size:13px;line-height:1.5;color:${navyMuted};">
                  Thank you,<br />
                  ${escapeHtml(EMAIL_FROM.name)}<br />
                  <a href="mailto:${escapeHtml(EMAIL_FROM.address)}" style="color:${orange};text-decoration:none;">
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

export function buildHonorSignedEmailHtml(options: {
  parentName: string;
  studentName: string;
  documentUrl: string;
}): string {
  const parentName = escapeHtml(options.parentName);
  const studentName = escapeHtml(options.studentName);

  return buildBrandedEmailHtml({
    title: "Honor code signed",
    paragraphs: [
      `Dear ${parentName},`,
      `Thank you for signing the honor code for <strong style="color:${BMS_EMAIL_COLORS.navy};">${studentName}</strong>.`,
      "Your signed copy is saved in our records. Use the button below if you want to open or download it again.",
    ],
    primaryLink: {
      href: options.documentUrl,
      label: "View signed honor code",
    },
    footerNote:
      "If you did not sign this document, contact us at help@brilliantmicroschool.org.",
  });
}

export function buildTosSignedEmailHtml(options: {
  parentName: string;
  studentName: string;
  documentUrl: string;
}): string {
  const parentName = escapeHtml(options.parentName);
  const studentName = escapeHtml(options.studentName);

  return buildBrandedEmailHtml({
    title: "Terms of service signed",
    paragraphs: [
      `Dear ${parentName},`,
      `Thank you for signing the terms of service for <strong style="color:${BMS_EMAIL_COLORS.navy};">${studentName}</strong>.`,
      "Your signed copy is saved in our records. Use the button below if you want to open or download it again.",
    ],
    primaryLink: {
      href: options.documentUrl,
      label: "View signed terms",
    },
    footerNote:
      "If you did not sign this document, contact us at help@brilliantmicroschool.org.",
  });
}
