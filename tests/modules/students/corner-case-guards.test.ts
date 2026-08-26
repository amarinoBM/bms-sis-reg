import { describe, expect, it } from "vitest";

import {
  formatSisCompletedFormFailure,
  isSisCompletedFormSuccess,
} from "@/modules/sis/complete-result";
import {
  normalizeStudentName,
  pickBestEnrolledStudentRow,
} from "@/modules/students/student-row-selection";

describe("student row selection", () => {
  it("prefers enrolled row with contact_id when duplicates exist", () => {
    const picked = pickBestEnrolledStudentRow(
      [
        {
          objectId: "old",
          student_name: "Noah",
          contact_id: "",
          updated: 100,
          slots: [{ status: "deleted" }],
        },
        {
          objectId: "new",
          student_name: "Noah",
          contact_id: "cont_abcdefghijklmnop",
          updated: 50,
          slots: [{ status: "enrolled" }],
        },
      ],
      "Noah",
    );

    expect(picked.objectId).toBe("new");
  });

  it("decodes encoded student names", () => {
    expect(normalizeStudentName("Noah%20Moore")).toBe("Noah Moore");
  });
});

describe("SISCompletedForm result parsing", () => {
  it("treats null and explicit failure as unsuccessful", () => {
    expect(isSisCompletedFormSuccess(null)).toBe(false);
    expect(isSisCompletedFormSuccess({ success: false })).toBe(false);
    expect(isSisCompletedFormSuccess({ error: "duplicate" })).toBe(false);
  });

  it("accepts truthy success payloads", () => {
    expect(isSisCompletedFormSuccess({ success: true })).toBe(true);
    expect(isSisCompletedFormSuccess({ ok: true })).toBe(true);
  });

  it("formats failure messages for parents", () => {
    expect(formatSisCompletedFormFailure({ message: "contact_missing" })).toBe(
      "contact_missing",
    );
    expect(formatSisCompletedFormFailure(null)).toContain("help@brilliantmicroschool.org");
  });
});
