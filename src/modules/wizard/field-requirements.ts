import type { WizardStepId } from "@/modules/wizard/steps";
import { readGenderSelection, GENDER_OTHER_LABEL } from "@/modules/wizard/field-options";
import { CONFIDENCE_FIELD_DEFINITIONS } from "@/modules/wizard/confidence-scale";

export type FieldRequirement = "required" | "optional";

const STEP_REQUIRED_FIELDS: Partial<Record<WizardStepId, readonly string[]>> = {
  "1": [
    "student_name",
    "student_last_name",
    "student_birth_date",
    "gender_selection",
    "ethnicity_selection",
  ],
  "2": [
    "parent_name",
    "parent_last_name",
    "parent_email",
    "parent_phone",
    "parent_address",
    "parent_relation",
  ],
  "6": ["math_grade_level", "ela_grade_level", "science_grade_level"],
  "11": ["computer_system", "starting_date", "length_of_staying"],
};

const STEP_OPTIONAL_FIELDS: Partial<Record<WizardStepId, readonly string[]>> = {
  "1": ["student_nick_name", "studentBirthCert", "studentPic"],
  "2": ["share_contact"],
};

export function isStepFieldRequired(
  stepId: WizardStepId,
  fieldKey: string,
  values: Record<string, unknown>,
): boolean {
  if (stepId === "1" && fieldKey === "other_gender") {
    return readGenderSelection(values) === GENDER_OTHER_LABEL;
  }

  const required = STEP_REQUIRED_FIELDS[stepId];
  return required?.includes(fieldKey) ?? false;
}

export function isStepFieldOptional(
  stepId: WizardStepId,
  fieldKey: string,
  values: Record<string, unknown>,
): boolean {
  if (stepId === "1" && fieldKey === "other_gender") {
    return readGenderSelection(values) !== GENDER_OTHER_LABEL;
  }

  const optional = STEP_OPTIONAL_FIELDS[stepId];
  return optional?.includes(fieldKey) ?? false;
}

export function getFieldRequirement(
  stepId: WizardStepId,
  fieldKey: string,
  values: Record<string, unknown>,
): FieldRequirement | undefined {
  if (isStepFieldRequired(stepId, fieldKey, values)) {
    return "required";
  }
  if (isStepFieldOptional(stepId, fieldKey, values)) {
    return "optional";
  }
  return undefined;
}

/** Confidence ratings are required on step 7 (custom fields, not in step schema). */
export function isConfidenceFieldRequired(fieldKey: string): boolean {
  return CONFIDENCE_FIELD_DEFINITIONS.some((field) => field.key === fieldKey);
}
