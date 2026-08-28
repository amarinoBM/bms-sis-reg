import { AppError } from "@/core/app-error";
import { requireBackendlessRestUrl } from "@/config/env";
import { normalizeAdminSearch } from "@/modules/admin/policy";
import { findEnrolledStudents } from "@/modules/students/repository";
import { buildStudentInfoState } from "@/modules/students/student-info-state";
import { hydrateUploadMetadata } from "@/modules/students/upload-metadata";
import { toStudentLoadResultDto } from "@/modules/students/student-wizard-dto";
import type { MsStudentDirRow, StudentLoadResult } from "@/modules/students/types";
import { decryptStudentDirRow } from "@/server/connectors/backendless/cloud-code-client";
import { TRANSCRIPT_DELIVERY_UPLOAD } from "@/modules/wizard/transcript-fields";
import { DOCUMENT_FIELDS, isDriveDocument, readDocumentFiles, readIepFiles, readStudentTranscriptFiles } from "@/modules/uploads/document-files";
export { preserveDocumentFields } from "@/modules/uploads/document-files";
import { adminRef } from "./store";

const ENROLLED = "student_name not like '%[delete]%' and slots.status='enrolled'";
const PAGE_SIZE = 100;
function quote(value: string) { return value.replace(/'/g, "''"); }

export type AdminSearchItem = {
  leadId: string; objectId: string; studentName: string; lastName: string; parentEmail: string; completed: boolean;
};
async function rows(where: string, offset = 0, props?: string): Promise<MsStudentDirRow[]> {
  const params = new URLSearchParams({ where, pageSize: String(PAGE_SIZE), offset: String(offset), sortBy: "objectId" });
  if (props) params.set("props", props);
  else params.set("loadRelations", "slots");
  const response = await fetch(requireBackendlessRestUrl() + "/data/ms_student_dir?" + params, { cache: "no-store" });
  if (!response.ok) throw new AppError({ code: "INTERNAL_ERROR", message: "Could not load registrations. Please try again." });
  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new AppError({ code: "INTERNAL_ERROR", message: "Could not load registrations." });
  return data as MsStudentDirRow[];
}

export async function searchRegistrations(query: string, offset: number, mode: "name" | "email" | "all" = "all") {
  const search = normalizeAdminSearch(query);
  const where = ENROLLED + ("leadId" in search ? " and lead_id='" + quote(search.leadId) + "'" : "");
  // Search one bounded source page per request. The client continues pages until the census
  // is complete; encrypted email fields are matched only after decryption on the server.
  const page = await rows(where, offset, "objectId,lead_id,student_name,student_last_name,parent_email,email,is_complete_sis");
  const results: AdminSearchItem[] = [];
  for (let i = 0; i < page.length; i += 5) {
    const batch = await Promise.all(page.slice(i, i + 5).map(async (row) => {
      if (!row.lead_id || !row.objectId || !row.student_name) return null;
      // Names are normally plaintext. Do not decrypt unrelated family emails for
      // a name search. Encrypted names still take the full matching path below.
      const names = [row.student_name, row.student_last_name];
      if ("text" in search && mode === "name" &&
          !names.some((value) => typeof value === "string" && value.startsWith("sis:v1:")) &&
          !names.join(" ").toLowerCase().includes(search.text)) return null;
      const leadId = String(row.lead_id);
      const needsDecryption = Object.values(row).some((v) => typeof v === "string" && v.startsWith("sis:v1:"));
      const value = needsDecryption ? await decryptStudentDirRow(leadId, row) : row;
      const item: AdminSearchItem = {
        leadId, objectId: String(row.objectId), studentName: String(value.student_name ?? ""),
        lastName: String(value.student_last_name ?? ""),
        parentEmail: String(value.parent_email ?? value.email ?? ""),
        completed: value.is_complete_sis === true,
      };
      const text = [item.studentName, item.lastName].join(" ").toLowerCase();
      const emails = [value.parent_email, value.email].filter((v): v is string => typeof v === "string");
      return "leadId" in search || (mode !== "email" && text.includes(search.text)) ||
        (mode !== "name" && emails.some((v) => v.toLowerCase().includes(search.text))) ? item : null;
    }));
    for (const item of batch) if (item) results.push(item);
  }
  return { results, nextOffset: page.length === PAGE_SIZE ? offset + PAGE_SIZE : null };
}

export async function loadAdminStudent(leadId: string, objectId: string): Promise<Omit<StudentLoadResult, "enrolledStudents">> {
  const found = await rows(ENROLLED + " and lead_id='" + quote(leadId) + "' and objectId='" + quote(objectId) + "'");
  const row = found.find((candidate) => candidate.objectId === objectId && candidate.lead_id === leadId);
  if (!row) throw new AppError({ code: "NOT_FOUND", message: "No registration-eligible student was found." });
  const student = hydrateUploadMetadata(await decryptStudentDirRow(leadId, row)) as MsStudentDirRow;
  const slots = Array.isArray(row.slots) ? row.slots : [];
  const chargebeeId = slots.find((slot) => slot.status === "enrolled")?.chargebee ?? null;
  return {
    student, chargebeeId: chargebeeId ? String(chargebeeId) : null,
    studentInfo: buildStudentInfoState(leadId, student, chargebeeId ? String(chargebeeId) : null),
  };
}
export async function loadAdminRegistration(leadId: string, objectId: string): Promise<StudentLoadResult> {
  const [student, enrolledStudents] = await Promise.all([loadAdminStudent(leadId, objectId), findEnrolledStudents(leadId)]);
  return { ...student, enrolledStudents };
}

export type AdminRegistrationResult = StudentLoadResult & { adminVersion: string };
export function registrationVersion(student: Record<string, unknown>): string {
  function stable(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(stable);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, stable(v)]));
    return value;
  }
  return adminRef("registration-version", JSON.stringify(stable(student)));
}

export function adminDocumentUrl(student: Record<string, unknown>, field: string, index = 0): string | null {
  const value = field === "transcriptFiles" ? readStudentTranscriptFiles(student)[index]
    : field === "IEPFiles" ? readDocumentFiles(student.IEPFiles)[index]
    : DOCUMENT_FIELDS.includes(field as typeof DOCUMENT_FIELDS[number]) ? student[field] : null;
  return typeof value === "string" && isDriveDocument(value) ? new URL(value).href : null;
}

export function withAdminDocumentLinks(result: StudentLoadResult, leadId: string): StudentLoadResult {
  const dto = toStudentLoadResultDto(result);
  const student = { ...dto.student };
  // Upload metadata contains raw Drive IDs and URLs. Admin clients only receive
  // the guarded document links, including when new upload metadata is added.
  for (const field of Object.keys(student)) {
    if (/metadata$/i.test(field)) delete student[field];
  }
  const link = (field: string, index = 0) => "/api/admin/document?" + new URLSearchParams({
    leadId, objectId: result.studentInfo.objectId, field, index: String(index),
  });
  for (const field of DOCUMENT_FIELDS) {
    if (adminDocumentUrl(student, field)) student[field] = link(field);
    else if (typeof student[field] === "string" && /^https?:|^javascript:|^data:/i.test(String(student[field]))) delete student[field];
  }
  student.transcriptFiles = readStudentTranscriptFiles(result.student).map((_, index) =>
    adminDocumentUrl(result.student, "transcriptFiles", index) ? link("transcriptFiles", index) : "",
  ).filter(Boolean);
  const currentIep = readIepFiles({ upload_copy_EIP_504_plan: result.student.upload_copy_EIP_504_plan });
  student.IEPFiles = readDocumentFiles(result.student.IEPFiles).map((url, index) => {
    if (!isDriveDocument(url)) return "";
    // Keep legacy proxies stable when the current IEP is replaced later.
    if (currentIep.length && readIepFiles({ upload_copy_EIP_504_plan: currentIep[0], IEPFiles: [url] }).length === 1) {
      student.upload_copy_EIP_504_plan = link("IEPFiles", index);
    }
    return link("IEPFiles", index);
  }).filter(Boolean);
  if (adminDocumentUrl(result.student, "uploadTranscript")) {
    student.uploadTranscript = TRANSCRIPT_DELIVERY_UPLOAD;
  }
  return { ...dto, student };
}

export function toAdminRegistrationResult(result: StudentLoadResult, leadId: string): AdminRegistrationResult {
  return { ...withAdminDocumentLinks(result, leadId), adminVersion: registrationVersion(result.student) };
}
