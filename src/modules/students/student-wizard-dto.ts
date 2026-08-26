import type { StudentLoadResult } from "@/modules/students/types";

const BLOCKED_STUDENT_FIELDS = new Set([
  "studentMSPassword",
  "studentMSEmail",
  "UpdateHistory",
  "previous_data",
  "changed_fields",
  "date_updated",
  "slots",
]);

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function stripStudentForClient(
  student: Record<string, unknown>,
): Record<string, unknown> {
  const stripped: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(student)) {
    if (!BLOCKED_STUDENT_FIELDS.has(key)) {
      stripped[key] = value;
    }
  }

  return stripped;
}

export function toStudentLoadResultDto(result: StudentLoadResult): StudentLoadResult {
  return {
    student: stripStudentForClient(result.student) as StudentLoadResult["student"],
    studentInfo: result.studentInfo,
    chargebeeId: result.chargebeeId,
    enrolledStudents: result.enrolledStudents,
  };
}

export function collectLeadParentEmails(
  students: Record<string, unknown>[],
): string[] {
  const emails = new Set<string>();

  for (const student of students) {
    for (const key of ["parent_email", "email"] as const) {
      const value = student[key];
      if (typeof value === "string" && value.trim() && !value.startsWith("sis:v1:")) {
        emails.add(normalizeEmail(value));
      }
    }
  }

  return [...emails];
}

export function isEmailAllowedForLead(
  email: string,
  allowedEmails: string[],
): boolean {
  if (allowedEmails.length === 0) {
    return false;
  }

  return allowedEmails.includes(normalizeEmail(email));
}
