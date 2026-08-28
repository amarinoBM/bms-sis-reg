import { completeSisForm } from "@/server/connectors/backendless/sis-cloud-code";
import { getAppRow } from "@/server/connectors/backendless/app-data-client";
import { BACKENDLESS_TABLES } from "@/config/backendless";
import {
  formatSisCompletedFormFailure,
  isSisCompletedFormSuccess,
} from "@/modules/sis/complete-result";
import { AppError } from "@/core/app-error";

type CompleteSisInput = {
  leadId: string;
  objectId: string;
  student: Record<string, unknown>;
};

function pickString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function completeSisRegistration(
  input: CompleteSisInput,
  fetchImpl: typeof fetch = fetch,
): Promise<Record<string, unknown>> {
  const studentData = {
    lead_id: input.leadId,
    student_name: pickString(input.student.student_name),
    student_nick_name: pickString(input.student.student_nick_name),
    student_last_name: pickString(input.student.student_last_name),
    email: pickString(input.student.email),
    contact_id: pickString(input.student.contact_id),
    home_state: pickString(input.student.home_state),
    subjects: pickString(input.student.subjects),
  };

  const event = {
    lead_id: input.leadId,
    student_name: studentData.student_name,
    contact_id: studentData.contact_id || undefined,
    StudentData: studentData,
  };

  // Cloud Code owns the completion flag. A lost response may occur after it commits.
  let result: Record<string, unknown> | undefined;
  try {
    result = await completeSisForm(event, fetchImpl);
  } catch {
    // Verify below; never retry side effects or declare failure solely from transport status.
  }

  if (!isSisCompletedFormSuccess(result)) {
    throw new AppError({
      code: "EXTERNAL_WRITE_FAILED",
      message: formatSisCompletedFormFailure(result),
      status: 502,
    });
  }

  const saved = await getAppRow(BACKENDLESS_TABLES.msStudentDir, input.objectId, fetchImpl).catch(() => null);
  if (!saved || saved.objectId !== input.objectId || saved.lead_id !== input.leadId || saved.is_complete_sis !== true) {
    throw new AppError({
      code: "EXTERNAL_READBACK_MISMATCH",
      message: "We could not confirm your submission. Reload the registration to check its status before trying again.",
      status: 502,
    });
  }
  return { success: true };
}
