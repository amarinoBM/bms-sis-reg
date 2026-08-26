import { describe, expect, it, vi } from "vitest";

import { postApi } from "@/lib/client-api";

describe("client-api", () => {
  it("throws ApiClientError with server message on failure responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "Enter the login code from your email.",
        },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      postApi("/api/otp/verify", { leadId: "lead_test", otp: "000000" }),
    ).rejects.toMatchObject({
      message: "Enter the login code from your email.",
      code: "INVALID_INPUT",
      status: 400,
    });
  });

  it("throws ApiClientError when response body is not JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("invalid json");
      },
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(postApi("/api/otp/send", { leadId: "lead_test" })).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Try again or contact support.",
      status: 500,
    });
  });
});
