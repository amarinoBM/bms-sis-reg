import { describe, expect, it } from "vitest";

import {
  hasText,
  isConfidenceRating,
  isValidEmail,
  isValidPhone,
} from "@/lib/field-validation";
import { TRANSCRIPT_DELIVERY_SCHOOL } from "@/modules/wizard/transcript-fields";
import { validateStepForSave } from "@/modules/wizard/step-validation";

describe("field-validation", () => {
  it("validates email and phone formats", () => {
    expect(isValidEmail("parent@example.com")).toBe(true);
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidPhone("555-010-1234")).toBe(true);
    expect(isValidPhone("123")).toBe(false);
    expect(isConfidenceRating("3")).toBe(true);
    expect(isConfidenceRating("6")).toBe(false);
    expect(hasText("  hello ")).toBe(true);
    expect(hasText("")).toBe(false);
  });
});

describe("step-validation", () => {
  it("requires parent contact fields on step 2", () => {
    const result = validateStepForSave("2", {
      parent_name: "Jane",
      parent_email: "bad-email",
      parent_phone: "123",
    });

    expect(result.valid).toBe(false);
    expect(result.fieldErrors.parent_last_name).toBeTruthy();
    expect(result.fieldErrors.parent_email).toContain("valid email");
    expect(result.fieldErrors.parent_phone).toContain("10 digits");
  });

  it("requires learning profile gate and coverage on step 5", () => {
    const unanswered = validateStepForSave("5", {});
    expect(unanswered.fieldErrors.learning_or_behavioral_challenges).toBeTruthy();

    const missingDetails = validateStepForSave("5", {
      learning_or_behavioral_challenges: true,
    });
    expect(missingDetails.fieldErrors.learning_profile_details).toBeTruthy();

    const complete = validateStepForSave("5", {
      learning_or_behavioral_challenges: false,
    });
    expect(complete.valid).toBe(true);
  });

  it("requires transcript delivery on step 9", () => {
    const result = validateStepForSave("9", {
      uploadTranscript: TRANSCRIPT_DELIVERY_SCHOOL,
      transferCredit: true,
      CreditTransfer: [],
      transcriptFiles: [],
    });

    expect(result.fieldErrors.CreditTransfer).toBeTruthy();
  });
});
