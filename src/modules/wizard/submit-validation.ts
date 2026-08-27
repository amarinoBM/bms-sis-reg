import type { WizardStepId } from "@/modules/wizard/steps";
import {
  LEARNING_DISABILITY_FIELDS,
  LEARNING_EXPRESSION_FIELDS,
  LEARNING_PROFILE_TEXT_FIELDS,
} from "@/modules/wizard/learning-profile";
import {
  hasTranscriptDeliveryChoice,
  isFamilyTranscriptDelivery,
  readCreditTransferSubjects,
  readTranscriptFiles,
  readTransferCreditFlag,
} from "@/modules/wizard/transcript-fields";
import {
  readIepOr504Plan,
  shouldShowLastSchoolFields,
} from "@/modules/wizard/prior-school-fields";

const ETHNICITY_KEYS = [
  "African_American",
  "Asian",
  "Caucasian",
  "Latino_Hispanic",
  "Native_American",
  "Native_Hawaiian",
  "other_unknown_ethnicity",
  "prefer_not_to_say_ethnicity",
] as const;

type SubmitRequirement = {
  key: string;
  label: string;
  stepId: WizardStepId;
  isMissing: (student: Record<string, unknown>) => boolean;
};

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasCloseContactId(student: Record<string, unknown>): boolean {
  const raw = typeof student.contact_id === "string" ? student.contact_id.trim() : "";
  if (!raw) {
    return false;
  }

  const suffix = raw.startsWith("cont_") ? raw.slice(5) : raw;
  return suffix.length >= 16 && /^[A-Za-z0-9]+$/.test(suffix);
}

function hasEthnicity(student: Record<string, unknown>): boolean {
  return ETHNICITY_KEYS.some((key) => student[key] === true);
}

function hasBehaviorCoverage(student: Record<string, unknown>): boolean {
  if (student.learning_or_behavioral_challenges !== true) {
    return true;
  }

  const behaviorKeys = [
    ...LEARNING_DISABILITY_FIELDS.map((field) => field.key),
    ...LEARNING_EXPRESSION_FIELDS.map((field) => field.key),
    ...LEARNING_PROFILE_TEXT_FIELDS,
  ];

  return behaviorKeys.some((key) => {
    const value = student[key];
    if (typeof value === "boolean") {
      return value === true;
    }
    return hasText(value);
  });
}

const SUBMIT_REQUIREMENTS: SubmitRequirement[] = [
  {
    key: "contact_id",
    label: "Student enrollment link",
    stepId: "1",
    isMissing: (student) => !hasCloseContactId(student),
  },
  {
    key: "Ethnicity",
    label: "Ethnicity",
    stepId: "1",
    isMissing: (student) => !hasEthnicity(student),
  },
  {
    key: "student_name",
    label: "Student Name",
    stepId: "1",
    isMissing: (student) => !hasText(student.student_name),
  },
  {
    key: "student_last_name",
    label: "Student Last Name",
    stepId: "1",
    isMissing: (student) => !hasText(student.student_last_name),
  },
  {
    key: "student_birth_date",
    label: "Student Birth Date",
    stepId: "1",
    isMissing: (student) => typeof student.student_birth_date !== "number",
  },
  {
    key: "most_interested_in",
    label: "Student Most Interested in",
    stepId: "4",
    isMissing: (student) => !hasText(student.most_interested_in),
  },
  {
    key: "behavior",
    label: "Behavioral Challenges",
    stepId: "5",
    isMissing: (student) => !hasBehaviorCoverage(student),
  },
  {
    key: "parent_address",
    label: "Parent Address",
    stepId: "2",
    isMissing: (student) => !hasText(student.parent_address),
  },
  {
    key: "email",
    label: "Parent Email",
    stepId: "2",
    isMissing: (student) => !hasText(student.parent_email),
  },
  {
    key: "parent_phone",
    label: "Parent Phone",
    stepId: "2",
    isMissing: (student) => !hasText(student.parent_phone),
  },
  {
    key: "parent_name",
    label: "Parent Name",
    stepId: "2",
    isMissing: (student) => !hasText(student.parent_name),
  },
  {
    key: "parent_last_name",
    label: "Parent Last Name",
    stepId: "2",
    isMissing: (student) => !hasText(student.parent_last_name),
  },
  {
    key: "science_grade_level",
    label: "Science Grade Level",
    stepId: "6",
    isMissing: (student) => !hasText(student.science_grade_level),
  },
  {
    key: "ela_grade_level",
    label: "ELA Grade Level",
    stepId: "6",
    isMissing: (student) => !hasText(student.ela_grade_level),
  },
  {
    key: "math_grade_level",
    label: "Math Grade Level",
    stepId: "6",
    isMissing: (student) => !hasText(student.math_grade_level),
  },
  {
    key: "learning_environment_past_12_months",
    label: "Learning environment (past 12 months)",
    stepId: "8",
    isMissing: (student) => !hasText(student.learning_environment_past_12_months),
  },
  {
    key: "learning_experiece_past_12_months",
    label: "Learning experience (past 12 months)",
    stepId: "8",
    isMissing: (student) => !hasText(student.learning_experiece_past_12_months),
  },
  {
    key: "student_last_school_name",
    label: "Last school name",
    stepId: "8",
    isMissing: (student) =>
      shouldShowLastSchoolFields(student) && !hasText(student.student_last_school_name),
  },
  {
    key: "upload_copy_EIP_504_plan",
    label: "Upload a copy of the IEP Plan",
    stepId: "8",
    isMissing: (student) =>
      readIepOr504Plan(student.IEP_or_504_plan) === true &&
      !hasText(student.upload_copy_EIP_504_plan),
  },
  {
    key: "CreditTransfer",
    label: "Credit transfer subjects",
    stepId: "9",
    isMissing: (student) =>
      readTransferCreditFlag(student.transferCredit) &&
      readCreditTransferSubjects(student.CreditTransfer).length === 0,
  },
  {
    key: "transcriptFiles",
    label: "Transcript upload",
    stepId: "9",
    isMissing: (student) =>
      isFamilyTranscriptDelivery(student.uploadTranscript) &&
      readTranscriptFiles(student.transcriptFiles).length === 0,
  },
  {
    key: "home_state",
    label: "Home State",
    stepId: "10",
    isMissing: (student) => !hasText(student.home_state),
  },
  {
    key: "honorCodeSigned",
    label: "Sign the Honor Code",
    stepId: "13",
    isMissing: (student) => student.honorCodeSigned !== "Completed",
  },
  {
    key: "ToSBool",
    label: "Sign the Terms of Service",
    stepId: "14",
    isMissing: (student) => student.ToSBool !== true,
  },
  {
    key: "uploadTranscript",
    label: "Transcript delivery preference",
    stepId: "9",
    isMissing: (student) => !hasTranscriptDeliveryChoice(student.uploadTranscript),
  },
];

export type SubmitValidationResult = {
  ready: boolean;
  missingLabels: string[];
  missingKeys: string[];
  missingItems: SubmitMissingItem[];
};

export type SubmitMissingItem = {
  key: string;
  label: string;
  stepId: WizardStepId;
};

export function validateSubmitReadiness(
  student: Record<string, unknown>,
): SubmitValidationResult {
  const missing = SUBMIT_REQUIREMENTS.filter((rule) => rule.isMissing(student));

  return {
    ready: missing.length === 0,
    missingLabels: missing.map((rule) => rule.label),
    missingKeys: missing.map((rule) => rule.key),
    missingItems: missing.map((rule) => ({
      key: rule.key,
      label: rule.label,
      stepId: rule.stepId,
    })),
  };
}

export function formatMissingFieldsMessage(missingLabels: string[]): string {
  if (missingLabels.length === 0) {
    return "";
  }

  return `Complete these items before submitting: ${missingLabels.join(", ")}`;
}
