import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearBackendlessGuestToken,
  getBackendlessGuestToken,
} from "@/server/connectors/backendless/guest-session";

describe("getBackendlessGuestToken", () => {
  afterEach(() => {
    clearBackendlessGuestToken();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("registers a guest and caches the user-token", async () => {
    vi.stubEnv(
      "BACKENDLESS_REST_URL",
      "https://api.backendless.com/test-app/test-key",
    );

    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/users/register/guest")) {
        return new Response(JSON.stringify({ "user-token": "guest-token-1" }), {
          status: 200,
        });
      }

      throw new Error(`Unexpected fetch: ${url} ${init?.method ?? "GET"}`);
    });

    const first = await getBackendlessGuestToken(fetchImpl);
    const second = await getBackendlessGuestToken(fetchImpl);

    expect(first).toBe("guest-token-1");
    expect(second).toBe("guest-token-1");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("clears cache so the next call registers again", async () => {
    vi.stubEnv(
      "BACKENDLESS_REST_URL",
      "https://api.backendless.com/test-app/test-key",
    );

    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/users/register/guest")) {
        return new Response(JSON.stringify({ "user-token": "guest-token-2" }), {
          status: 200,
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    await getBackendlessGuestToken(fetchImpl);
    clearBackendlessGuestToken();
    await getBackendlessGuestToken(fetchImpl);

    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
