import { describe, expect, it } from "vitest";

import {
  applyEthnicitySelection,
  applyGenderSelection,
  GENDER_OTHER_LABEL,
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

  it("keeps other_gender text when Other is selected", () => {
    const fields: Record<string, unknown> = { other_gender: "Agender" };
    applyGenderSelection(fields, GENDER_OTHER_LABEL);

    expect(fields.female).toBe(false);
    expect(fields.male).toBe(false);
    expect(fields.other_gender).toBe("Agender");
    expect(readGenderSelection(fields)).toBe(GENDER_OTHER_LABEL);
  });

  it("clears other_gender when a listed gender is selected", () => {
    const fields: Record<string, unknown> = { other_gender: "Agender" };
    applyGenderSelection(fields, "Male");

    expect(fields.male).toBe(true);
    expect(fields.other_gender).toBe("");
  });

  it("reads Other from stored other_gender text", () => {
    expect(readGenderSelection({ other_gender: "Two-spirit" })).toBe(GENDER_OTHER_LABEL);
    expect(
      enrichFlatFormValues({ other_gender: "Two-spirit" }).gender_selection,
    ).toBe(GENDER_OTHER_LABEL);
  });

  it("expands Other gender on save1 without boolean flags", () => {
    const expanded = expandVirtualFormFields("save1", {
      gender_selection: GENDER_OTHER_LABEL,
      other_gender: "Agender",
    });

    expect(expanded.female).toBe(false);
    expect(expanded.male).toBe(false);
    expect(expanded.other_gender).toBe("Agender");
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
    expect(flat.interests).toEqual([
      "Sports: Soccer, Basketball, Swimming, Tennis, Gymnastics, etc.",
      "Music: Playing an instrument, Singing, Listening to music, Music composition, etc.",
    ]);
    expect(flat.most_interested_in).toBe(
      "Sports: Soccer, Basketball, Swimming, Tennis, Gymnastics, etc.",
    );
    expect(flat.share_contact).toBe(true);
    expect(flat["secondary_guardian.parent_relation"]).toBe("Legal Guardian");
  });

  it("normalizes stored interest arrays when flattening student row", () => {
    const flat = enrichFlatFormValues({
      interests: ["Sports", "Music"],
      most_interested_in: "Technology and Computing",
    });

    expect(flat.interests).toEqual([
      "Sports: Soccer, Basketball, Swimming, Tennis, Gymnastics, etc.",
      "Music: Playing an instrument, Singing, Listening to music, Music composition, etc.",
    ]);
    expect(flat.most_interested_in).toBe(
      "Technology and Computing: Video games, Coding, Robotics, Web design, etc.",
    );
  });

  it("normalizes interest arrays on save2", () => {
    const expanded = expandVirtualFormFields("save2", {
      most_interested_in: "Technology and Computing",
      interests: ["Sports", "Music"],
    });

    expect(expanded.most_interested_in).toBe(
      "Technology and Computing: Video games, Coding, Robotics, Web design, etc.",
    );
    expect(readInterestsSelection(expanded.interests)).toEqual([
      "Sports: Soccer, Basketball, Swimming, Tennis, Gymnastics, etc.",
      "Music: Playing an instrument, Singing, Listening to music, Music composition, etc.",
    ]);
  });
});
