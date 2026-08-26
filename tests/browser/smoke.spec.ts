import { test, expect } from "@playwright/test";

test("home page loads the BMS registration shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Parent registration workspace" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start registration (OTP)" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Brilliant Microschools" })).toBeVisible();
  await expect(page.getByText("Student Registration")).toBeVisible();
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

test("students load route requires parent session", async ({ request }) => {
  const response = await request.get(
    "/api/students/load?lead_id=lead_test&student_name=Noah",
  );
  expect(response.status()).toBe(401);

  const body = await response.json();
  expect(body).toEqual({
    success: false,
    error: {
      code: "UNAUTHENTICATED",
      message: "Please sign in with your one-time code to continue.",
    },
  });
  expect(JSON.stringify(body)).not.toContain("stack");
});
