import { describe, expect, it } from "vitest";

import {
  collectGuardianContactsFromFlat,
  guardianContactHasValues,
  guardianFlatKey,
  normalizeGuardianContactForSave,
} from "@/modules/wizard/guardian-contact";
import { enrichFlatFormValues } from "@/modules/wizard/field-normalization";
import { unflattenFormValues } from "@/modules/wizard/step-schemas";

describe("guardian contact helpers", () => {
  it("flattens secondary and tertiary guardians for the form", () => {
    const flat = enrichFlatFormValues({
      secondary_guardian: {
        parent_name: "Jane",
        parent_relation: "Parent",
      },
      tertiary_guardian: {
        parent_name: "John",
        parent_email: "john@example.com",
      },
    });

    expect(flat[guardianFlatKey("secondary_guardian", "parent_name")]).toBe("Jane");
    expect(flat[guardianFlatKey("tertiary_guardian", "parent_email")]).toBe(
      "john@example.com",
    );
  });

  it("unflattens both guardians and clears tertiary when removed", () => {
    const result = unflattenFormValues({
      PTO: true,
      [guardianFlatKey("secondary_guardian", "parent_name")]: "Jane",
      [guardianFlatKey("tertiary_guardian", "parent_name")]: "",
      [guardianFlatKey("tertiary_guardian", "parent_email")]: "",
    });

    expect(result.secondary_guardian).toEqual({ parent_name: "Jane" });
    expect(result.tertiary_guardian).toBeNull();
  });

  it("normalizes empty guardian objects to null", () => {
    expect(
      normalizeGuardianContactForSave({
        parent_name: "",
        parent_email: " ",
      }),
    ).toBeNull();
    expect(
      guardianContactHasValues({
        parent_name: "Jane",
      }),
    ).toBe(true);
    expect(
      collectGuardianContactsFromFlat({
        [guardianFlatKey("secondary_guardian", "parent_name")]: "Jane",
      }).secondary_guardian,
    ).toEqual({ parent_name: "Jane" });
  });
});
