import { expect, test } from "@playwright/test";
import { sealData } from "iron-session";

test.skip(!process.env.ADMIN_BROWSER_TESTS, "Run against the synthetic registration backend.");

async function signInAsParent(
  context: import("@playwright/test").BrowserContext,
  leadId: string,
  studentName: string,
) {
  const value = await sealData(
    { leadId, studentName, isLoggedIn: true },
    { password: "synthetic-parent-browser-secret-32-characters!!" },
  );
  await context.addCookies([{
    name: "bms-sis-reg-parent",
    value,
    url: "http://127.0.0.1:3028",
    httpOnly: true,
    sameSite: "Lax",
  }]);
}

test("prefills and repairs a legacy-only parent email", async ({ page, request, context }) => {
  await request.get("http://127.0.0.1:3039/_test/reset");
  await signInAsParent(context, "lead_legacy_email", "Legacy");
  await page.goto("/reg/sis?lead_id=lead_legacy_email&student_name=Legacy");
  await page.getByRole("button", { name: "Next", exact: true }).click();

  await expect(page.getByText("Email found in an older registration")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email" })).toHaveValue("legacy.parent@example.test");
  const saved = page.waitForResponse("**/api/students/save");
  await page.getByRole("button", { name: "Save section" }).click();
  expect((await saved).status()).toBe(200);

  const state = await (await request.get("http://127.0.0.1:3039/_test/state")).json();
  const repaired = state.records.find((row: { objectId: string }) => row.objectId === "student-7");
  expect(repaired.parent_email).toBe("legacy.parent@example.test");
  expect(repaired.email).toBe("legacy.parent@example.test");
});

test("lets a parent choose the primary address without losing the other address", async ({ page, request, context }) => {
  await request.get("http://127.0.0.1:3039/_test/reset");
  await signInAsParent(context, "lead_conflicting_email", "Conflict");
  await page.goto("/reg/sis?lead_id=lead_conflicting_email&student_name=Conflict");
  await page.getByRole("button", { name: "Next", exact: true }).click();

  await expect(page.getByText("Choose the main parent email")).toBeVisible();
  await page.getByLabel("l***********t@example.test").check();
  await expect(page.getByRole("textbox", { name: "Email" })).toHaveValue("legacy.parent@example.test");
  const saved = page.waitForResponse("**/api/students/save");
  await page.getByRole("button", { name: "Save section" }).click();
  expect((await saved).status()).toBe(200);

  const state = await (await request.get("http://127.0.0.1:3039/_test/state")).json();
  const repaired = state.records.find((row: { objectId: string }) => row.objectId === "student-8");
  expect(repaired.parent_email).toBe("legacy.parent@example.test");
  expect(repaired.email).toBe("current.parent@example.test");
});
