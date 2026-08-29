import type { MsStudentDirRow } from "@/modules/students/types";
import { isValidEmail } from "@/lib/field-validation";

function usableEmail(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!isValidEmail(trimmed) || trimmed.startsWith("sis:v1:")) {
    return null;
  }

  return trimmed;
}

export function preferredParentEmail(row: MsStudentDirRow): string | null {
  return usableEmail(row.parent_email) ?? usableEmail(row.email);
}

export function collectPreferredParentEmails(rows: MsStudentDirRow[]): string[] {
  const emails: string[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const email = preferredParentEmail(row);
    const normalized = email?.toLowerCase();

    if (!email || !normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    emails.push(email);
  }

  return emails;
}
