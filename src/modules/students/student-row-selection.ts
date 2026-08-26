import type { MsStudentDirRow } from "@/modules/students/types";

type SlotLike = {
  status?: string;
  slot_slug?: string;
  updated?: number;
};

function normalizeName(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  try {
    return decodeURIComponent(value).trim().replace(/%20/g, " ").replace(/\s+/g, " ");
  } catch {
    return value.trim().replace(/%20/g, " ").replace(/\s+/g, " ");
  }
}

function slotList(row: MsStudentDirRow): SlotLike[] {
  const slots = row.slots;
  if (!slots) {
    return [];
  }
  return Array.isArray(slots) ? slots : [slots as SlotLike];
}

function enrolledSlotScore(slots: SlotLike[]): number {
  if (slots.some((slot) => slot?.status === "enrolled")) {
    return 2;
  }
  if (slots.some((slot) => slot?.status === "deleted")) {
    return 0;
  }
  return 1;
}

/**
 * When teacher changes leave duplicate ms_student_dir rows, keep the same row
 * SISCompletedForm would prefer: enrolled slot, contact_id present, newest updated.
 */
export function pickBestEnrolledStudentRow(
  rows: MsStudentDirRow[],
  preferredStudentName?: string,
): MsStudentDirRow {
  if (rows.length === 1) {
    return rows[0];
  }

  const normalizedPreferred = preferredStudentName
    ? normalizeName(preferredStudentName).toLowerCase()
    : null;

  const exactMatches = normalizedPreferred
    ? rows.filter(
        (row) => normalizeName(row.student_name).toLowerCase() === normalizedPreferred,
      )
    : rows;

  const pool = exactMatches.length > 0 ? exactMatches : rows;

  const sorted = [...pool].sort((left, right) => {
    const leftSlots = slotList(left);
    const rightSlots = slotList(right);
    const scoreDiff = enrolledSlotScore(rightSlots) - enrolledSlotScore(leftSlots);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    const leftContact = typeof left.contact_id === "string" && left.contact_id.trim() ? 1 : 0;
    const rightContact = typeof right.contact_id === "string" && right.contact_id.trim() ? 1 : 0;
    if (rightContact !== leftContact) {
      return rightContact - leftContact;
    }

    const leftUpdated = typeof left.updated === "number" ? left.updated : 0;
    const rightUpdated = typeof right.updated === "number" ? right.updated : 0;
    return rightUpdated - leftUpdated;
  });

  return sorted[0];
}

export function normalizeStudentName(value: string): string {
  return normalizeName(value);
}
