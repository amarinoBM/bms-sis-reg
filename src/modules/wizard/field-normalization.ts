import {
  flattenGuardianContact,
  normalizeGuardianContactForSave,
} from "@/modules/wizard/guardian-contact";
import type { SaveHandlerKey } from "@/modules/wizard/save-handlers";
import {
  applyEthnicitySelection,
  applyGenderSelection,
  normalizeInterestCategory,
  readEthnicitySelection,
  readGenderSelection,
  readInterestsSelection,
} from "@/modules/wizard/field-options";

const VIRTUAL_FIELD_KEYS = new Set([
  "gender_selection",
  "ethnicity_selection",
]);

export function expandVirtualFormFields(
  saveStep: SaveHandlerKey,
  fields: Record<string, unknown>,
): Record<string, unknown> {
  const expanded = { ...fields };

  if (saveStep === "save1") {
    const genderSelection = expanded.gender_selection;
    if (typeof genderSelection === "string" && genderSelection) {
      applyGenderSelection(expanded, genderSelection);
    }

    const ethnicitySelection = expanded.ethnicity_selection;
    if (typeof ethnicitySelection === "string" && ethnicitySelection) {
      applyEthnicitySelection(expanded, ethnicitySelection);
    }
  }

  if (saveStep === "save2") {
    const interests = readInterestsSelection(expanded.interests);
    expanded.interests = interests.map(
      (item) => normalizeInterestCategory(item) ?? item,
    );

    const mostInterestedIn = expanded.most_interested_in;
    if (typeof mostInterestedIn === "string") {
      const normalized = normalizeInterestCategory(mostInterestedIn);
      if (normalized) {
        expanded.most_interested_in = normalized;
      }
    }
  }

  if (saveStep === "save1.6") {
    expanded.secondary_guardian = normalizeGuardianContactForSave(
      expanded.secondary_guardian,
    );
    expanded.tertiary_guardian = normalizeGuardianContactForSave(
      expanded.tertiary_guardian,
    );
  }

  for (const key of VIRTUAL_FIELD_KEYS) {
    delete expanded[key];
  }

  return expanded;
}

export function enrichFlatFormValues(
  student: Record<string, unknown>,
): Record<string, unknown> {
  const flat: Record<string, unknown> = { ...student };

  flat.gender_selection = readGenderSelection(student);
  flat.ethnicity_selection = readEthnicitySelection(student);
  flat.interests = readInterestsSelection(student.interests);

  const mostInterestedIn =
    typeof student.most_interested_in === "string" ? student.most_interested_in : "";
  flat.most_interested_in = normalizeInterestCategory(mostInterestedIn) ?? mostInterestedIn;

  if (student.share_contact === "Yes") {
    flat.share_contact = true;
  } else if (student.share_contact === "No") {
    flat.share_contact = false;
  }

  flattenGuardianContact("secondary_guardian", student.secondary_guardian, flat);
  flattenGuardianContact("tertiary_guardian", student.tertiary_guardian, flat);

  return flat;
}
