import { describe, expect, it } from "vitest";

import { getServerEnv, isDemoModeEnabled } from "@/config/env";

describe("server env", () => {
  it("reads external write guard from environment", () => {
    const env = getServerEnv({
      NODE_ENV: "test",
      BACKENDLESS_REST_URL: "https://api.backendless.com/app/key",
      EXTERNAL_WRITES_ENABLED: "true",
    });

    expect(env.externalWritesEnabled).toBe(true);
    expect(env.backendlessRestUrl).toBe("https://api.backendless.com/app/key");
  });

  it("defaults external writes to disabled", () => {
    const env = getServerEnv({
      NODE_ENV: "test",
      BACKENDLESS_REST_URL: "https://api.backendless.com/app/key",
    });

    expect(env.externalWritesEnabled).toBe(false);
  });

  it("requires AUTH_SECRET in production", () => {
    expect(() =>
      getServerEnv({
        NODE_ENV: "production",
        BACKENDLESS_REST_URL: "https://api.backendless.com/app/key",
      }),
    ).toThrow("AUTH_SECRET is required in production.");
  });

  it("requires Cloud Code URL and public app URL in production", () => {
    expect(() =>
      getServerEnv({
        NODE_ENV: "production",
        BACKENDLESS_REST_URL: "https://api.backendless.com/app/key",
        AUTH_SECRET: "development-only-secret-min-32-chars!!",
      }),
    ).toThrow("BACKENDLESS_CODE_URL is required in production.");
  });

  it("allows demo mode only outside production", () => {
    expect(isDemoModeEnabled({ NODE_ENV: "development", DEMO_MODE: "true" })).toBe(true);
    expect(isDemoModeEnabled({ NODE_ENV: "test", DEMO_MODE: "true" })).toBe(true);
    expect(isDemoModeEnabled({ NODE_ENV: "production", DEMO_MODE: "true" })).toBe(false);
    expect(isDemoModeEnabled({ NODE_ENV: "development", DEMO_MODE: "false" })).toBe(false);
  });
});
