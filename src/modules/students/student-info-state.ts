import { buildStepCompletionMap } from "@/modules/wizard/progress";
import type { EnrolledStudentSummary, MsStudentDirRow } from "@/modules/students/types";

export type StudentInfoState = {
  objectId: string;
  leadId: string;
  studentName: string;
  chargebeeID: string | null;
  stepCompletion: Record<string, boolean>;
  disabledSteps: Record<string, boolean>;
};

export function buildStudentInfoState(
  leadId: string,
  student: MsStudentDirRow,
  chargebeeId: string | null,
): StudentInfoState {
  const stepCompletion = buildStepCompletionMap(student);
  const disabledSteps: Record<string, boolean> = {};

  for (const [key, value] of Object.entries(student)) {
    if (key.endsWith("disabled") && value === true) {
      disabledSteps[key.replace(/disabled$/, "")] = true;
    }
  }

  return {
    objectId: String(student.objectId ?? ""),
    leadId,
    studentName: String(student.student_name ?? ""),
    chargebeeID: chargebeeId ?? (student.chargebeeID ? String(student.chargebeeID) : null),
    stepCompletion,
    disabledSteps,
  };
}

export type SisWorkspacePayload = {
  student: MsStudentDirRow;
  studentInfo: StudentInfoState;
  chargebeeId: string | null;
  enrolledStudents: EnrolledStudentSummary[];
};

export function buildSisWorkspacePayload(
  leadId: string,
  loadResult: {
    student: MsStudentDirRow;
    chargebeeId: string | null;
    enrolledStudents: EnrolledStudentSummary[];
  },
): SisWorkspacePayload {
  const studentInfo = buildStudentInfoState(
    leadId,
    loadResult.student,
    loadResult.chargebeeId,
  );

  return {
    student: loadResult.student,
    studentInfo,
    chargebeeId: loadResult.chargebeeId,
    enrolledStudents: loadResult.enrolledStudents,
  };
}
