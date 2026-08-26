import { AppError } from "@/core/app-error";
import { BACKENDLESS_TABLES } from "@/config/backendless";
import { updateAppRow } from "@/server/connectors/backendless/app-data-client";
import {
  decryptStudentDirRow,
  encryptStudentDirRow,
} from "@/server/connectors/backendless/cloud-code-client";
import { hydrateUploadMetadata } from "@/modules/students/upload-metadata";
import { buildStudentInfoState } from "@/modules/students/student-info-state";
import type {
  EnrolledStudentSummary,
  MsStudentDirRow,
  StudentLoadResult,
} from "@/modules/students/types";

function escapeWhereValue(value: string): string {
  return value.replace(/'/g, "''");
}

function trimStudentName(studentName: string): string {
  return studentName.trim().replace(/%20/g, " ");
}

function buildEnrolledWhereClause(leadId: string, studentName?: string): string {
  const escapedLeadId = escapeWhereValue(leadId);
  let clause = `lead_id='${escapedLeadId}' and student_name not like '%[delete]%' and slots.status='enrolled'`;

  if (studentName) {
    clause += ` and student_name='${escapeWhereValue(trimStudentName(studentName))}'`;
  }

  return clause;
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

  return rows
    .filter((row) => row.student_name && row.objectId)
    .map((row) => ({
      studentName: String(row.student_name),
      objectId: String(row.objectId),
    }));
}

export async function loadStudentRecord(
  leadId: string,
  studentName?: string,
  fetchImpl: typeof fetch = fetch,
): Promise<StudentLoadResult> {
  const normalizedName = studentName ? trimStudentName(studentName) : undefined;
  const where = buildEnrolledWhereClause(leadId, normalizedName);
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
  const enrolledStudents = rows
    .filter((row) => row.student_name && row.objectId)
    .map((row) => ({
      studentName: String(row.student_name),
      objectId: String(row.objectId),
    }));

  if (enrolledStudents.length === 0) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "No enrolled student found for this registration link.",
    });
  }

  const targetName = normalizedName ?? enrolledStudents[0].studentName;
  const row =
    rows.find((candidate) => String(candidate.student_name) === targetName) ?? rows[0];

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
  const candidates = [row.email, row.parent_email];

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
