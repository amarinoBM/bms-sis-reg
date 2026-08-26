import { test, expect } from "@playwright/test";

test("home page loads the BMS registration shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Parent registration workspace" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start registration (OTP)" })).toBeVisible();
  await expect(page.getByText("BMS Student Registration")).toBeVisible();
});

test("health route returns typed success JSON", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();

  const body = await response.json();
  expect(body).toEqual({
    success: true,
    data: {
      status: "ok",
      app: "bms-sis-reg",
    },
  });
});

test("sample error route returns safe typed failure JSON", async ({ request }) => {
  const response = await request.get("/api/foundation/sample-error");
  expect(response.status()).toBe(403);

  const body = await response.json();
  expect(body).toEqual({
    success: false,
    error: {
      code: "FORBIDDEN",
      message: "Sample route for typed API failures.",
    },
  });
  expect(JSON.stringify(body)).not.toContain("stack");
});
