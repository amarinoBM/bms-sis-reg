import { describe, expect, it } from "vitest";

import { PTO_COPY, SHARE_CONTACT_COPY } from "@/modules/wizard/parent-guardian-copy";
import { STEP_FORM_DEFINITIONS } from "@/modules/wizard/step-schemas";

describe("parent-guardian copy", () => {
  it("uses legacy share-contact wording on parent contact step", () => {
    const step = STEP_FORM_DEFINITIONS.find((definition) => definition.stepId === "2");
    const shareField = step?.fields.find((field) => field.key === "share_contact");

    expect(shareField?.label).toBe(SHARE_CONTACT_COPY.label);
    expect(SHARE_CONTACT_COPY.label).toContain("30-mile radius");
  });

  it("uses expanded PTO volunteer copy on guardians step", () => {
    const step = STEP_FORM_DEFINITIONS.find((definition) => definition.stepId === "3");
    const ptoField = step?.fields.find((field) => field.key === "PTO");

    expect(ptoField?.label).toBe(PTO_COPY.label);
    expect(PTO_COPY.description).toContain("Parent Teacher Organization");
  });

  it("uses share-contact hint for parent map opt-in", () => {
    expect(SHARE_CONTACT_COPY.hint).toContain("parent map");
  });
});
