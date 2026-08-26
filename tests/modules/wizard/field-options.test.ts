import { describe, expect, it } from "vitest";

import {
  applyEthnicitySelection,
  applyGenderSelection,
  readEthnicitySelection,
  readGenderSelection,
  readInterestsSelection,
} from "@/modules/wizard/field-options";
import {
  enrichFlatFormValues,
  expandVirtualFormFields,
} from "@/modules/wizard/field-normalization";

describe("wizard field enums", () => {
  it("maps gender selection to boolean columns", () => {
    const fields: Record<string, unknown> = {};
    applyGenderSelection(fields, "Female");

    expect(fields.female).toBe(true);
    expect(fields.male).toBe(false);
    expect(fields.transgender).toBe(false);
    expect(readGenderSelection(fields)).toBe("Female");
  });

  it("maps ethnicity selection to boolean columns", () => {
    const fields: Record<string, unknown> = {};
    applyEthnicitySelection(fields, "Latino or Hispanic");

    expect(fields.Latino_Hispanic).toBe(true);
    expect(fields.Caucasian).toBe(false);
    expect(readEthnicitySelection(fields)).toBe("Latino or Hispanic");
  });

  it("expands virtual save1 fields before persistence", () => {
    const expanded = expandVirtualFormFields("save1", {
      gender_selection: "Male",
      ethnicity_selection: "Asian",
      gender_selection_extra: "ignored",
    });

    expect(expanded.male).toBe(true);
    expect(expanded.Asian).toBe(true);
    expect(expanded.gender_selection).toBeUndefined();
    expect(expanded.ethnicity_selection).toBeUndefined();
  });

  it("flattens stored student row into form values", () => {
    const flat = enrichFlatFormValues({
      female: true,
      Caucasian: true,
      interests: ["Sports", "Music"],
      most_interested_in: "Sports: Soccer, Basketball",
      share_contact: "Yes",
      secondary_guardian: { parent_relation: "Legal Guardian" },
    });

    expect(flat.gender_selection).toBe("Female");
    expect(flat.ethnicity_selection).toBe("Caucasian");
    expect(flat.interests).toEqual(["Sports", "Music"]);
    expect(flat.most_interested_in).toBe("Sports");
    expect(flat.share_contact).toBe(true);
    expect(flat["secondary_guardian.parent_relation"]).toBe("Legal Guardian");
  });

  it("normalizes interest arrays on save2", () => {
    const expanded = expandVirtualFormFields("save2", {
      most_interested_in: "Technology and Computing",
      interests: ["Sports", "Music"],
    });

    expect(expanded.most_interested_in).toBe("Technology and Computing");
    expect(readInterestsSelection(expanded.interests)).toEqual(["Sports", "Music"]);
  });
});
