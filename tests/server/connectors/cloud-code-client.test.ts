import { afterEach, describe, expect, it, vi } from "vitest";

import { clearBackendlessGuestToken } from "@/server/connectors/backendless/guest-session";
import { invokeCloudCode } from "@/server/connectors/backendless/cloud-code-client";

describe("invokeCloudCode", () => {
  afterEach(() => {
    clearBackendlessGuestToken();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("sends a Backendless guest user-token on Cloud Code calls", async () => {
    vi.stubEnv(
      "BACKENDLESS_REST_URL",
      "https://api.backendless.com/test-app/test-key",
    );
    vi.stubEnv(
      "BACKENDLESS_CODE_URL",
      "https://api.backendless.com/test-app/test-key",
    );

    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/users/register/guest")) {
        return new Response(JSON.stringify({ "user-token": "guest-token-abc" }), {
          status: 200,
        });
      }

      if (url.endsWith("/services/BG_30_SIS_SECURITY/SISSecureProxyPost")) {
        const headers = new Headers(init?.headers);
        expect(headers.get("user-token")).toBe("guest-token-abc");
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    const result = await invokeCloudCode<{ ok: boolean }>({
      service: "BG_30_SIS_SECURITY",
      method: "SISSecureProxyPost",
      body: JSON.stringify({ action: "docsBatchUpdate", payload: {} }),
      fetchImpl,
    });

    expect(result.ok).toBe(true);
  });
});
