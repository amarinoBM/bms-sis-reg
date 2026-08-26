import { describe, expect, it, vi } from "vitest";

import { AppError } from "@/core/app-error";
import { sendParentOtp, verifyParentOtp } from "@/modules/otp/otp-service";

describe("otp service", () => {
  it("rejects empty email on send", async () => {
    await expect(sendParentOtp("lead_test", "   ")).rejects.toMatchObject({
      code: "INVALID_INPUT",
      message: "You need to enter an email to proceed.",
    });
  });

  it("rejects email containing spaces", async () => {
    await expect(sendParentOtp("lead_test", "bad @email.com")).rejects.toMatchObject({
      code: "INVALID_INPUT",
      message: "Check email if it's correct.",
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

      if (url.includes("/cache/parentOTP-send-count-lead_test") && init?.method === "PUT") {
        return new Response("", { status: 200 });
      }

      if (url.includes("/cache/parentOTP-last-send-lead_test") && !init?.method) {
        return new Response(String(Date.now() - 5000), { status: 200 });
      }

      return new Response("not found", { status: 404 });
    });

    process.env.BACKENDLESS_REST_URL = "https://api.backendless.com/app/key";
    process.env.BACKENDLESS_CODE_URL = "https://api.backendless.com/app/code";

    await expect(sendParentOtp("lead_test", "parent@example.com", fetchImpl)).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: expect.stringMatching(/Please wait \d+ seconds/),
    });
  });
});
