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

const LEARNING_ENV_OPTIONS = [
  "Homeschool with parent",
  "Homeschool co-op, pod, or microschool",
  "Physical private school",
  "Virtual private school",
  "Physical public/charter school",
  "Virtual public/charter school",
];

export const STEP_FORM_DEFINITIONS: StepFormDefinition[] = [
  {
    stepId: "1",
    saveHandler: "save1",
    title: "General information",
    description: (name) =>
      `Help us get to know ${name}. Fields marked with * are required.`,
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
      { key: "share_contact", label: "Share contact with other families", type: "checkbox" },
    ],
  },
  {
    stepId: "3",
    saveHandler: "save1.6",
    title: "Secondary guardians",
    description: (name) =>
      `Add any additional guardians for ${name}. You can include up to two.`,
    fields: [
      { key: "PTO", label: "Interested in PTO", type: "checkbox" },
    ],
  },
  {
    stepId: "4",
    saveHandler: "save2",
    title: "Interests",
    description: (name) =>
      `Search and pick ${name}'s top interest, then add any other interests.`,
    fields: [],
  },
  {
    stepId: "5",
    saveHandler: "save3",
    title: "Learning profile",
    description: (name) => `Learning and behavioral challenges for ${name}.`,
    fields: [
      { key: "learning_or_behavioral_challenges", label: "Has learning or behavioral challenges", type: "checkbox" },
      { key: "ADHD", label: "ADHD", type: "checkbox", group: "Challenges" },
      { key: "Dyslexia", label: "Dyslexia", type: "checkbox", group: "Challenges" },
      { key: "Dyscalculia", label: "Dyscalculia", type: "checkbox", group: "Challenges" },
      { key: "Dysgraphia", label: "Dysgraphia", type: "checkbox", group: "Challenges" },
      { key: "anxiety", label: "Anxiety", type: "checkbox", group: "Challenges" },
      { key: "depression", label: "Depression", type: "checkbox", group: "Challenges" },
      { key: "asperger", label: "Asperger’s", type: "checkbox", group: "Challenges" },
      { key: "austism_spectrum_discorder", label: "Autism spectrum disorder", type: "checkbox", group: "Challenges" },
      { key: "behavioral_issues", label: "Behavioral issues", type: "checkbox", group: "Challenges" },
      { key: "auditory_processing_disorder", label: "Auditory processing disorder", type: "checkbox", group: "Challenges" },
      { key: "language_processing_disorder", label: "Language processing disorder", type: "checkbox", group: "Challenges" },
      { key: "nonverbal_learning_disorder", label: "Nonverbal learning disorder", type: "checkbox", group: "Challenges" },
      { key: "visual_perceptual_or_visual_motor_defecit", label: "Visual perceptual / visual motor deficit", type: "checkbox", group: "Challenges" },
      { key: "other_behavioral_challenges", label: "Other", type: "checkbox", group: "Challenges" },
      { key: "additional_info_behavioral_challenges", label: "Additional information", type: "textarea" },
    ],
  },
  {
    stepId: "6",
    saveHandler: "save4",
    title: "Grade levels",
    description: (name) => `Current grade levels for ${name}.`,
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
    description: (name) => `School history and learning environment for ${name}.`,
    fields: [
      { key: "student_last_school_name", label: "Last school name", type: "text" },
      { key: "student_last_school_address", label: "Last school address", type: "textarea" },
      { key: "learning_environment_past_12_months", label: "Learning environment (past 12 months)", type: "select", options: LEARNING_ENV_OPTIONS },
      { key: "learning_experiece_past_12_months", label: "Learning experience notes", type: "textarea" },
      { key: "school_like_to_see", label: "What would you like to see from school?", type: "textarea" },
      { key: "IEP_or_504_plan", label: "Has IEP or 504 plan", type: "checkbox" },
      { key: "upload_student_curreny_learning", label: "Learning sample upload", type: "file", uploadType: "learning" },
    ],
  },
  {
    stepId: "9",
    saveHandler: "save6.1",
    title: "Transcripts",
    description: (name) => `Transcripts and credit transfer for ${name}.`,
    fields: [
      { key: "transferCredit", label: "Request credit transfer", type: "checkbox" },
      {
        key: "CreditTransfer",
        label: "Subjects or credits to transfer",
        type: "textarea",
        placeholder: "List courses or credits you want reviewed",
      },
      { key: "uploadTranscript", label: "Transcript upload", type: "file", uploadType: "transcript" },
    ],
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
    description: (name) => `Technology and scheduling for ${name}.`,
    fields: [
      { key: "email", label: "Preferred student email address", type: "email" },
      {
        key: "computer_system",
        label: "Computer system",
        type: "select",
        options: [...COMPUTER_SYSTEM_OPTIONS],
      },
      { key: "electives", label: "Electives", type: "textarea" },
      { key: "starting_date", label: "Starting date", type: "date" },
      {
        key: "length_of_staying",
        label: "Length of stay",
        type: "select",
        options: [...LENGTH_OF_STAYING_OPTIONS],
      },
    ],
  },
  {
    stepId: "12",
    title: "IEP / 504 upload",
    description: (name) =>
      `Upload IEP or 504 documents for ${name}. Files are saved automatically when you upload.`,
    fields: [
      { key: "upload_copy_EIP_504_plan", label: "IEP / 504 document", type: "file", uploadType: "iep" },
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
