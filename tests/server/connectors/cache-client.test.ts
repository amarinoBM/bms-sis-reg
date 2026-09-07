import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { incrementRateLimit } from "@/server/connectors/backendless/cache-client";

describe("Backendless rate limits", () => {
  const originalRestUrl = process.env.BACKENDLESS_REST_URL;

  beforeEach(() => {
    process.env.BACKENDLESS_REST_URL = "https://api.backendless.com/app/key";
  });

  afterEach(() => {
    process.env.BACKENDLESS_REST_URL = originalRestUrl;
  });

  it("uses one atomic counter increment for each attempt", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toContain("/counters/");
      expect(init).toMatchObject({ method: "PUT" });
      return new Response(JSON.stringify(1), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    await incrementRateLimit("parentOTP-verify-fail-lead_test", 1800, 10, fetchImpl);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("blocks the attempt that exceeds the limit", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toContain("/counters/");
      expect(init).toMatchObject({ method: "PUT" });
      return new Response(JSON.stringify(11), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    await expect(
      incrementRateLimit("parentOTP-verify-fail-lead_test", 1800, 10, fetchImpl),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
