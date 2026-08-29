import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "@/core/app-error";
import { sendParentOtp, verifyParentOtp } from "@/modules/otp/otp-service";

describe("otp service", () => {
  const originalAuthSecret = process.env.AUTH_SECRET;
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    process.env.AUTH_SECRET = "test-auth-secret-for-otp-service-tests";
    process.env.NEXT_PUBLIC_APP_URL = "https://bms-registration.vercel.app";
  });

  afterEach(() => {
    process.env.AUTH_SECRET = originalAuthSecret;
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  });

  it("rejects send when no parent email is on file", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/cache/parentOTP-last-send-lead_test") && !init?.method) {
        return new Response("null", { status: 404 });
      }
      if (url.includes("/data/ms_student_dir")) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      return new Response("not found", { status: 404 });
    });

    process.env.BACKENDLESS_REST_URL = "https://api.backendless.com/app/key";
    process.env.BACKENDLESS_CODE_URL = "https://api.backendless.com/app/code";

    await expect(sendParentOtp("lead_test", undefined, fetchImpl)).rejects.toMatchObject({
      code: "INVALID_INPUT",
      message: expect.stringContaining("parent email on file"),
    });
  });

  it("verifies trimmed OTP values against cache and deletes OTP after success", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (
        url.includes("/cache/parentOTP-lead_test") &&
        init?.method === "DELETE"
      ) {
        return new Response("", { status: 200 });
      }

      if (url.includes("/cache/parentOTP-lead_test") && !init?.method) {
        return new Response(JSON.stringify(654321), { status: 200 });
      }

      if (url.includes("/data/ms_student_dir")) {
        return new Response(
          JSON.stringify([
            {
              objectId: "obj-1",
              student_name: "Bennett Test",
              slots: [{ status: "enrolled" }],
            },
          ]),
          { status: 200 },
        );
      }

      return new Response("not found", { status: 404 });
    });

    process.env.BACKENDLESS_REST_URL = "https://api.backendless.com/app/key";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3010";

    const result = await verifyParentOtp("lead_test", " 654321 ", undefined, fetchImpl);

    expect(result.studentName).toBe("Bennett Test");
    expect(result.redirectUrl).toContain("student_name=Bennett%20Test");
    expect(result.students).toHaveLength(1);

    const deleteCalls = fetchImpl.mock.calls.filter(
      ([url, init]) =>
        String(url).includes("/cache/parentOTP-lead_test") && init?.method === "DELETE",
    );
    expect(deleteCalls).toHaveLength(1);
  });

  it("returns expired message when cache is empty", async () => {
    const fetchImpl = vi.fn(async () => new Response("null", { status: 404 }));

    process.env.BACKENDLESS_REST_URL = "https://api.backendless.com/app/key";

    await expect(verifyParentOtp("lead_test", "111111", undefined, fetchImpl)).rejects.toEqual(
      new AppError({
        code: "INVALID_INPUT",
        message: "One time pin expired. Please send a new one and try again",
      }),
    );
  });

  it("rejects resend within server cooldown window", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes("/cache/parentOTP-last-send-lead_test") && !init?.method) {
        return new Response(String(Date.now() - 5000), { status: 200 });
      }

      return new Response("not found", { status: 404 });
    });

    process.env.BACKENDLESS_REST_URL = "https://api.backendless.com/app/key";
    process.env.BACKENDLESS_CODE_URL = "https://api.backendless.com/app/code";

    await expect(sendParentOtp("lead_test", undefined, fetchImpl)).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: expect.stringMatching(/Please wait \d+ seconds/),
    });
  });
});
