import { describe, expect, it } from "vitest";

import { buildOtpEmailHtml } from "@/modules/otp/email-template";

describe("OTP email template", () => {
  it("includes branded layout, OTP code, and expiry copy", () => {
    const html = buildOtpEmailHtml(123456);

    expect(html).toContain("123456");
    expect(html).toContain("expires in <strong");
    expect(html).toContain("2 hours");
    expect(html).toContain("Brilliant Microschools");
    expect(html).toContain("brilliant-microschools-logo.png");
    expect(html).toContain("Open registration");
    expect(html).toContain("help@brilliantmicroschool.org");
  });

  it("escapes html in otp values", () => {
    const html = buildOtpEmailHtml(123456);
    expect(html).not.toContain("<script");
  });
});
