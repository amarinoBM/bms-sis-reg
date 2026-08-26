import { completeSisForm } from "@/server/connectors/backendless/sis-cloud-code";
import { saveStudentRecord } from "@/modules/students/repository";

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
    StudentData: studentData,
  };

  const result = await completeSisForm(event, fetchImpl);

  await saveStudentRecord(
    input.leadId,
    input.objectId,
    {
      is_complete_sis: true,
      "12disabled": true,
    },
    fetchImpl,
  );

  return result;
}
