import type { WizardStepId } from "@/modules/wizard/steps";
import type { SaveHandlerKey } from "@/modules/wizard/save-handlers";
import {
  COMPUTER_SYSTEM_OPTIONS,
  ETHNICITY_OPTIONS,
  GENDER_OPTIONS,
  LENGTH_OF_STAYING_OPTIONS,
  PARENT_RELATION_OPTIONS,
} from "@/modules/wizard/field-options";
import { enrichFlatFormValues } from "@/modules/wizard/field-normalization";
import { collectGuardianContactsFromFlat } from "@/modules/wizard/guardian-contact";
import { PTO_COPY, SHARE_CONTACT_COPY } from "@/modules/wizard/parent-guardian-copy";
import { priorSchoolStepDescription } from "@/modules/wizard/prior-school-fields";
import { technologySchedulingStepDescription } from "@/modules/wizard/technology-scheduling-copy";

export type StepFieldType =
  | "text"
  | "email"
  | "phone"
  | "date"
  | "textarea"
  | "checkbox"
  | "select"
  | "multiselect"
  | "number"
  | "file";

export type StepFieldDefinition = {
  key: string;
  label: string;
  type: StepFieldType;
  options?: string[];
  placeholder?: string;
  uploadType?: "birth_cert" | "student_pic" | "learning" | "transcript" | "iep";
  /** Groups consecutive checkboxes under one fieldset legend. */
  group?: string;
  /** Shown under the fieldset legend (set on the first field in the group). */
  groupDescription?: string;
};

export type StepFormDefinition = {
  stepId: WizardStepId;
  saveHandler?: SaveHandlerKey;
  title: string;
  description: (studentName: string) => string;
  fields: StepFieldDefinition[];
};

const GRADE_OPTIONS = [
  "Kindergarten",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
  "NA",
  "Graduating",
];

export const STEP_FORM_DEFINITIONS: StepFormDefinition[] = [
  {
    stepId: "1",
    saveHandler: "save1",
    title: "General information",
    description: (name) => `Help us get to know ${name}.`,
    fields: [
      { key: "student_name", label: "Student first name", type: "text" },
      { key: "student_nick_name", label: "Nickname", type: "text" },
      { key: "student_last_name", label: "Last name", type: "text" },
      { key: "student_birth_date", label: "Birth date", type: "date" },
      { key: "gender_selection", label: "Gender", type: "select", options: [...GENDER_OPTIONS] },
      { key: "other_gender", label: "Other gender", type: "text" },
      {
        key: "ethnicity_selection",
        label: "Ethnicity",
        type: "select",
        options: [...ETHNICITY_OPTIONS],
      },
      { key: "studentBirthCert", label: "Birth certificate", type: "file", uploadType: "birth_cert" },
      { key: "studentPic", label: "Student photo", type: "file", uploadType: "student_pic" },
    ],
  },
  {
    stepId: "2",
    saveHandler: "save1.5",
    title: "Parent contact",
    description: (name) =>
      `Who should we contact about ${name}? This is usually a parent or guardian.`,
    fields: [
      { key: "parent_name", label: "Parent first name", type: "text" },
      { key: "parent_last_name", label: "Parent last name", type: "text" },
      { key: "parent_email", label: "Email", type: "email" },
      { key: "parent_phone", label: "Phone", type: "phone" },
      { key: "parent_address", label: "Address", type: "textarea" },
      {
        key: "parent_relation",
        label: "Relationship to student",
        type: "select",
        options: [...PARENT_RELATION_OPTIONS],
      },
      {
        key: "share_contact",
        label: SHARE_CONTACT_COPY.label,
        type: "checkbox",
      },
    ],
  },
  {
    stepId: "3",
    saveHandler: "save1.6",
    title: "Secondary guardians",
    description: (name) =>
      `Add any additional guardians for ${name}. You can include up to two.`,
    fields: [
      { key: "PTO", label: PTO_COPY.label, type: "checkbox" },
    ],
  },
  {
    stepId: "4",
    saveHandler: "save2",
    title: "The most important question of all",
    description: (name) => `What is ${name} most interested in?`,
    fields: [],
  },
  {
    stepId: "5",
    saveHandler: "save3",
    title: "Learning profile",
    description: (name) => `Does ${name} have any learning or behavioral challenges?`,
    fields: [],
  },
  {
    stepId: "6",
    saveHandler: "save4",
    title: "Grade levels",
    description: (name) => `Where is ${name} working in each subject?`,
    fields: [
      { key: "math_grade_level", label: "Math", type: "select", options: GRADE_OPTIONS },
      { key: "ela_grade_level", label: "English language arts (ELA)", type: "select", options: GRADE_OPTIONS },
      { key: "science_grade_level", label: "Science", type: "select", options: GRADE_OPTIONS },
    ],
  },
  {
    stepId: "7",
    saveHandler: "save5",
    title: "Confidence",
    description: (name) => `How confident is ${name} in each area below?`,
    fields: [],
  },
  {
    stepId: "8",
    saveHandler: "save6",
    title: "Prior school",
    description: priorSchoolStepDescription,
    fields: [],
  },
  {
    stepId: "9",
    saveHandler: "save6.1",
    title: "Previous Learning Information",
    description: (name) =>
      `Please share any records or transcripts from ${name}'s prior school(s).`,
    fields: [],
  },
  {
    stepId: "10",
    saveHandler: "save7",
    title: "Home state",
    description: () =>
      "Private school students from a state other than Florida need to submit a letter each year to their local school district.",
    fields: [],
  },
  {
    stepId: "11",
    saveHandler: "save8",
    title: "Technology & scheduling",
    description: technologySchedulingStepDescription,
    fields: [
      {
        key: "computer_system",
        label: "Computer system",
        type: "select",
        options: [...COMPUTER_SYSTEM_OPTIONS],
      },
      { key: "starting_date", label: "Starting date", type: "date" },
      {
        key: "length_of_staying",
        label: "Planned length of stay",
        type: "select",
        options: [...LENGTH_OF_STAYING_OPTIONS],
      },
    ],
  },
];

export function getStepFormDefinition(stepId: WizardStepId): StepFormDefinition | undefined {
  return STEP_FORM_DEFINITIONS.find((step) => step.stepId === stepId);
}

export function flattenFormValues(
  student: Record<string, unknown>,
): Record<string, unknown> {
  return enrichFlatFormValues(student);
}

export function unflattenFormValues(values: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const guardians = collectGuardianContactsFromFlat(values);

  for (const [key, value] of Object.entries(values)) {
    if (
      key.startsWith("secondary_guardian.") ||
      key.startsWith("tertiary_guardian.")
    ) {
      continue;
    }
    result[key] = value;
  }

  if (guardians.secondary_guardian) {
    result.secondary_guardian = guardians.secondary_guardian;
  }

  if (guardians.tertiary_guardian) {
    result.tertiary_guardian = guardians.tertiary_guardian;
  } else if (
    Object.keys(values).some((key) => key.startsWith("tertiary_guardian."))
  ) {
    result.tertiary_guardian = null;
  }

  return result;
}
