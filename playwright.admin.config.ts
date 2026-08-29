import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser", testMatch: ["admin-flow.spec.ts", "parent-email-repair.spec.ts"], fullyParallel: false, workers: 1,
  use: { baseURL: "http://127.0.0.1:3028", trace: "retain-on-failure" },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"] } }, { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } }],
  webServer: [
    { command: "node --import tsx tests/fixtures/admin-http-server.ts", url: "http://127.0.0.1:3039/health", reuseExistingServer: false },
    { command: "node node_modules/next/dist/bin/next start -p 3028", url: "http://127.0.0.1:3028/api/health", reuseExistingServer: false,
      env: { ADMIN_BROWSER_TESTS: "true", ADMIN_ACCESS_ENABLED: "true", ADMIN_AUTH_SECRET: "synthetic-admin-browser-secret-32-characters!!", ADMIN_AUDIT_TABLE: "reg_admin_audit",
        ADMIN_EMAIL_LEAD_ID: "lead_adminDelivery",
        AUTH_SECRET: "synthetic-parent-browser-secret-32-characters!!", NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3028",
        BACKENDLESS_REST_URL: "http://127.0.0.1:3039/rest", BACKENDLESS_CODE_URL: "http://127.0.0.1:3039/code", EXTERNAL_WRITES_ENABLED: "true" } },
  ],
});
