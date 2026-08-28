import { test, expect } from "@playwright/test";
test.skip(!process.env.ADMIN_BROWSER_TESTS, "Run with npm run test:browser:admin against the synthetic backend.");
test("admin signs in, searches, edits, switches students, and signs out", async ({ page, request }, testInfo) => {
  await request.get("http://127.0.0.1:3039/_test/reset");
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("link", { name: "Admin sign in" }).click();
  await expect(page.getByRole("heading", { name: "Admin sign in" })).toBeVisible();
  await page.getByLabel("Work email").fill("am@brilliantmicroschool.org");
  await page.getByRole("button", { name: "Send login code" }).click();
  await expect(page.getByLabel("Login code")).toBeVisible();
  const { code } = await (await request.get("http://127.0.0.1:3039/_test/code")).json();
  await page.getByLabel("Login code").fill(code);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Find a registration" })).toBeVisible();
  await page.getByLabel("Search registrations").fill("Example");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("button", { name: "View registration for Alex Example" }).click();
  await expect(page.getByText("Admin · View and edit")).toBeVisible();
  await page.getByLabel("Nickname").fill("Lex");
  for (const navigate of [
    () => page.getByLabel("Jump to section").selectOption("2"),
    () => page.getByLabel("Student", { exact: true }).selectOption("student-2"),
    () => page.getByRole("button", { name: "Back to search" }).click(),
    () => page.getByRole("button", { name: "Sign out", exact: true }).click(),
    () => page.getByRole("link", { name: "Admin sign in" }).click(),
  ]) {
    page.once("dialog", (dialog) => dialog.dismiss());
    await navigate();
    await expect(page.getByLabel("Nickname")).toHaveValue("Lex");
    await expect(page.getByLabel("Jump to section")).toHaveValue("1");
    await expect(page.getByLabel("Student", { exact: true })).toHaveValue("student-1");
  }

  let releaseUpload!: () => void;
  const uploadGate = new Promise<void>((resolve) => { releaseUpload = resolve; });
  await page.route("**/api/admin/uploads", async (route) => { await uploadGate; await route.continue(); });
  const uploadFinished = page.waitForResponse("**/api/admin/uploads");
  await page.locator("#studentBirthCert").setInputFiles({ name: "synthetic-birth.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 synthetic fixture") });
  await expect(page.getByLabel("Student", { exact: true })).toBeDisabled();
  await expect(page.getByLabel("Jump to section")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Back to search" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Sign out", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Save section" })).toBeDisabled();
  releaseUpload();
  expect((await uploadFinished).status()).toBe(200);
  await page.unroute("**/api/admin/uploads");
  await expect(page.getByLabel("Nickname")).toHaveValue("Lex");
  await expect(page.getByLabel("Nickname")).toBeEnabled();
  await expect(page.getByText("synthetic-birth.pdf", { exact: true })).toBeVisible();

  let releaseSave!: () => void;
  const saveGate = new Promise<void>((resolve) => { releaseSave = resolve; });
  await page.route("**/api/admin/save", async (route) => { await saveGate; await route.continue(); });
  const saveFinished = page.waitForResponse("**/api/admin/save");
  await page.getByRole("button", { name: "Save section" }).click();
  await expect(page.getByLabel("Student", { exact: true })).toBeDisabled();
  await expect(page.getByLabel("Jump to section")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Back to search" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Sign out", exact: true })).toBeDisabled();
  releaseSave();
  expect((await saveFinished).status()).toBe(200);
  await page.unroute("**/api/admin/save");
  await expect(page.getByRole("button", { name: "Edit section" })).toBeEnabled();
  await expect(page.getByLabel("Student", { exact: true })).toBeEnabled();
  const mixedState = await (await request.get("http://127.0.0.1:3039/_test/state")).json();
  expect(mixedState.records[0].student_nick_name).toBe("Lex");
  expect(mixedState.records[0].studentBirthCert).toMatch(/^https:\/\/drive\.google\.com\//);
  expect(mixedState.records[0].studentBirthCert).not.toContain("synthetic-birth/view");
  await page.getByLabel("Jump to section").selectOption("2");
  await expect(page.getByLabel("Email", { exact: true })).toBeDisabled();
  await expect(page.getByText("Parent sign-in email is locked in admin mode.", { exact: false })).toBeVisible();
  await page.getByLabel("Jump to section").selectOption("11");
  await expect(page.getByRole("button", { name: "Edit section" })).toBeVisible();
  await page.getByRole("button", { name: "Edit section" }).click();
  await page.getByRole("combobox", { name: "Computer system" }).click();
  await page.getByRole("option", { name: "MacOS Computer", exact: true }).click();
  await page.getByRole("button", { name: "Save section" }).click();
  await expect(page.getByRole("button", { name: "Edit section" })).toBeVisible();
  const state = await (await request.get("http://127.0.0.1:3039/_test/state")).json();
  expect(state.records[0].computer_system).toBe("MacOS Computer");
  expect(state.audit.some((a: { event: string }) => a.event === "save_verified")).toBe(true);
  await page.getByLabel("Jump to section").selectOption("12");
  await expect(page.getByText("Signed by the family.", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open signed document" })).toBeVisible();
  await expect(page.getByRole("button", { name: /sign honor|submit registration/i })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("admin-form.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByLabel("Student", { exact: true }).selectOption("student-2");
  await expect(page.getByRole("heading", { name: "Taylor", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Back to search" }).click();
  await expect(page.getByLabel("Search registrations")).toHaveValue("Example");
  await expect(page.getByRole("button", { name: "View registration for Alex Example" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("admin-search.png"), fullPage: true });
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Admin sign in" })).toBeVisible();
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  expect(errors).toEqual([]);
});
