import type { WizardStepId } from "@/modules/wizard/steps";
import { readIepFiles, readStudentTranscriptFiles } from "@/modules/uploads/document-files";
import {
  hasText,
  isConfidenceRating,
  isValidEmail,
  isValidPhone,
} from "@/lib/field-validation";
import { CONFIDENCE_FIELD_DEFINITIONS } from "@/modules/wizard/confidence-scale";
import { readGenderSelection, GENDER_OTHER_LABEL, readEthnicitySelection } from "@/modules/wizard/field-options";
import {
  guardianContactHasValues,
  guardianFlatKey,
  GUARDIAN_CONTACT_FIELD_KEYS,
  readGuardianContact,
  type GuardianContactPrefix,
} from "@/modules/wizard/guardian-contact";
import {
  readLearningOrBehavioralChallenges,
} from "@/modules/wizard/learning-profile";
import {
  readIepOr504Plan,
  shouldShowLastSchoolFields,
} from "@/modules/wizard/prior-school-fields";
import {
  hasBehaviorCoverage,
} from "@/modules/wizard/submit-validation";
import {
  hasTranscriptDeliveryChoice,
  isFamilyTranscriptDelivery,
  readCreditTransferSubjects,
  readTransferCreditFlag,
} from "@/modules/wizard/transcript-fields";

export type StepFieldErrors = Record<string, string>;

export type StepValidationResult = {
  valid: boolean;
  fieldErrors: StepFieldErrors;
  summary: string | null;
};

function requiredFieldError(label: string): string {
  return `${label} is required.`;
}

function setError(
  errors: StepFieldErrors,
  key: string,
  message: string,
): void {
  if (!errors[key]) {
    errors[key] = message;
  }
}

function validateGuardianContact(
  errors: StepFieldErrors,
  prefix: GuardianContactPrefix,
  values: Record<string, unknown>,
): void {
  const guardian = readGuardianContact(prefix, values);
  if (!guardianContactHasValues(guardian)) {
    return;
  }

  for (const fieldKey of GUARDIAN_CONTACT_FIELD_KEYS) {
    const flatKey = guardianFlatKey(prefix, fieldKey);
    const value = guardian[fieldKey] ?? "";
    const label =
      fieldKey === "parent_relation"
        ? "Relationship"
        : fieldKey.replace(/_/g, " ");

    if (!hasText(value)) {
      setError(errors, flatKey, requiredFieldError(label));
      continue;
    }

    if (fieldKey === "parent_email" && !isValidEmail(value)) {
      setError(errors, flatKey, "Enter a valid email address.");
    }

    if (fieldKey === "parent_phone" && !isValidPhone(value)) {
      setError(errors, flatKey, "Enter a phone number with at least 10 digits.");
    }
  }
}

function validateStep1(values: Record<string, unknown>): StepFieldErrors {
  const errors: StepFieldErrors = {};

  if (!hasText(values.student_name)) {
    setError(errors, "student_name", requiredFieldError("Student first name"));
  }
  if (!hasText(values.student_last_name)) {
    setError(errors, "student_last_name", requiredFieldError("Last name"));
  }
  if (typeof values.student_birth_date !== "number") {
    setError(errors, "student_birth_date", requiredFieldError("Birth date"));
  }
  if (!hasText(readGenderSelection(values))) {
    setError(errors, "gender_selection", requiredFieldError("Gender"));
  }
  if (readGenderSelection(values) === GENDER_OTHER_LABEL && !hasText(values.other_gender)) {
    setError(errors, "other_gender", requiredFieldError("Other gender"));
  }
  if (!hasText(readEthnicitySelection(values))) {
    setError(errors, "ethnicity_selection", requiredFieldError("Ethnicity"));
  }

  return errors;
}

function validateStep2(values: Record<string, unknown>): StepFieldErrors {
  const errors: StepFieldErrors = {};

  if (!hasText(values.parent_name)) {
    setError(errors, "parent_name", requiredFieldError("Parent first name"));
  }
  if (!hasText(values.parent_last_name)) {
    setError(errors, "parent_last_name", requiredFieldError("Parent last name"));
  }
  if (!hasText(values.parent_email)) {
    setError(errors, "parent_email", requiredFieldError("Email"));
  } else if (!isValidEmail(String(values.parent_email))) {
    setError(errors, "parent_email", "Enter a valid email address.");
  }
  if (!hasText(values.parent_phone)) {
    setError(errors, "parent_phone", requiredFieldError("Phone"));
  } else if (!isValidPhone(String(values.parent_phone))) {
    setError(errors, "parent_phone", "Enter a phone number with at least 10 digits.");
  }
  if (!hasText(values.parent_address)) {
    setError(errors, "parent_address", requiredFieldError("Address"));
  }
  if (!hasText(values.parent_relation)) {
    setError(errors, "parent_relation", requiredFieldError("Relationship to student"));
  }

  return errors;
}

function validateStep3(values: Record<string, unknown>): StepFieldErrors {
  const errors: StepFieldErrors = {};
  validateGuardianContact(errors, "secondary_guardian", values);
  validateGuardianContact(errors, "tertiary_guardian", values);
  return errors;
}

function validateStep4(values: Record<string, unknown>): StepFieldErrors {
  const errors: StepFieldErrors = {};

  if (!hasText(values.most_interested_in)) {
    setError(errors, "most_interested_in", requiredFieldError("What your child is most interested in"));
  }

  return errors;
}

function validateStep5(values: Record<string, unknown>): StepFieldErrors {
  const errors: StepFieldErrors = {};
  const gate = readLearningOrBehavioralChallenges(values.learning_or_behavioral_challenges);

  if (gate === null) {
    setError(
      errors,
      "learning_or_behavioral_challenges",
      "Choose Yes or No before saving.",
    );
    return errors;
  }

  if (gate === true && !hasBehaviorCoverage(values)) {
    setError(
      errors,
      "learning_profile_details",
      "Select at least one diagnosis, behavior, or describe the challenge in Other.",
    );
  }

  return errors;
}

function validateStep6(values: Record<string, unknown>): StepFieldErrors {
  const errors: StepFieldErrors = {};

  if (!hasText(values.math_grade_level)) {
    setError(errors, "math_grade_level", requiredFieldError("Math grade level"));
  }
  if (!hasText(values.ela_grade_level)) {
    setError(errors, "ela_grade_level", requiredFieldError("ELA grade level"));
  }
  if (!hasText(values.science_grade_level)) {
    setError(errors, "science_grade_level", requiredFieldError("Science grade level"));
  }

  return errors;
}

function validateStep7(values: Record<string, unknown>): StepFieldErrors {
  const errors: StepFieldErrors = {};

  for (const field of CONFIDENCE_FIELD_DEFINITIONS) {
    if (!isConfidenceRating(values[field.key])) {
      setError(errors, field.key, `Rate ${field.label.toLowerCase()} from 1 to 5.`);
    }
  }

  return errors;
}

function validateStep8(values: Record<string, unknown>): StepFieldErrors {
  const errors: StepFieldErrors = {};

  if (!hasText(values.learning_environment_past_12_months)) {
    setError(
      errors,
      "learning_environment_past_12_months",
      requiredFieldError("Learning environment"),
    );
  }
  if (!hasText(values.learning_experiece_past_12_months)) {
    setError(
      errors,
      "learning_experiece_past_12_months",
      requiredFieldError("Past learning experience"),
    );
  }

  if (shouldShowLastSchoolFields(values)) {
    if (!hasText(values.student_last_school_name)) {
      setError(errors, "student_last_school_name", requiredFieldError("Last school name"));
    }
    if (!hasText(values.student_last_school_address)) {
      setError(
        errors,
        "student_last_school_address",
        requiredFieldError("Last school address"),
      );
    }
  }

  const hasIep = readIepOr504Plan(values.IEP_or_504_plan);
  if (hasIep === true && readIepFiles(values).length === 0) {
    setError(errors, "upload_copy_EIP_504_plan", "Upload a copy of the IEP or 504 plan.");
  }

  return errors;
}

function validateStep9(values: Record<string, unknown>): StepFieldErrors {
  const errors: StepFieldErrors = {};

  if (!hasTranscriptDeliveryChoice(values.uploadTranscript)) {
    setError(
      errors,
      "uploadTranscript",
      "Choose how transcripts will be delivered.",
    );
  }

  if (readTransferCreditFlag(values.transferCredit)) {
    if (readCreditTransferSubjects(values.CreditTransfer).length === 0) {
      setError(errors, "CreditTransfer", "Select at least one subject for credit transfer.");
    }
  }

  if (isFamilyTranscriptDelivery(values.uploadTranscript)) {
    if (readStudentTranscriptFiles(values).length === 0) {
      setError(errors, "transcriptFiles", "Upload a transcript file.");
    }
  }

  return errors;
}

function validateStep10(values: Record<string, unknown>): StepFieldErrors {
  const errors: StepFieldErrors = {};

  if (!hasText(values.home_state)) {
    setError(errors, "home_state", requiredFieldError("Home state"));
  }

  return errors;
}

function validateStep11(values: Record<string, unknown>): StepFieldErrors {
  const errors: StepFieldErrors = {};

  if (!hasText(values.computer_system)) {
    setError(errors, "computer_system", requiredFieldError("Computer system"));
  }
  if (
    typeof values.starting_date !== "number" ||
    !Number.isFinite(values.starting_date)
  ) {
    setError(errors, "starting_date", requiredFieldError("Starting date"));
  }
  if (!hasText(values.length_of_staying)) {
    setError(errors, "length_of_staying", requiredFieldError("Planned length of stay"));
  }

  return errors;
}

const STEP_VALIDATORS: Partial<
  Record<WizardStepId, (values: Record<string, unknown>) => StepFieldErrors>
> = {
  "1": validateStep1,
  "2": validateStep2,
  "3": validateStep3,
  "4": validateStep4,
  "5": validateStep5,
  "6": validateStep6,
  "7": validateStep7,
  "8": validateStep8,
  "9": validateStep9,
  "10": validateStep10,
  "11": validateStep11,
};

export function validateStepForSave(
  stepId: WizardStepId,
  values: Record<string, unknown>,
): StepValidationResult {
  const validator = STEP_VALIDATORS[stepId];
  if (!validator) {
    return { valid: true, fieldErrors: {}, summary: null };
  }

  const fieldErrors = validator(values);
  const valid = Object.keys(fieldErrors).length === 0;

  return {
    valid,
    fieldErrors,
    summary: valid
      ? null
      : "Fix the highlighted fields before saving this section.",
  };
}

export function firstFieldErrorMessage(fieldErrors: StepFieldErrors): string | null {
  const firstKey = Object.keys(fieldErrors)[0];
  return firstKey ? fieldErrors[firstKey] : null;
}
