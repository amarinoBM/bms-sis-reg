import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
const jar = vi.hoisted(() => new Map<string, string>());
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => jar.has(name) ? { value: jar.get(name) } : undefined,
    set: (name: string, value: string) => { jar.set(name, value); } }),
}));
import { createAdminBackend } from "../../fixtures/admin-backend";
import { sendAdminOtp, verifyAdminOtp } from "@/server/admin/otp";
import { createAdminSession, requireAdminSession, destroyAdminSession, ADMIN_COOKIE } from "@/server/admin/session";
import { ADMIN_EMAIL, ADMIN_IDLE_MS, ADMIN_MAX_MS } from "@/modules/admin/policy";
import { clearBackendlessGuestToken } from "@/server/connectors/backendless/guest-session";
import { sendOtpEmail } from "@/server/connectors/backendless/email-client";
import { writeAdminValue } from "@/server/admin/store";
import { POST as search } from "@/app/api/admin/search/route";
import { POST as load } from "@/app/api/admin/registration/route";
import { POST as save } from "@/app/api/admin/save/route";
import { POST as upload } from "@/app/api/admin/uploads/route";
import { POST as sendCode } from "@/app/api/admin/otp/send/route";
import { POST as verifyCode } from "@/app/api/admin/otp/verify/route";
import { POST as signHonor } from "@/app/api/honor/sign/route";
import { POST as signTos } from "@/app/api/tos/sign/route";
import { POST as submit } from "@/app/api/sis/complete/route";
import { GET as document } from "@/app/api/admin/document/route";
import { setParentSession } from "@/server/auth/parent-session";
import { findSuggestedParentEmail } from "@/modules/students/repository";
import { flattenFormValues } from "@/modules/wizard/step-schemas";

let backend: ReturnType<typeof createAdminBackend>;
const req = (path: string, body: unknown, origin = "http://localhost:3010") => new Request("http://localhost:3010" + path, {
  method: "POST", headers: { "Content-Type": "application/json", ...(origin ? { origin } : {}) }, body: JSON.stringify(body),
});
const target = { leadId: "lead_family", objectId: "student-1" };
const technology = { computer_system: "Mac", starting_date: Date.UTC(2026, 8, 1), length_of_staying: "The full school year" };
beforeEach(() => {
  vi.stubEnv("ADMIN_ACCESS_ENABLED", "true");
  vi.stubEnv("ADMIN_AUTH_SECRET", "admin-test-secret-32-characters-or-more!!");
  vi.stubEnv("ADMIN_AUDIT_TABLE", "reg_admin_audit");
  vi.stubEnv("ADMIN_EMAIL_LEAD_ID", "lead_adminDelivery");
  vi.stubEnv("AUTH_SECRET", "parent-test-secret-32-characters-or-more!!");
  vi.stubEnv("BACKENDLESS_REST_URL", "http://backend.test/rest");
  vi.stubEnv("BACKENDLESS_CODE_URL", "http://backend.test/code");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3010");
  vi.stubEnv("EXTERNAL_WRITES_ENABLED", "true");
  jar.clear(); clearBackendlessGuestToken();
  backend = createAdminBackend(); vi.stubGlobal("fetch", backend.fetch);
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.useRealTimers(); });
async function otp() {
  const result = await sendAdminOtp(ADMIN_EMAIL);
  const code = String(backend.emails.at(-1)?.body_html).match(/>\s*(\d{6})\s*</)?.[1];
  expect(code).toBeTruthy();
  return { ...result, code: code! };
}
async function loaded() {
  const response = await load(req("/api/admin/registration", target));
  expect(response.status).toBe(200);
  return (await response.json()).data;
}

describe("admin authentication with the real store and session chain", () => {
  it("does not send mail or disclose authorization for other addresses", async () => {
    expect(await sendAdminOtp("someone@example.test")).toMatchObject({ cooldownSeconds: 30 });
    expect(backend.emails).toHaveLength(0);
    expect(backend.records[0].updated).toBe(1);
  });
  it("issues an admin-only code once, including simultaneous redemption attempts", async () => {
    const challenge = await otp();
    expect(backend.emails[0]).toMatchObject({ to: ADMIN_EMAIL, lead_id: "lead_adminDelivery" });
    const results = await Promise.allSettled([
      verifyAdminOtp(ADMIN_EMAIL, challenge.challengeId, challenge.code),
      verifyAdminOtp(ADMIN_EMAIL, challenge.challengeId, challenge.code),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    await expect(verifyAdminOtp(ADMIN_EMAIL, challenge.challengeId, challenge.code)).rejects.toThrow();
    expect(backend.writes).toHaveLength(0);
  });
  it("rejects a valid code after five wrong guesses", async () => {
    const challenge = await otp();
    const wrong = challenge.code === "111111" ? "222222" : "111111";
    for (let i = 0; i < 5; i++) await expect(verifyAdminOtp(ADMIN_EMAIL, challenge.challengeId, wrong)).rejects.toThrow();
    await expect(verifyAdminOtp(ADMIN_EMAIL, challenge.challengeId, challenge.code)).rejects.toThrow();
  });
  it("expires codes", async () => {
    const challenge = await otp();
    vi.useFakeTimers(); vi.setSystemTime(Date.now() + 301_000);
    await expect(verifyAdminOtp(ADMIN_EMAIL, challenge.challengeId, challenge.code)).rejects.toThrow();
  });
  it("clears a challenge if sending fails", async () => {
    backend.failEmail();
    await expect(sendAdminOtp(ADMIN_EMAIL)).rejects.toThrow();
    expect(backend.emails).toHaveLength(0);
    // Only the cooldown timestamp remains; the unusable challenge is removed.
    expect(backend.cache.size).toBe(1);
  });
  it.each([null, {}, { id: "acti_failed", status: "error" },
    { id: "acti_wrong", status: "outbox", lead_id: "lead_other", to: [ADMIN_EMAIL] },
    { id: "acti_wrong", status: "outbox", lead_id: "lead_adminDelivery", to: ["other@example.test"] },
    { id: "acti_extra", status: "outbox", lead_id: "lead_adminDelivery", to: [ADMIN_EMAIL, "other@example.test"] },
    { id: "acti_draft", status: "draft", lead_id: "lead_adminDelivery", to: [ADMIN_EMAIL] },
  ])("does not report success for an invalid HTTP-200 email receipt: %j", async (receipt) => {
    backend.setEmailReceipt(receipt);
    const response = await sendCode(req("/api/admin/otp/send", { email: ADMIN_EMAIL }));
    expect(response.status).toBe(500);
    expect((await response.json()).success).toBe(false);
    expect(backend.cache.size).toBe(1);
    expect(jar.has(ADMIN_COOKIE)).toBe(false);
  });
  it.each(["", "not-a-lead"])("fails closed without a valid admin email lead: %s", async (leadId) => {
    vi.stubEnv("ADMIN_EMAIL_LEAD_ID", leadId);
    await expect(sendAdminOtp(ADMIN_EMAIL)).rejects.toThrow();
    expect(backend.cache.size).toBe(0);
    expect(backend.emails).toHaveLength(0);
  });
  it("keeps parent email routing independent of the admin delivery lead", async () => {
    vi.stubEnv("ADMIN_EMAIL_LEAD_ID", "");
    await sendOtpEmail("lead_family", "parent@example.test", 123456);
    expect(backend.emails[0]).toMatchObject({
      lead_id: "lead_family", to: "parent@example.test", subject: "Your Brilliant Microschools login code",
    });
    expect(backend.emails[0].body_html).toContain("30 minutes");
  });
  it("issues the separate cookie only after OTP verification and a successful login audit", async () => {
    const sent = await sendCode(req("/api/admin/otp/send", { email: ADMIN_EMAIL }));
    const { challengeId } = (await sent.json()).data;
    const code = String(backend.emails[0].body_html).match(/>\s*(\d{6})\s*</)?.[1];
    expect(jar.has(ADMIN_COOKIE)).toBe(false);
    const verified = await verifyCode(req("/api/admin/otp/verify", { email: ADMIN_EMAIL, challengeId, otp: code }));
    expect(verified.status).toBe(200);
    expect(jar.has(ADMIN_COOKIE)).toBe(true);
    expect(backend.audit.map((event) => event.event)).toEqual(["login"]);
  });
  it("fails login closed if the audit cannot be stored", async () => {
    const challenge = await otp();
    backend.failAudit();
    expect((await verifyCode(req("/api/admin/otp/verify", { email: ADMIN_EMAIL, challengeId: challenge.challengeId, otp: challenge.code }))).status).toBe(500);
    expect(jar.has(ADMIN_COOKIE)).toBe(false);
  });
  it("does not allow a second code during cooldown", async () => {
    await otp();
    await expect(sendAdminOtp(ADMIN_EMAIL)).rejects.toThrow();
    expect(backend.emails).toHaveLength(1);
  });
  it("requires server-side session state, expires idle and maximum ages, and revokes logout", async () => {
    const session = await createAdminSession(ADMIN_EMAIL);
    expect((await requireAdminSession()).email).toBe(ADMIN_EMAIL);
    expect(jar.has(ADMIN_COOKIE)).toBe(true);
    const cookie = jar.get(ADMIN_COOKIE)!;
    await destroyAdminSession();
    jar.set(ADMIN_COOKIE, cookie);
    await writeAdminValue("session:" + session.id, session, ADMIN_IDLE_MS / 1000);
    await expect(requireAdminSession()).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    const fresh = await createAdminSession(ADMIN_EMAIL);
    vi.useFakeTimers(); vi.setSystemTime(fresh.issuedAt + ADMIN_IDLE_MS);
    await expect(requireAdminSession()).rejects.toThrow();
    vi.setSystemTime(fresh.issuedAt + ADMIN_MAX_MS);
    await expect(requireAdminSession()).rejects.toThrow();
  });
  it("renews active sessions beyond two hours without extending the eight-hour maximum", async () => {
    vi.useFakeTimers();
    const session = await createAdminSession(ADMIN_EMAIL);
    const start = session.issuedAt;
    for (let minutes = 20; minutes < 480; minutes += 20) {
      vi.setSystemTime(start + minutes * 60_000);
      expect((await requireAdminSession()).issuedAt).toBe(start);
      for (const entry of backend.cache.values()) expect(entry.expires - Date.now()).toBeLessThanOrEqual(7200_000);
    }
    vi.setSystemTime(start + ADMIN_MAX_MS - 1000);
    expect((await requireAdminSession()).id).toBe(session.id);
    vi.setSystemTime(start + ADMIN_MAX_MS);
    await expect(requireAdminSession()).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });
  it("does not renew idle time for a read-only session check", async () => {
    vi.useFakeTimers();
    const session = await createAdminSession(ADMIN_EMAIL);
    vi.setSystemTime(session.issuedAt + ADMIN_IDLE_MS - 1000);
    expect((await requireAdminSession(false)).lastSeenAt).toBe(session.lastSeenAt);
    vi.setSystemTime(session.issuedAt + ADMIN_IDLE_MS);
    await expect(requireAdminSession(false)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });
  it("fails closed with a sign-in-state error if session storage fails after code verification", async () => {
    const challenge = await otp();
    vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).includes("/cache/") && init?.method === "PUT") return Promise.resolve(Response.json({}, { status: 503 }));
      return backend.fetch(input, init);
    });
    const response = await verifyCode(req("/api/admin/otp/verify", { email: ADMIN_EMAIL, challengeId: challenge.challengeId, otp: challenge.code }));
    expect(response.status).toBe(502);
    expect((await response.json()).error.message).toBe("Could not save admin sign-in state. Request a new code and try again.");
    expect(jar.has(ADMIN_COOKIE)).toBe(false);
  });
});

describe("admin APIs and parent boundaries", () => {
  it("fails closed when disabled or misconfigured and rejects malformed inputs", async () => {
    await createAdminSession(ADMIN_EMAIL);
    expect((await search(req("/api/admin/search", { query: "x" }))).status).toBe(400);
    expect((await load(req("/api/admin/registration", {}))).status).toBe(400);
    vi.stubEnv("ADMIN_ACCESS_ENABLED", "false");
    expect((await search(req("/api/admin/search", { query: "Alex" }))).status).toBe(403);
    vi.stubEnv("ADMIN_ACCESS_ENABLED", "true");
    vi.stubEnv("ADMIN_AUTH_SECRET", process.env.AUTH_SECRET!);
    expect((await search(req("/api/admin/search", { query: "Alex" }))).status).toBe(403);
    expect(backend.writes).toHaveLength(0);
  });
  it("denies unauthenticated and parent-only search before any data is returned", async () => {
    expect((await search(req("/api/admin/search", { query: "Alex" }))).status).toBe(401);
    await setParentSession({ leadId: "lead_family" });
    expect((await search(req("/api/admin/search", { query: "Alex" }))).status).toBe(401);
  });
  it("rejects cross-origin and missing-origin writes", async () => {
    await createAdminSession(ADMIN_EMAIL);
    for (const origin of ["https://evil.test", ""]) {
      expect((await search(req("/api/admin/search", { query: "Alex" }, origin))).status).toBe(403);
    }
  });
  it("finds eligible students, including encrypted emails, and excludes planning slots", async () => {
    await createAdminSession(ADMIN_EMAIL);
    backend.records[0].parent_email = "sis:v1:encrypted@example.test";
    const response = await search(req("/api/admin/search", { query: "encrypted@" }));
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    const body = await response.json();
    expect(body.data.results.map((r: { objectId: string }) => r.objectId)).toEqual(["student-1"]);
    expect(JSON.stringify(body)).not.toContain("must-never-leak");
    expect((await (await search(req("/api/admin/search", { query: "Inactive" }))).json()).data.results).toEqual([]);
  });
  it("continues past the first source page, even when it contains no matches", async () => {
    await createAdminSession(ADMIN_EMAIL);
    for (let i = 0; i < 101; i++) backend.records.push({ objectId: "page-" + i, lead_id: "lead_page", student_name: i === 100 ? "Late match" : "Other student", slots: [{ status: "enrolled" }] });
    const first = (await (await search(req("/api/admin/search", { query: "Late match", offset: 0 }))).json()).data;
    expect(first.results).toEqual([]);
    expect(first.nextOffset).toBe(100);
    const second = (await (await search(req("/api/admin/search", { query: "Late match", offset: first.nextOffset }))).json()).data;
    expect(second.results.map((row: { objectId: string }) => row.objectId)).toEqual(["page-100"]);
    expect(second.nextOffset).toBeNull();
  });
  it("strips sensitive fields, guards documents, and never writes registration data when viewing", async () => {
    await createAdminSession(ADMIN_EMAIL);
    const data = await loaded();
    expect(data.student.UpdateHistory).toBeUndefined();
    expect(data.student.studentMSPassword).toBeUndefined();
    expect(data.student.studentBirthCert).toContain("/api/admin/document?");
    expect(JSON.stringify(data)).not.toContain("synthetic-birth");
    expect(JSON.stringify(data)).not.toContain("synthetic-transcript");
    const response = await document(new Request("http://localhost:3010" + data.student.studentBirthCert));
    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("https://drive.google.com/file/d/synthetic-birth/view");
    expect(backend.writes).toHaveLength(0);
    const audit = JSON.stringify(backend.audit);
    for (const sensitive of [ADMIN_EMAIL, "lead_family", "student-1", "Alex", "parent@example.test"]) expect(audit).not.toContain(sensitive);
    expect(backend.audit.map((a) => a.event)).toEqual(["view", "document"]);
  });
  it("denies mismatched students and unsafe document redirects", async () => {
    await createAdminSession(ADMIN_EMAIL);
    expect((await load(req("/api/admin/registration", { ...target, leadId: "lead_other" }))).status).toBe(404);
    backend.records[0].studentBirthCert = "https://evil.test/file";
    const data = await loaded();
    expect(data.student.studentBirthCert).toBeUndefined();
  });
  it("fails closed if access auditing is unavailable", async () => {
    await createAdminSession(ADMIN_EMAIL);
    backend.failAudit();
    expect((await load(req("/api/admin/registration", target))).status).toBe(500);
    expect((await search(req("/api/admin/search", { query: "Example", offset: 1 }))).status).toBe(500);
  });
  it.each(["parent_email", "email"])("cannot change the family's parent-login destination through %s", async (emailField) => {
    await createAdminSession(ADMIN_EMAIL);
    const data = await loaded();
    const response = await save(req("/api/admin/save", { ...target, version: data.adminVersion, saveStep: "save1.5", fields: {
      ...flattenFormValues(data.student), parent_name: "Sam", parent_last_name: "Example", [emailField]: ADMIN_EMAIL,
      parent_phone: "5551234567", parent_address: "Synthetic address", parent_relation: "Parent", share_contact: false,
    } }));
    expect(response.status).toBe(403);
    expect(await findSuggestedParentEmail(target.leadId)).toBe("parent@example.test");
    expect(backend.writes).toHaveLength(0);
  });
  it("can update parent contact details while preserving the login email", async () => {
    await createAdminSession(ADMIN_EMAIL);
    const data = await loaded();
    const response = await save(req("/api/admin/save", { ...target, version: data.adminVersion, saveStep: "save1.5", fields: {
      ...flattenFormValues(data.student), parent_name: "Sam", parent_last_name: "Example", parent_email: "parent@example.test",
      parent_phone: "5551234567", parent_address: "Synthetic address", parent_relation: "Parent", share_contact: false,
    } }));
    expect(await response.clone().json()).toMatchObject({ success: true });
    expect(backend.records[0].parent_address).toBe("Synthetic address");
    expect(backend.records[0].share_contact).toBe("No");
    expect(await findSuggestedParentEmail(target.leadId)).toBe("parent@example.test");
    expect(backend.parentMapWrites).toHaveLength(2);
  });
  it("preserves a legacy-only transcript when editing its delivery preferences", async () => {
    await createAdminSession(ADMIN_EMAIL);
    backend.records[0].transcriptFiles = [];
    backend.records[0].uploadTranscript = "https://drive.google.com/file/d/legacy-transcript/view";
    const data = await loaded();
    const response = await save(req("/api/admin/save", { ...target, version: data.adminVersion, saveStep: "save6.1", fields: {
      ...flattenFormValues(data.student), CreditTransfer: ["Math"], transferCredit: true,
    } }));
    expect(await response.clone().json()).toMatchObject({ success: true });
    expect(backend.records[0].transcriptFiles).toContain("https://drive.google.com/file/d/legacy-transcript/view");
    expect(backend.records[0].uploadTranscript).toBe("I can upload them");
    const refreshed = await loaded();
    expect(refreshed.student.transcriptFiles).toHaveLength(1);
  });
  it("validates trusted document fields instead of accepting invented client links", async () => {
    await createAdminSession(ADMIN_EMAIL);
    backend.records[0].transcriptFiles = [];
    const data = await loaded();
    const response = await save(req("/api/admin/save", { ...target, version: data.adminVersion, saveStep: "save6.1", fields: {
      ...flattenFormValues(data.student), transcriptFiles: ["https://drive.google.com/file/d/forged/view"],
      CreditTransfer: ["Math"], transferCredit: true,
    } }));
    expect(response.status).toBe(400);
    expect(backend.writes).toHaveLength(0);
  });
  it("admin credentials cannot sign or submit through parent APIs", async () => {
    await createAdminSession(ADMIN_EMAIL);
    for (const handler of [signHonor, signTos, submit]) {
      const response = await handler(req("/api/test", { ...target, studentName: "Alex", parentSignature: "Sam", studentSignature: "Alex" }));
      expect(response.status).toBe(401);
    }
    expect(backend.writes).toHaveLength(0);
  });
  it("saves only allowed changed fields, preserves history, attributes the edit, and verifies readback", async () => {
    await createAdminSession(ADMIN_EMAIL);
    const data = await loaded();
    const response = await save(req("/api/admin/save", { ...target, version: data.adminVersion, saveStep: "save8",
      fields: { ...technology, is_complete_sis: true, ToSBool: false, studentMSPassword: "attacker", objectId: "student-2" } }));
    expect(await response.clone().json()).toMatchObject({ success: true });
    expect(response.status).toBe(200);
    expect(backend.records[0].computer_system).toBe("Mac");
    expect(backend.records[0].is_complete_sis).toBeUndefined();
    expect(backend.records[0].ToSBool).toBe(true);
    expect(backend.records[0].studentMSPassword).toBe("must-never-leak");
    expect(backend.records[0].UpdateHistory).toEqual(expect.arrayContaining([
      { step: "existing", at: 1 }, expect.objectContaining({ actor: expect.objectContaining({ role: "admin" }) }),
    ]));
    expect(backend.audit.map((a) => a.event)).toEqual(["view", "save_requested", "save_verified"]);
  });
  it("saves a first-name-only admin correction using the exact student ID", async () => {
    await createAdminSession(ADMIN_EMAIL);
    const data = await loaded();
    const response = await save(req("/api/admin/save", { ...target, version: data.adminVersion, saveStep: "save1", fields: {
      ...flattenFormValues(data.student), student_name: "Alexander",
    } }));
    expect(await response.clone().json()).toMatchObject({ success: true });
    expect(backend.records[0].student_name).toBe("Alexander");
    expect(backend.records[1].student_name).toBe("Taylor");
    expect((await loaded()).studentInfo.studentName).toBe("Alexander");
  });
  it("blocks stale edits and disabled writes before mutating anything", async () => {
    await createAdminSession(ADMIN_EMAIL);
    const data = await loaded();
    backend.records[0].updated = 2;
    const body = { ...target, version: data.adminVersion, saveStep: "save8", fields: technology };
    expect((await save(req("/api/admin/save", body))).status).toBe(409);
    vi.stubEnv("EXTERNAL_WRITES_ENABLED", "false");
    expect((await save(req("/api/admin/save", body))).status).toBe(403);
    expect(backend.writes).toHaveLength(0);
  });
  it("does not report success when the backend fails to persist the expected answer", async () => {
    await createAdminSession(ADMIN_EMAIL);
    const data = await loaded();
    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith("/data/ms_student_dir/student-1") && init?.method === "PUT") return Response.json({ objectId: "student-1" });
      return backend.fetch(input, init);
    });
    const response = await save(req("/api/admin/save", { ...target, version: data.adminVersion, saveStep: "save8", fields: technology }));
    expect(response.status).toBe(502);
    expect((await response.json()).error.code).toBe("EXTERNAL_READBACK_MISMATCH");
    expect(backend.audit.map((event) => event.event)).toEqual(["view", "save_requested"]);
  });
  it("uploads a supported document, verifies the saved location, and attributes the change", async () => {
    await createAdminSession(ADMIN_EMAIL);
    const data = await loaded();
    const form = new FormData();
    for (const [key, value] of Object.entries({ ...target, version: data.adminVersion, uploadType: "birth_cert" })) form.set(key, value);
    form.set("file", new File(["synthetic PDF"], "birth.pdf", { type: "application/pdf" }));
    const response = await upload(new Request("http://localhost:3010/api/admin/uploads", { method: "POST", headers: { origin: "http://localhost:3010" }, body: form }));
    expect(await response.clone().json()).toMatchObject({ success: true, data: { fieldKey: "studentBirthCert", url: expect.stringContaining("/api/admin/document?") } });
    expect(response.status).toBe(200);
    expect(backend.uploads).toHaveLength(1);
    expect(backend.records[0].studentBirthCert).toContain("synthetic-upload-1");
    expect(backend.records[0].UpdateHistory).toEqual(expect.arrayContaining([expect.objectContaining({ step: "upload", actor: expect.objectContaining({ role: "admin" }) })]));
    expect(backend.audit.map((event) => event.event)).toEqual(["view", "upload_requested", "upload_verified"]);
  });
  it("rejects unsupported upload types and stale uploads before sending a file", async () => {
    await createAdminSession(ADMIN_EMAIL);
    const data = await loaded();
    for (const uploadType of ["constructor", "birth_cert"]) {
      const form = new FormData();
      for (const [key, value] of Object.entries({ ...target, version: data.adminVersion, uploadType })) form.set(key, value);
      form.set("file", new File(["synthetic PDF"], "birth.pdf", { type: "application/pdf" }));
      backend.records[0].updated = 99;
      const response = await upload(new Request("http://localhost:3010/api/admin/uploads", { method: "POST", headers: { origin: "http://localhost:3010" }, body: form }));
      expect(response.status).toBe(uploadType === "constructor" ? 400 : 409);
    }
    expect(backend.uploads).toHaveLength(0);
    expect(backend.writes).toHaveLength(0);
  });
});
