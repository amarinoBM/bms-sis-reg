import { describe, expect, it } from "vitest";

import {
  isWizardStepId,
  normalizeRegistrationStudentName,
  parseRegistrationLinkContext,
} from "@/modules/registration/registration-link";

describe("registration link context", () => {
  it("normalizes a student and keeps a valid target step", () => {
    expect(parseRegistrationLinkContext({ studentName: "  Madilyn   Bennett ", step: "10" })).toEqual({
      studentName: "Madilyn Bennett",
      stepId: "10",
    });
  });

  it.each([undefined, "", "0", "15", "State"])('falls back to step 1 for invalid step "%s"', (step) => {
    expect(parseRegistrationLinkContext({ step }).stepId).toBe("1");
  });

  it("does not turn missing or blank student names into a target", () => {
    expect(normalizeRegistrationStudentName("  ")).toBeUndefined();
    expect(parseRegistrationLinkContext({ studentName: undefined }).studentName).toBeUndefined();
  });

  it("uses the canonical wizard step allowlist", () => {
    expect(isWizardStepId("10")).toBe(true);
    expect(isWizardStepId("999")).toBe(false);
    expect(isWizardStepId(10)).toBe(false);
  });
});
