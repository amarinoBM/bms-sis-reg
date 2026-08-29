import { test, expect } from "@playwright/test";
import { sealData } from "iron-session";
test.skip(!process.env.ADMIN_BROWSER_TESTS, "Run with npm run test:browser:admin against the synthetic backend.");

test("one-email families send as before without an email chooser", async ({ page, request }) => {
  await request.get("http://127.0.0.1:3039/_test/reset");
  let sendBody: Record<string, unknown> | undefined;
  await page.route("**/api/otp/send", async (route) => {
    sendBody = route.request().postDataJSON();
    await route.continue();
  });

  await page.goto("/reg?lead_id=lead_family");
  await expect(page.getByRole("radiogroup")).toHaveCount(0);
  await expect(page.getByText("p****t@example.test", { exact: true })).toBeVisible();
  const sent = page.waitForResponse("**/api/otp/send");
  await page.getByRole("button", { name: "Send login code" }).click();
  expect((await sent).status()).toBe(200);
  expect(sendBody).toEqual({ leadId: "lead_family" });

  const state = await (await request.get("http://127.0.0.1:3039/_test/state")).json();
  expect(state.emails).toHaveLength(1);
  expect(state.emails[0].to).toBe("parent@example.test");
});

test("multi-email families choose a masked destination using an opaque token", async ({ page, request }, testInfo) => {
  await request.get("http://127.0.0.1:3039/_test/reset");
  const rawEmails = ["first.parent@example.test", "second.parent@example.test"];
  let sendBody: Record<string, unknown> | undefined;
  await page.route("**/api/otp/send", async (route) => {
    sendBody = route.request().postDataJSON();
    await route.continue();
  });

  await page.goto("/reg?lead_id=lead_multi_email");
  const choices = page.getByRole("radiogroup", { name: "Where should we send the login code?" });
  await expect(choices).toBeVisible();
  await expect(page.getByLabel("f**********t@example.test")).toBeVisible();
  await expect(page.getByLabel("s***********t@example.test")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send login code" })).toBeDisabled();
  for (const rawEmail of rawEmails) {
    expect(await page.locator("body").textContent()).not.toContain(rawEmail);
    expect(await page.content()).not.toContain(rawEmail);
  }

  await page.getByLabel("s***********t@example.test").check();
  const sent = page.waitForResponse("**/api/otp/send");
  await page.getByRole("button", { name: "Send login code" }).click();
  expect((await sent).status()).toBe(200);
  expect(sendBody?.leadId).toBe("lead_multi_email");
  expect(sendBody?.emailChoiceToken).toMatch(/^[a-f0-9]{64}$/);
  expect(JSON.stringify(sendBody)).not.toContain(rawEmails[0]);
  expect(JSON.stringify(sendBody)).not.toContain(rawEmails[1]);

  const state = await (await request.get("http://127.0.0.1:3039/_test/state")).json();
  expect(state.emails).toHaveLength(1);
  expect(state.emails[0].to).toBe(rawEmails[1]);
  await page.screenshot({ path: testInfo.outputPath("parent-email-choice.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("families without an email see support instead of an active send action", async ({ page, request }) => {
  await request.get("http://127.0.0.1:3039/_test/reset");
  let sendRequests = 0;
  await page.route("**/api/otp/send", async (route) => {
    sendRequests += 1;
    await route.continue();
  });

  await page.goto("/reg?lead_id=lead_no_email");

  await expect(page.getByText("We could not find a parent email for this link.")).toBeVisible();
  await expect(page.getByRole("link", { name: "help@brilliantmicroschool.org" })).toHaveAttribute(
    "href",
    "mailto:help@brilliantmicroschool.org",
  );
  await expect(page.getByRole("button", { name: "Send login code" })).toBeDisabled();
  await expect(page.getByRole("radiogroup")).toHaveCount(0);
  expect(sendRequests).toBe(0);
});

test("search results open before the scan finishes and lead IDs work directly", async ({ page, request }, testInfo) => {
  await request.get("http://127.0.0.1:3039/_test/reset");
  await page.goto("/admin/login");
  await page.getByLabel("Work email").fill("am@brilliantmicroschool.org");
  await page.getByRole("button", { name: "Send login code" }).click();
  await expect(page.getByLabel("Login code")).toBeVisible();
  const { code } = await (await request.get("http://127.0.0.1:3039/_test/code")).json();
  await page.getByLabel("Login code").fill(code);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Find a registration" })).toBeVisible();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/admin/search", async (route) => {
    const input = route.request().postDataJSON();
    if (input.offset === 100) { await gate; await route.fulfill({ json: { success: true, data: { results: [], nextOffset: null } } }); return; }
    const response = await route.fetch();
    const body = await response.json();
    body.data.nextOffset = 100;
    await route.fulfill({ json: body });
  });
  try {
    await page.getByLabel("Search registrations").fill("Example");
    const continuing = page.waitForRequest((r) => r.url().endsWith("/api/admin/search") && r.postDataJSON().offset === 100);
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await continuing;
    const open = page.getByRole("button", { name: "View registration for Alex Example" });
    await expect(open).toBeEnabled();
    await page.screenshot({ path: testInfo.outputPath("admin-search-in-progress.png"), fullPage: true });
    await open.click();
    await expect(page.getByLabel("Nickname")).toBeVisible();
    release();
    await page.unrouteAll({ behavior: "wait" });
    await page.getByRole("button", { name: "Back to search" }).click();
    await page.getByLabel("Search registrations").fill("lead_family");
    await expect(page.getByRole("button", { name: /View registration for/ })).toHaveCount(0);
    const searched = page.waitForResponse("**/api/admin/search");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    expect((await searched).status()).toBe(200);
    await expect(page.getByRole("button", { name: /View registration for/ })).toHaveCount(2);
    await expect(page.getByRole("button", { name: "View registration for Taylor Example" })).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    // Changing the query cancels an old request and clears its visible results.
    let releaseOld!: () => void;
    const oldGate = new Promise<void>((resolve) => { releaseOld = resolve; });
    await page.route("**/api/admin/search", async (route) => {
      if (route.request().postDataJSON().query !== "old query") { await route.continue(); return; }
      await oldGate;
      await route.fulfill({ json: { success: true, data: { results: [{ objectId: "stale", leadId: "lead_stale", studentName: "Stale result", lastName: "", parentEmail: "", completed: false }], nextOffset: null } } });
    });
    try {
      await page.getByLabel("Search registrations").fill("old query");
      const pending = page.waitForRequest((r) => r.url().endsWith("/api/admin/search") && r.postDataJSON().query === "old query");
      await page.getByRole("button", { name: "Search", exact: true }).click();
      await pending;
      await expect(page.getByRole("button", { name: "Stop search" })).toBeEnabled();
      await page.getByLabel("Search registrations").fill("Taylor");
      await page.getByRole("button", { name: "Search", exact: true }).click();
      await expect(page.getByRole("button", { name: "View registration for Taylor Example" })).toBeEnabled();
      releaseOld();
      await expect(page.getByText("Stale result", { exact: true })).toHaveCount(0);
      await page.unrouteAll({ behavior: "wait" });
    } finally { releaseOld(); }
    // A failed continuation keeps usable partial results and labels them incomplete.
    await page.route("**/api/admin/search", async (route) => {
      if (route.request().postDataJSON().offset === 100) { await route.abort("failed"); return; }
      const body = await (await route.fetch()).json(); body.data.nextOffset = 100;
      await route.fulfill({ json: body });
    });
    await page.getByLabel("Search registrations").fill("Example");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Search could not finish" })).toContainText("results shown may be incomplete");
    await expect(page.getByRole("button", { name: "View registration for Alex Example" })).toBeEnabled();
    await page.unroute("**/api/admin/search");
  } finally { release(); }
});
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
  await page.getByLabel("Jump to section").selectOption("4");
  const interestAnswer = page.getByRole("textbox", { name: "What is Alex most interested in?" });
  const originalAnswer = "Sports: mostly swimming, but also building model rockets.\nMusic matters too.";
  await expect(interestAnswer).toHaveValue(originalAnswer);
  await expect(page.getByText("Saved answer", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("radio")).toHaveCount(0);
  await page.getByRole("checkbox", { name: /^Music / }).click();
  await expect(interestAnswer).toHaveValue(originalAnswer);
  const interestsSave = page.waitForResponse("**/api/admin/save");
  await page.getByRole("button", { name: "Save section" }).click();
  expect((await interestsSave).status()).toBe(200);
  await expect(interestAnswer).toBeDisabled();
  await expect(page.getByRole("checkbox", { name: /^Music / })).toBeDisabled();
  const interestState = await (await request.get("http://127.0.0.1:3039/_test/state")).json();
  expect(interestState.records[0].most_interested_in).toBe(originalAnswer);
  expect(interestState.records[0].interests).toHaveLength(1);
  await page.screenshot({ path: testInfo.outputPath("admin-interests.png"), fullPage: true });
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
  await page.getByLabel("Jump to section").selectOption("9");
  await expect(page.getByRole("link", { name: /Transcript file/ })).toHaveCount(1);
  for (let count = 2; count <= 3; count++) {
    await expect(page.getByRole("button", { name: "Add another file" })).toBeVisible();
    const uploaded = page.waitForResponse("**/api/admin/uploads");
    await page.locator("#transcript-upload").setInputFiles({ name: `record-${count}.pdf`, mimeType: "application/pdf", buffer: Buffer.from("%PDF synthetic") });
    expect((await uploaded).status()).toBe(200);
    await expect(page.getByRole("link", { name: /Transcript file/ })).toHaveCount(count);
  }
  await page.screenshot({ path: testInfo.outputPath("admin-transcripts.png"), fullPage: true });
  const transcriptSave = page.waitForResponse("**/api/admin/save");
  await page.getByRole("button", { name: "Save section" }).click();
  expect((await transcriptSave).status()).toBe(200);
  await expect(page.getByRole("button", { name: "Edit section" })).toBeVisible();
  await page.getByLabel("Jump to section").selectOption("8");
  await expect(page.getByRole("link", { name: /IEP or 504 file/ })).toHaveCount(2);
  for (const link of await page.getByRole("link", { name: /IEP or 504 file/ }).all()) {
    expect(await link.getAttribute("href")).toMatch(/^\/api\/admin\/document\?/);
  }
  await expect(page.getByRole("button", { name: "Replace current file" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("admin-iep.png"), fullPage: true });
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

test("parent edits free-text interests independently of optional categories", async ({ page, request, context }, testInfo) => {
  await request.get("http://127.0.0.1:3039/_test/reset");
  const value = await sealData({ leadId: "lead_family", studentName: "Alex", isLoggedIn: true }, { password: "synthetic-parent-browser-secret-32-characters!!" });
  await context.addCookies([{ name: "bms-sis-reg-parent", value, url: "http://127.0.0.1:3028", httpOnly: true, sameSite: "Lax" }]);
  await page.goto("/reg/sis?lead_id=lead_family&student_name=Alex");
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Next", exact: true }).click();
  const answer = page.getByRole("textbox", { name: "What is Alex most interested in?" });
  await expect(answer).toHaveValue("Sports: mostly swimming, but also building model rockets.\nMusic matters too.");
  await answer.fill("");
  await page.getByRole("checkbox", { name: /^Music / }).click();
  await expect(answer).toHaveValue("");
  await page.getByRole("button", { name: "Save section" }).click();
  await expect(answer).toBeEnabled();
  expect(await answer.evaluate((element: HTMLTextAreaElement) => element.validity.valueMissing)).toBe(true);
  const writtenAnswer = "Sports: swimming every weekend.\nAlso loves astronomy and piano.";
  await answer.fill(writtenAnswer);
  await page.getByRole("checkbox", { name: /^Music / }).click();
  await expect(answer).toHaveValue(writtenAnswer);
  const saved = page.waitForResponse("**/api/students/save");
  await page.getByRole("button", { name: "Save section" }).click();
  expect((await saved).status()).toBe(200);
  await expect(answer).toBeDisabled();
  const state = await (await request.get("http://127.0.0.1:3039/_test/state")).json();
  expect(state.records[0].most_interested_in).toBe(writtenAnswer);
  expect(state.records[0].interests).toEqual([]);
  await page.reload();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(answer).toHaveValue(writtenAnswer);
  await page.getByRole("button", { name: "Edit section" }).click();
  await expect(answer).toBeEnabled();
  await page.screenshot({ path: testInfo.outputPath("parent-interests.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("parent keeps draft answers during uploads and can add several transcripts", async ({ page, request, context }, testInfo) => {
  await request.get("http://127.0.0.1:3039/_test/reset");
  // Synthetic signed session: no production OTPs, credentials, or students.
  const value = await sealData({ leadId: "lead_family", studentName: "Alex", isLoggedIn: true }, { password: "synthetic-parent-browser-secret-32-characters!!" });
  await context.addCookies([{ name: "bms-sis-reg-parent", value, url: "http://127.0.0.1:3028", httpOnly: true, sameSite: "Lax" }]);
  await page.goto("/reg/sis?lead_id=lead_family&student_name=Alex");
  await page.getByLabel("Nickname").fill("Draft nickname");
  const birthUpload = page.waitForResponse("**/api/uploads");
  await page.locator("#studentBirthCert").setInputFiles({ name: "birth.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF synthetic") });
  expect((await birthUpload).status()).toBe(200);
  await expect(page.getByLabel("Nickname")).toBeEnabled();
  await expect(page.getByLabel("Nickname")).toHaveValue("Draft nickname");
  const save = page.waitForResponse("**/api/students/save");
  await page.getByRole("button", { name: "Save section" }).click();
  expect((await save).status()).toBe(200);
  for (let i = 0; i < 7; i++) await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("link", { name: /IEP or 504 file/ })).toHaveCount(2);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  for (let count = 2; count <= 3; count++) {
    await expect(page.getByRole("button", { name: "Add another file" })).toBeVisible();
    const upload = page.waitForResponse("**/api/uploads");
    await page.locator("#transcript-upload").setInputFiles({ name: `transcript-${count}.pdf`, mimeType: "application/pdf", buffer: Buffer.from("%PDF synthetic") });
    expect((await upload).status()).toBe(200);
    await expect(page.getByRole("link", { name: /Transcript file/ })).toHaveCount(count);
    await expect(page.getByRole("button", { name: "Add another file" })).toBeEnabled();
  }
  await page.locator("#transcript-upload").setInputFiles({ name: "oversized.pdf", mimeType: "application/pdf", buffer: Buffer.alloc(4 * 1024 * 1024 + 1) });
  await expect(page.getByText("File is too large. Maximum size is 4 MB.")).toBeVisible();
  const state = await (await request.get("http://127.0.0.1:3039/_test/state")).json();
  expect(state.records[0].transcriptFiles).toHaveLength(3);
  expect(state.records[0].student_nick_name).toBe("Draft nickname");
  expect(state.records[1].transcriptFiles).toBeUndefined();
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("link", { name: /Transcript file/ })).toHaveCount(3);
  const transcriptSave = page.waitForResponse("**/api/students/save");
  await page.getByRole("button", { name: "Save section" }).click();
  expect((await transcriptSave).status()).toBe(200);
  await expect(page.getByRole("button", { name: "Edit section" })).toBeVisible();
  const finalState = await (await request.get("http://127.0.0.1:3039/_test/state")).json();
  expect(finalState.records[0]["6.1disabled"]).toBe(true);
  expect(finalState.records[0].transcriptFiles).toHaveLength(3);
  await page.screenshot({ path: testInfo.outputPath("parent-transcripts.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
