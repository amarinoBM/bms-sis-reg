import { describe, expect, it } from "vitest";

import { getFieldUiHints } from "@/modules/wizard/field-hints";
import type { StepFieldDefinition } from "@/modules/wizard/step-schemas";

function field(key: string, type: StepFieldDefinition["type"] = "text"): StepFieldDefinition {
  return { key, label: key, type };
}

describe("field-hints", () => {
  it("returns placeholders and layout for known fields", () => {
    const hints = getFieldUiHints(field("student_name"));

    expect(hints.placeholder).toBe("e.g. Josiah");
    expect(hints.layout).toBe("half");
    expect(hints.autoComplete).toBe("given-name");
  });

  it("prefers schema placeholder when provided", () => {
    const hints = getFieldUiHints({
      key: "CreditTransfer",
      label: "Credits",
      type: "textarea",
      placeholder: "Custom placeholder",
    });

    expect(hints.placeholder).toBe("Custom placeholder");
  });

  it("defaults layout to full", () => {
    expect(getFieldUiHints(field("parent_address")).layout).toBe("full");
  });
});
