import type { MsStudentDirRow } from "@/modules/students/types";
import { isValidEmail } from "@/lib/field-validation";

export type ParentEmailState = {
  status: "missing" | "parent_only" | "legacy_only" | "matching" | "different";
  parentEmail: string | null;
  legacyEmail: string | null;
  effectiveEmail: string | null;
};

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

export function resolveParentEmailState(row: MsStudentDirRow): ParentEmailState {
  const parentEmail = usableEmail(row.parent_email);
  const legacyEmail = usableEmail(row.email);

  if (!parentEmail && !legacyEmail) {
    return { status: "missing", parentEmail, legacyEmail, effectiveEmail: null };
  }
  if (parentEmail && !legacyEmail) {
    return { status: "parent_only", parentEmail, legacyEmail, effectiveEmail: parentEmail };
  }
  if (!parentEmail && legacyEmail) {
    return { status: "legacy_only", parentEmail, legacyEmail, effectiveEmail: legacyEmail };
  }

  const status = parentEmail!.toLowerCase() === legacyEmail!.toLowerCase()
    ? "matching"
    : "different";
  return { status, parentEmail, legacyEmail, effectiveEmail: parentEmail };
}

export function prepareParentEmailSaveFields(
  submittedFields: Record<string, unknown>,
  previousRow: MsStudentDirRow,
): Record<string, unknown> {
  const prepared = { ...submittedFields };
  // `email` is a compatibility slot, not a client-editable field. Ignore any
  // submitted value and derive the only permitted change from the saved row.
  delete prepared.email;

  const selectedEmail = usableEmail(prepared.parent_email);
  const previous = resolveParentEmailState(previousRow);
  if (
    previous.status === "different" &&
    selectedEmail?.toLowerCase() === previous.legacyEmail?.toLowerCase()
  ) {
    // Swap rather than overwrite so both verified family addresses remain
    // available while `parent_email` becomes the chosen primary address.
    prepared.email = previous.parentEmail;
  }

  return prepared;
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
