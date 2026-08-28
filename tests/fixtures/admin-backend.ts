import type { MsStudentDirRow } from "@/modules/students/types";

export function createAdminBackend() {
  const cache = new Map<string, { value: unknown; expires: number }>();
  const counters = new Map<string, number>();
  const audit: Record<string, unknown>[] = [];
  const emails: Record<string, unknown>[] = [];
  const writes: Record<string, unknown>[] = [];
  const uploads: Record<string, unknown>[] = [];
  const parentMapWrites: unknown[] = [];
  const records: MsStudentDirRow[] = [
    { objectId: "student-1", lead_id: "lead_family", student_name: "Alex", student_last_name: "Example",
      parent_email: "parent@example.test", parent_name: "Sam", student_birth_date: Date.UTC(2014, 2, 1),
      male: true, Caucasian: true,
      slots: [{ status: "enrolled", chargebee: "cb-test" }], computer_system: "Windows",
      starting_date: Date.UTC(2026, 8, 1), length_of_staying: "The full school year",
      studentBirthCert: "https://drive.google.com/file/d/synthetic-birth/view",
      transcriptFiles: JSON.stringify(["https://drive.google.com/file/d/synthetic-transcript/view"]),
      CreditTransfer: [], transferCredit: false,
      IEP_or_504_plan: true,
      IEPFiles: ["https://drive.google.com/file/d/synthetic-iep-1/view", "https://drive.google.com/file/d/synthetic-iep-2/view"],
      upload_copy_EIP_504_plan: "https://drive.google.com/file/d/synthetic-iep-2/view",
      uploadTranscript: "I can upload them", honorCodeSigned: true,
      honorCodeURL: "https://drive.google.com/file/d/synthetic-honor/view", ToSBool: true,
      ToSURL: "https://drive.google.com/file/d/synthetic-tos/view", "8disabled": true,
      studentMSPassword: "must-never-leak", UpdateHistory: [{ step: "existing", at: 1 }], updated: 1 },
    { objectId: "student-2", lead_id: "lead_family", student_name: "Taylor", student_last_name: "Example",
      parent_email: "parent@example.test", slots: [{ status: "enrolled" }], updated: 1 },
    { objectId: "student-3", lead_id: "lead_inactive", student_name: "Inactive",
      slots: [{ status: "planning" }] },
  ];
  let failAudit = false;
  let failEmail = false;
  let emailReceipt: unknown;
  let overrideEmailReceipt = false;
  let tick = 10;
  const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });
  async function fetchImpl(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = new URL(String(input));
    const path = url.pathname;
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    if (path.includes("/cache/")) {
      const key = path.split("/cache/")[1];
      if (method === "PUT") { cache.set(key, { value: body, expires: Date.now() + Number(url.searchParams.get("timeout") ?? 1800) * 1000 }); return json({}); }
      if (method === "DELETE") { cache.delete(key); return json({}); }
      const item = cache.get(key);
      return item && item.expires > Date.now() ? json(item.value) : json(null, 404);
    }
    if (path.includes("/counters/")) {
      const key = path.split("/counters/")[1];
      const next = (counters.get(key) ?? 0) + 1; counters.set(key, next); return json(next);
    }
    if (path.endsWith("/users/register/guest")) return json({ "user-token": "synthetic-guest" });
    if (path.endsWith("/EncryptDecryptMSStudentDir")) {
      const row = structuredClone(body.studentDirObject);
      for (const [key, value] of Object.entries(row)) if (typeof value === "string" && value.startsWith("sis:v1:")) row[key] = value.slice(7);
      return json(row);
    }
    if (path.endsWith("/emailFrontend")) {
      if (failEmail) return json({}, 503);
      // Production's Close helper swallows a missing-lead error and returns null with HTTP 200.
      if (!body.lead_id) return json(null);
      if (overrideEmailReceipt) return json(emailReceipt);
      emails.push(body);
      return json({ id: "acti_synthetic", status: "outbox", lead_id: body.lead_id, to: [body.to] });
    }
    if (path.endsWith("/SISUploadFileToDrivePost")) { uploads.push(body); return json({ id: "synthetic-upload-" + uploads.length }); }
    if (path.endsWith("/data/parent_maps") && method === "GET") return json([{ objectId: "synthetic-parent-map" }]);
    if (path.includes("/data/parent_maps/") && method === "PUT") { parentMapWrites.push(body); return json({}); }
    if (path.endsWith("/reg_admin_audit")) { if (failAudit) return json({}, 503); audit.push(body); return json({ objectId: "audit-" + audit.length }); }
    if (path.endsWith("/data/ms_student_dir")) {
      const where = url.searchParams.get("where") ?? "";
      const lead = where.match(/lead_id='([^']+)'/)?.[1];
      const id = where.match(/objectId='([^']+)'/)?.[1];
      const matching = records.filter((row) => row.slots?.some((s) => s.status === "enrolled") && !row.student_name?.includes("[delete]") && (!lead || row.lead_id === lead) && (!id || row.objectId === id));
      const offset = Number(url.searchParams.get("offset") ?? 0);
      const props = url.searchParams.get("props")?.split(",");
      return json(matching.slice(offset, offset + 100).map((row) => props ? Object.fromEntries(props.filter((k) => k in row).map((k) => [k, row[k]])) : row));
    }
    if (path.includes("/data/ms_student_dir/") && method === "PUT") {
      const row = records.find((r) => r.objectId === path.split("/").at(-1));
      if (!row) return json({}, 404);
      writes.push(body); Object.assign(row, body, { updated: ++tick }); return json(row);
    }
    if (path.endsWith("/data/state_regs")) return json([]);
    throw new Error("Unexpected synthetic backend request: " + method + " " + path);
  }
  return { fetch: fetchImpl, records, audit, emails, writes, uploads, parentMapWrites, cache, counters,
    failAudit: () => { failAudit = true; }, failEmail: () => { failEmail = true; },
    setEmailReceipt: (value: unknown) => { overrideEmailReceipt = true; emailReceipt = value; } };
}
