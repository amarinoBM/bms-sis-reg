import { describe, expect, it } from "vitest";

import { SAVE_HANDLERS } from "@/modules/wizard/save-handlers";
import { pickSaveStepFields } from "@/modules/wizard/save-service";
import {
  formatMissingFieldsMessage,
  validateSubmitReadiness,
} from "@/modules/wizard/submit-validation";

describe("submit validation", () => {
  it("flags incomplete student records", () => {
    const result = validateSubmitReadiness({
      student_name: "Noah",
    });

    expect(result.ready).toBe(false);
    expect(result.missingLabels).toContain("Student Last Name");
    expect(formatMissingFieldsMessage(result.missingLabels)).toContain(
      "Student Last Name",
    );
  });

  it("accepts a minimally complete record", () => {
    const result = validateSubmitReadiness({
      student_name: "Noah",
      student_last_name: "Moore",
      student_birth_date: Date.now(),
      most_interested_in: "Science",
      learning_or_behavioral_challenges: false,
      parent_name: "James",
      parent_last_name: "Moore",
      parent_email: "james@example.com",
      parent_phone: "555-0100",
      parent_address: "123 Main St",
      math_grade_level: "Grade 6",
      ela_grade_level: "Grade 6",
      science_grade_level: "Grade 6",
      learning_environment_past_12_months: "Homeschool",
      learning_experiece_past_12_months: "Great",
      home_state: "FL",
      honorCodeSigned: "Completed",
      ToSBool: true,
      Caucasian: true,
    });

    expect(result.ready).toBe(true);
  });
});

describe("save handler field whitelists", () => {
  it("only keeps allowed save1 fields", () => {
    const picked = pickSaveStepFields("save1", {
      student_last_name: "Moore",
      student_name: "Noah",
      unrelated: "drop me",
    });

    expect(picked.student_last_name).toBe("Moore");
    expect(picked.unrelated).toBeUndefined();
    expect(picked.student_name).toBeUndefined();
  });

  it("includes share_contact on save1.5", () => {
    expect(SAVE_HANDLERS["save1.5"]).toContain("share_contact");
  });
});
