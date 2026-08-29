import { AppError } from "@/core/app-error";
import { requireBackendlessRestUrl } from "@/config/env";
import { normalizeAdminSearch } from "@/modules/admin/policy";
import { findEnrolledStudents } from "@/modules/students/repository";
import { preferredParentEmail, resolveParentEmailState } from "@/modules/students/parent-emails";
import { buildStudentInfoState } from "@/modules/students/student-info-state";
import { hydrateUploadMetadata } from "@/modules/students/upload-metadata";
import { toStudentLoadResultDto } from "@/modules/students/student-wizard-dto";
import type { MsStudentDirRow, StudentLoadResult } from "@/modules/students/types";
import { decryptStudentDirRow } from "@/server/connectors/backendless/cloud-code-client";
import { TRANSCRIPT_DELIVERY_UPLOAD } from "@/modules/wizard/transcript-fields";
import { buildStepCompletionMap } from "@/modules/wizard/progress";
import { SAVE_HANDLERS } from "@/modules/wizard/save-handlers";
import { DOCUMENT_FIELDS, isDriveDocument, readDocumentFiles, readIepFiles, readStudentTranscriptFiles } from "@/modules/uploads/document-files";
export { preserveDocumentFields } from "@/modules/uploads/document-files";
import { adminRef } from "./store";

const ENROLLED = "student_name not like '%[delete]%' and slots.status='enrolled'";
const SAVED_CANDIDATES = "student_name is not null and student_name not like '%[delete]%' and lead_id is not null";
const PAGE_SIZE = 100;
const SEARCH_PROPS = [
  "objectId", "lead_id", "student_name", "student_last_name", "parent_email", "email",
  "is_complete_sis", "updated", "honorCodeSigned", "ToSBool",
].join(",");
const IDENTITY_ONLY_FIELDS = new Set(["student_name", "student_last_name", "parent_email", "email"]);
const REGISTRATION_ANSWER_FIELDS = [...new Set(Object.values(SAVE_HANDLERS).flat())]
  .filter((field) => !IDENTITY_ONLY_FIELDS.has(field));
function quote(value: string) { return value.replace(/'/g, "''"); }

export type AdminSearchItem = {
  leadId: string; objectId: string; studentName: string; lastName: string; parentEmail: string;
  alternateParentEmail?: string; completed: boolean; enrolled: boolean; savedSections: number;
};
export type AdminSearchScope = "enrolled" | "other";
async function rows(where: string, offset = 0, props?: string): Promise<MsStudentDirRow[]> {
  const params = new URLSearchParams({ where, pageSize: String(PAGE_SIZE), offset: String(offset), sortBy: "updated desc" });
  if (props) params.set("props", props);
  else params.set("loadRelations", "slots");
  const response = await fetch(requireBackendlessRestUrl() + "/data/ms_student_dir?" + params, { cache: "no-store" });
  if (!response.ok) throw new AppError({ code: "INTERNAL_ERROR", message: "Could not load registrations. Please try again." });
  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new AppError({ code: "INTERNAL_ERROR", message: "Could not load registrations." });
  return data as MsStudentDirRow[];
}

function isEnrolled(row: MsStudentDirRow): boolean {
  return Array.isArray(row.slots) && row.slots.some((slot) => slot?.status === "enrolled");
}

function savedSections(row: MsStudentDirRow): number {
  return Object.values(buildStepCompletionMap(row)).filter(Boolean).length;
}

function hasSavedRegistrationAnswers(row: MsStudentDirRow): boolean {
  if (row.is_complete_sis === true || savedSections(row) > 0) return true;
  return REGISTRATION_ANSWER_FIELDS.some((field) => {
    const value = row[field];
    return value !== null && value !== undefined && value !== "" &&
      (!Array.isArray(value) || value.length > 0);
  });
}

function toSearchItem(
  row: MsStudentDirRow,
  value: MsStudentDirRow,
  enrolled: boolean,
  familyEmail?: string,
): AdminSearchItem | null {
  if (!row.lead_id || !row.objectId || !value.student_name) return null;
  const emailState = resolveParentEmailState(value);
  return {
    leadId: String(row.lead_id),
    objectId: String(row.objectId),
    studentName: String(value.student_name),
    lastName: String(value.student_last_name ?? ""),
    parentEmail: emailState.effectiveEmail ?? familyEmail ?? "",
    ...(emailState.status === "different" && emailState.legacyEmail
      ? { alternateParentEmail: emailState.legacyEmail }
      : {}),
    completed: value.is_complete_sis === true,
    enrolled,
    savedSections: savedSections(value),
  };
}

async function decryptSearchRow(row: MsStudentDirRow): Promise<MsStudentDirRow> {
  const needsDecryption = Object.values(row).some((value) => typeof value === "string" && value.startsWith("sis:v1:"));
  return needsDecryption ? await decryptStudentDirRow(String(row.lead_id), row) as MsStudentDirRow : row;
}

async function familySearchItems(
  leadId: string,
  familyEmail: string,
  scope: AdminSearchScope,
): Promise<AdminSearchItem[]> {
  const familyRows = await rows(
    (scope === "enrolled" ? ENROLLED : SAVED_CANDIDATES) + " and lead_id='" + quote(leadId) + "'",
    0,
    scope === "enrolled" ? SEARCH_PROPS : undefined,
  );
  const items = await Promise.all(familyRows.map(async (row) => {
    if (scope === "other" && isEnrolled(row)) return null;
    const value = await decryptSearchRow(row);
    if (scope === "other" && !hasSavedRegistrationAnswers(value)) return null;
    return toSearchItem(row, value, scope === "enrolled", familyEmail);
  }));
  return items.filter((item): item is AdminSearchItem => item !== null);
}

export async function searchRegistrations(
  query: string,
  offset: number,
  scope: AdminSearchScope = "enrolled",
) {
  const search = normalizeAdminSearch(query);
  if ("leadId" in search) {
    return {
      results: await familySearchItems(search.leadId, "", scope),
      nextOffset: null,
      scope,
    };
  }

  const where = scope === "enrolled" ? ENROLLED : SAVED_CANDIDATES;
  const page = await rows(where, offset, scope === "enrolled" ? SEARCH_PROPS : undefined);
  const matchingLeadIds = new Set<string>();
  for (let i = 0; i < page.length; i += 5) {
    const batch = await Promise.all(page.slice(i, i + 5).map(async (row) => {
      if (!row.lead_id || !row.objectId || !row.student_name) return null;
      if (scope === "other" && isEnrolled(row)) return null;
      const value = await decryptSearchRow(row);
      if (scope === "other" && !hasSavedRegistrationAnswers(value)) return null;
      const emails = [value.parent_email, value.email].filter((v): v is string => typeof v === "string");
      return emails.some((value) => value.trim().toLowerCase() === search.email) ? String(row.lead_id) : null;
    }));
    for (const leadId of batch) if (leadId) matchingLeadIds.add(leadId);
  }
  const families = await Promise.all(
    [...matchingLeadIds].map((leadId) => familySearchItems(leadId, search.email, scope)),
  );
  return {
    results: families.flat(),
    nextOffset: page.length === PAGE_SIZE ? offset + PAGE_SIZE : null,
    scope,
  };
}

export async function loadAdminStudent(leadId: string, objectId: string): Promise<Omit<StudentLoadResult, "enrolledStudents">> {
  const found = await rows(SAVED_CANDIDATES + " and lead_id='" + quote(leadId) + "' and objectId='" + quote(objectId) + "'");
  const row = found.find((candidate) => candidate.objectId === objectId && candidate.lead_id === leadId);
  if (!row) throw new AppError({ code: "NOT_FOUND", message: "No registration-eligible student was found." });
  const student = hydrateUploadMetadata(await decryptStudentDirRow(leadId, row)) as MsStudentDirRow;
  if (!isEnrolled(row) && !hasSavedRegistrationAnswers(student)) {
    throw new AppError({ code: "NOT_FOUND", message: "No saved registration was found." });
  }
  const slots = Array.isArray(row.slots) ? row.slots : [];
  const chargebeeId = slots.find((slot) => slot.status === "enrolled")?.chargebee ?? null;
  return {
    student, chargebeeId: chargebeeId ? String(chargebeeId) : null,
    studentInfo: buildStudentInfoState(leadId, student, chargebeeId ? String(chargebeeId) : null),
  };
}
export async function loadAdminRegistration(leadId: string, objectId: string): Promise<StudentLoadResult> {
  const student = await loadAdminStudent(leadId, objectId);
  const enrolled = isEnrolled(student.student);
  const familyStudents = enrolled
    ? await findEnrolledStudents(leadId)
    : (await familySearchItems(leadId, "", "other")).map((item) => ({
        studentName: item.studentName,
        objectId: item.objectId,
      }));
  return { ...student, enrolledStudents: familyStudents };
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
  if (typeof student.parent_email !== "string" || !student.parent_email.trim()) {
    const legacyFallback = preferredParentEmail(student);
    if (legacyFallback) student.parent_email = legacyFallback;
  }
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
