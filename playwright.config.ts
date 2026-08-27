import { defineConfig, devices } from "@playwright/test";

const browserTestAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3010";

export default defineConfig({
  testDir: "tests/browser",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: browserTestAppUrl,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run start",
    url: `${browserTestAppUrl}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      AUTH_SECRET:
        process.env.AUTH_SECRET ??
        "ci-browser-test-auth-secret-min-32-chars!!",
      NEXT_PUBLIC_APP_URL: browserTestAppUrl,
      BACKENDLESS_CODE_URL:
        process.env.BACKENDLESS_CODE_URL ??
        "https://api.backendless.com/ci-test-app/ci-test-code",
      BACKENDLESS_REST_URL:
        process.env.BACKENDLESS_REST_URL ??
        "https://api.backendless.com/ci-test-app/ci-test-key",
      EXTERNAL_WRITES_ENABLED: process.env.EXTERNAL_WRITES_ENABLED ?? "false",
    },
  },
});
