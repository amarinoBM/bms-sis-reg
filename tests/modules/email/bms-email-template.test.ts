import { describe, expect, it } from "vitest";

import {
  buildHonorSignedEmailHtml,
  buildTosSignedEmailHtml,
} from "@/modules/email/bms-email-template";

describe("BMS branded document emails", () => {
  it("builds honor signed email with branded layout and document link", () => {
    const html = buildHonorSignedEmailHtml({
      parentName: "Jane Doe",
      studentName: "Test Josiah",
      documentUrl: "https://drive.google.com/file/d/honor123/view",
    });

    expect(html).toContain("Honor code signed");
    expect(html).toContain("Jane Doe");
    expect(html).toContain("Test Josiah");
    expect(html).toContain("View signed honor code");
    expect(html).toContain("https://drive.google.com/file/d/honor123/view");
    expect(html).toContain("brilliant-microschools-logo.png");
  });

  it("builds TOS signed email with branded layout and document link", () => {
    const html = buildTosSignedEmailHtml({
      parentName: "Jane Doe",
      studentName: "Test Madilyn",
      documentUrl: "https://drive.google.com/file/d/tos456/view",
    });

    expect(html).toContain("Terms of service signed");
    expect(html).toContain("Jane Doe");
    expect(html).toContain("Test Madilyn");
    expect(html).toContain("View signed terms");
    expect(html).toContain("https://drive.google.com/file/d/tos456/view");
    expect(html).toContain("brilliant-microschools-logo.png");
  });

  it("escapes html in parent and student names", () => {
    const html = buildHonorSignedEmailHtml({
      parentName: "<script>alert(1)</script>",
      studentName: "Kid & Co",
      documentUrl: "https://example.com/doc",
    });

    expect(html).not.toContain("<script");
    expect(html).toContain("Kid &amp; Co");
  });
});
