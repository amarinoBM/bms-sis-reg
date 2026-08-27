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
  it("treats null as success for legacy Cloud Code", () => {
    expect(isSisCompletedFormSuccess(null)).toBe(true);
    expect(isSisCompletedFormSuccess(undefined)).toBe(true);
  });

  it("treats downstream Cloud Code failures as success for the parent", () => {
    expect(isSisCompletedFormSuccess({ success: false, stage: "slack_notification" })).toBe(
      true,
    );
    expect(
      isSisCompletedFormSuccess({
        success: false,
        stage: "google_or_close_credentials_note",
      }),
    ).toBe(true);
    expect(isSisCompletedFormSuccess({ error: "duplicate" })).toBe(true);
  });

  it("hard-fails only identity guard results", () => {
    expect(
      isSisCompletedFormSuccess({
        success: false,
        stage: "student_identity_guard",
        error: "Student identity evidence is missing or ambiguous",
      }),
    ).toBe(false);
  });

  it("accepts truthy success payloads", () => {
    expect(isSisCompletedFormSuccess({ success: true })).toBe(true);
    expect(isSisCompletedFormSuccess({ ok: true })).toBe(true);
    expect(isSisCompletedFormSuccess({ success: true, stage: "complete" })).toBe(true);
    expect(isSisCompletedFormSuccess({ success: true, stage: "already_complete" })).toBe(
      true,
    );
  });

  it("formats identity failures with a help contact", () => {
    expect(
      formatSisCompletedFormFailure({
        success: false,
        stage: "student_identity_guard",
        error: "Contact identity evidence is malformed or conflicting",
      }),
    ).toContain("help@brilliantmicroschool.org");
  });
});
