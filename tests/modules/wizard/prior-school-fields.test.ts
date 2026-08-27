import { describe, expect, it } from "vitest";

import {
  learningExperienceHint,
  learningExperienceLabel,
  learningSampleDescription,
  learningSampleLabel,
  priorSchoolNameLabel,
  priorSchoolStepDescription,
  readIepOr504Plan,
  readLearningCenterBool,
  shouldAskLastSchoolAttendance,
  shouldShowLastSchoolFields,
} from "@/modules/wizard/prior-school-fields";

describe("prior school labels", () => {
  it("uses legacy wording with student name interpolation", () => {
    expect(priorSchoolNameLabel("Madilyn")).toBe("What was the name of Madilyn’s last school?");
    expect(learningExperienceLabel("Madilyn")).toBe(
      "Can you briefly describe Madilyn’s past learning experience during the last 12 months?",
    );
    expect(learningExperienceHint("Madilyn")).toBe(
      "For example: curriculum style, what Madilyn enjoyed or found difficult, and where they thrived or struggled.",
    );
    expect(learningSampleLabel("Madilyn")).toBe("Upload a sample of Madilyn's current learning");
    expect(learningSampleDescription("Madilyn")).toBe(
      "A recent assignment, project, or writing sample helps us see where Madilyn is today.",
    );
    expect(priorSchoolStepDescription("Madilyn")).toContain("recent learning");
  });
});

describe("prior school conditionals", () => {
  it("shows last school fields for brick-and-mortar environments", () => {
    expect(
      shouldShowLastSchoolFields({
        learning_environment_past_12_months: "Physical private school",
      }),
    ).toBe(true);
  });

  it("asks last-school attendance for homeschool environments", () => {
    expect(
      shouldAskLastSchoolAttendance("Homeschool with parent"),
    ).toBe(true);
    expect(
      shouldAskLastSchoolAttendance("Physical public/charter school"),
    ).toBe(false);
  });

  it("hides last school fields when homeschool parent and no last school", () => {
    expect(
      shouldShowLastSchoolFields({
        learning_environment_past_12_months: "Homeschool with parent",
        learningCenterBool: false,
      }),
    ).toBe(false);
  });

  it("reads boolean gates", () => {
    expect(readLearningCenterBool(true)).toBe(true);
    expect(readLearningCenterBool(false)).toBe(false);
    expect(readLearningCenterBool(null)).toBe(null);
    expect(readIepOr504Plan(true)).toBe(true);
    expect(readIepOr504Plan(false)).toBe(false);
  });
});
