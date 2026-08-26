import { describe, expect, it } from "vitest";

import { getServerEnv } from "@/config/env";

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
});
