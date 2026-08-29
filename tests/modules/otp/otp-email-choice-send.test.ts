import { beforeEach, describe, expect, it, vi } from "vitest";

import { sendParentOtp } from "@/modules/otp/otp-service";
import { resolveParentEmailChoice } from "@/server/auth/parent-email-choice";
import { sendOtpEmail } from "@/server/connectors/backendless/email-client";
import {
  assertOtpResendCooldown,
  assertOtpSendAllowed,
  putCacheValue,
  recordOtpSend,
} from "@/server/connectors/backendless/cache-client";

vi.mock("@/server/auth/parent-email-choice", () => ({
  resolveParentEmailChoice: vi.fn(),
}));

vi.mock("@/server/connectors/backendless/email-client", () => ({
  sendOtpEmail: vi.fn(),
}));

vi.mock("@/server/connectors/backendless/cache-client", () => ({
  assertOtpResendCooldown: vi.fn(),
  assertOtpSendAllowed: vi.fn(),
  putCacheValue: vi.fn(),
  recordOtpSend: vi.fn(),
  parentOtpCacheKey: (leadId: string) => `parentOTP-${leadId}`,
}));

describe("parent OTP email choice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("BACKENDLESS_CODE_URL", "https://api.backendless.test/code");
    vi.mocked(resolveParentEmailChoice).mockResolvedValue("second@example.test");
    vi.mocked(assertOtpResendCooldown).mockResolvedValue(undefined);
    vi.mocked(assertOtpSendAllowed).mockResolvedValue(undefined);
    vi.mocked(putCacheValue).mockResolvedValue(undefined);
    vi.mocked(recordOtpSend).mockResolvedValue(undefined);
    vi.mocked(sendOtpEmail).mockResolvedValue(undefined);
  });

  it("passes the opaque token through and sends only to the freshly resolved address", async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const token = "a".repeat(64);

    await sendParentOtp("lead_family", token, fetchImpl);

    expect(resolveParentEmailChoice).toHaveBeenCalledWith(
      "lead_family",
      token,
      fetchImpl,
    );
    expect(sendOtpEmail).toHaveBeenCalledWith(
      "lead_family",
      "second@example.test",
      expect.any(Number),
      fetchImpl,
    );
  });
});
