import { describe, expect, it } from "vitest";

import {
  getFieldRequirement,
  isConfidenceFieldRequired,
  isStepFieldOptional,
  isStepFieldRequired,
} from "@/modules/wizard/field-requirements";
import { GENDER_OTHER_LABEL } from "@/modules/wizard/field-options";

describe("field-requirements", () => {
  it("marks step 1 core fields as required", () => {
    const values: Record<string, unknown> = { gender_selection: "Male" };

    expect(isStepFieldRequired("1", "student_name", values)).toBe(true);
    expect(isStepFieldRequired("1", "student_last_name", values)).toBe(true);
    expect(isStepFieldRequired("1", "student_birth_date", values)).toBe(true);
    expect(isStepFieldRequired("1", "gender_selection", values)).toBe(true);
    expect(isStepFieldRequired("1", "ethnicity_selection", values)).toBe(true);
    expect(getFieldRequirement("1", "student_name", values)).toBe("required");
  });

  it("marks step 1 optional uploads and nickname", () => {
    const values: Record<string, unknown> = {};

    expect(isStepFieldOptional("1", "student_nick_name", values)).toBe(true);
    expect(isStepFieldOptional("1", "studentBirthCert", values)).toBe(true);
    expect(isStepFieldOptional("1", "studentPic", values)).toBe(true);
    expect(getFieldRequirement("1", "student_nick_name", values)).toBe("optional");
  });

  it("requires other_gender only when gender is Other", () => {
    expect(
      isStepFieldRequired("1", "other_gender", { gender_selection: GENDER_OTHER_LABEL }),
    ).toBe(true);
    expect(
      getFieldRequirement("1", "other_gender", { gender_selection: GENDER_OTHER_LABEL }),
    ).toBe("required");
    expect(
      isStepFieldOptional("1", "other_gender", { gender_selection: "Female" }),
    ).toBe(true);
    expect(
      getFieldRequirement("1", "other_gender", { gender_selection: "Female" }),
    ).toBe("optional");
  });

  it("marks parent contact fields as required on step 2", () => {
    const values: Record<string, unknown> = {};

    expect(isStepFieldRequired("2", "parent_email", values)).toBe(true);
    expect(getFieldRequirement("2", "share_contact", values)).toBe("optional");
  });

  it("marks confidence ratings as required custom fields", () => {
    expect(isConfidenceFieldRequired("confidence_in_reading")).toBe(true);
    expect(isConfidenceFieldRequired("unknown_field")).toBe(false);
  });
});
