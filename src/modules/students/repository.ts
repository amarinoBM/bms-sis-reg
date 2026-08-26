import { AppError } from "@/core/app-error";
import { BACKENDLESS_TABLES } from "@/config/backendless";
import { updateAppRow } from "@/server/connectors/backendless/app-data-client";
import {
  decryptStudentDirRow,
  encryptStudentDirRow,
} from "@/server/connectors/backendless/cloud-code-client";
import { hydrateUploadMetadata } from "@/modules/students/upload-metadata";
import { buildStudentInfoState } from "@/modules/students/student-info-state";
import { expandVirtualFormFields } from "@/modules/wizard/field-normalization";
import { buildStepSavePayload } from "@/modules/wizard/save-service";
import type { SaveHandlerKey } from "@/modules/wizard/save-handlers";
import { syncParentMapForContactSave } from "@/modules/parent-maps/sync-parent-map";
import type {
  EnrolledStudentSummary,
  MsStudentDirRow,
  StudentLoadResult,
} from "@/modules/students/types";
import {
  normalizeStudentName,
  pickBestEnrolledStudentRow,
} from "@/modules/students/student-row-selection";

function escapeWhereValue(value: string): string {
  return value.replace(/'/g, "''");
}

function trimStudentName(studentName: string): string {
  return normalizeStudentName(studentName);
}

function buildEnrolledWhereClause(leadId: string, studentName?: string): string {
  const escapedLeadId = escapeWhereValue(leadId);
  let clause = `lead_id='${escapedLeadId}' and student_name not like '%[delete]%' and slots.status='enrolled'`;

  if (studentName) {
    clause += ` and student_name='${escapeWhereValue(trimStudentName(studentName))}'`;
  }

  return clause;
}

function toEnrolledStudentSummaries(rows: MsStudentDirRow[]): EnrolledStudentSummary[] {
  const summaries: EnrolledStudentSummary[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    if (!row.student_name || !row.objectId) {
      continue;
    }

    const objectId = String(row.objectId);
    if (seen.has(objectId)) {
      continue;
    }

    seen.add(objectId);
    summaries.push({
      studentName: String(row.student_name),
      objectId,
    });
  }

  return summaries;
}

export async function findEnrolledStudents(
  leadId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<EnrolledStudentSummary[]> {
  const where = buildEnrolledWhereClause(leadId);
  const restUrl = process.env.BACKENDLESS_REST_URL?.replace(/\/$/, "");

  if (!restUrl) {
    throw new AppError({
      code: "INTERNAL_ERROR",
      message: "Backendless REST URL is not configured.",
    });
  }

  const query = encodeURIComponent(where);
  const response = await fetchImpl(
    `${restUrl}/data/${BACKENDLESS_TABLES.msStudentDir}?where=${query}&pageSize=100&loadRelations=slots`,
  );

  if (!response.ok) {
    throw new AppError({
      code: "EXTERNAL_WRITE_FAILED",
      message: "Could not query enrolled students.",
      status: 502,
    });
  }

  const rows = (await response.json()) as MsStudentDirRow[];

  return toEnrolledStudentSummaries(rows);
}

export async function loadStudentRecord(
  leadId: string,
  studentName?: string,
  fetchImpl: typeof fetch = fetch,
): Promise<StudentLoadResult> {
  const normalizedName = studentName ? trimStudentName(studentName) : undefined;
  const where = buildEnrolledWhereClause(leadId);
  const restUrl = process.env.BACKENDLESS_REST_URL?.replace(/\/$/, "");

  if (!restUrl) {
    throw new AppError({
      code: "INTERNAL_ERROR",
      message: "Backendless REST URL is not configured.",
    });
  }

  const query = encodeURIComponent(where);
  const response = await fetchImpl(
    `${restUrl}/data/${BACKENDLESS_TABLES.msStudentDir}?where=${query}&pageSize=100&loadRelations=slots`,
  );

  if (!response.ok) {
    throw new AppError({
      code: "EXTERNAL_WRITE_FAILED",
      message: "Could not load student record.",
      status: 502,
    });
  }

  const rows = (await response.json()) as MsStudentDirRow[];
  const enrolledStudents = toEnrolledStudentSummaries(rows);

  if (enrolledStudents.length === 0) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "No enrolled student found for this registration link.",
    });
  }

  const namedRows = rows.filter((candidate) => candidate.student_name && candidate.objectId);
  if (normalizedName) {
    const hasRequestedStudent = namedRows.some(
      (row) =>
        normalizeStudentName(String(row.student_name)).toLowerCase() ===
        normalizedName.toLowerCase(),
    );
    if (!hasRequestedStudent) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "No enrolled student found for this registration link.",
      });
    }
  }

  const targetName = normalizedName ?? enrolledStudents[0].studentName;
  const row = pickBestEnrolledStudentRow(namedRows, targetName);

  const decrypted = await decryptStudentDirRow(leadId, row, fetchImpl);
  const hydrated = hydrateUploadMetadata(decrypted);

  const slots = Array.isArray(hydrated.slots) ? hydrated.slots : row.slots ?? [];
  const enrolledSlot = slots.find((slot) => slot?.status === "enrolled");
  const chargebeeId =
    enrolledSlot?.chargebee ? String(enrolledSlot.chargebee) : null;

  return {
    student: hydrated as MsStudentDirRow,
    studentInfo: buildStudentInfoState(leadId, hydrated as MsStudentDirRow, chargebeeId),
    chargebeeId,
    enrolledStudents,
  };
}

export async function saveStudentStep(
  leadId: string,
  objectId: string,
  saveStep: SaveHandlerKey,
  fields: Record<string, unknown>,
  previousRow: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch,
): Promise<{ objectId: string }> {
  const normalizedFields = expandVirtualFormFields(
    saveStep,
    { ...fields },
  );

  if (saveStep === "save1.5" && typeof normalizedFields.share_contact === "boolean") {
    normalizedFields.share_contact = normalizedFields.share_contact ? "Yes" : "No";
  }

  const payload = buildStepSavePayload(saveStep, normalizedFields, previousRow);
  const result = await saveStudentRecord(leadId, objectId, payload, fetchImpl);

  if (saveStep === "save1.5") {
    const shareContact =
      normalizedFields.share_contact === "Yes" ||
      normalizedFields.share_contact === true;
    await syncParentMapForContactSave(leadId, objectId, shareContact, fetchImpl);
  }

  return result;
}

export async function saveStudentRecord(
  leadId: string,
  objectId: string,
  partialFields: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch,
): Promise<{ objectId: string }> {
  if (process.env.EXTERNAL_WRITES_ENABLED !== "true") {
    throw new AppError({
      code: "FORBIDDEN",
      message: "External writes are disabled.",
    });
  }

  const encrypted = await encryptStudentDirRow(
    leadId,
    { objectId, ...partialFields },
    fetchImpl,
  );

  await updateAppRow(
    BACKENDLESS_TABLES.msStudentDir,
    objectId,
    encrypted,
    fetchImpl,
  );

  return { objectId };
}

function looksLikeEncryptedValue(value: string): boolean {
  return value.startsWith("sis:v1:");
}

function pickParentEmail(row: MsStudentDirRow): string | null {
  const candidates = [row.parent_email, row.email];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "string") {
      continue;
    }

    const trimmed = candidate.trim();
    if (trimmed && !looksLikeEncryptedValue(trimmed)) {
      return trimmed;
    }
  }

  return null;
}

export async function findSuggestedParentEmail(
  leadId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  const enrolledStudents = await findEnrolledStudents(leadId, fetchImpl);

  if (enrolledStudents.length === 0) {
    return null;
  }

  for (const student of enrolledStudents) {
    const { student: row } = await loadStudentRecord(leadId, student.studentName, fetchImpl);
    const email = pickParentEmail(row);
    if (email) {
      return email;
    }
  }

  return null;
}
