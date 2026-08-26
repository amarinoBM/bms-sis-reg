import type { WizardStepId } from "@/modules/wizard/steps";
import type { SaveHandlerKey } from "@/modules/wizard/save-handlers";

export type StepFieldType =
  | "text"
  | "email"
  | "phone"
  | "date"
  | "textarea"
  | "checkbox"
  | "select"
  | "number"
  | "file";

export type StepFieldDefinition = {
  key: string;
  label: string;
  type: StepFieldType;
  options?: string[];
  placeholder?: string;
  uploadType?: "birth_cert" | "student_pic" | "learning" | "transcript" | "iep";
};

export type StepFormDefinition = {
  stepId: WizardStepId;
  saveHandler?: SaveHandlerKey;
  title: string;
  description: (studentName: string) => string;
  fields: StepFieldDefinition[];
};

const GRADE_OPTIONS = [
  "Grade K",
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
];

const CONFIDENCE_OPTIONS = ["1", "2", "3", "4", "5"];

const LEARNING_ENV_OPTIONS = [
  "Homeschool",
  "Virtual public/charter school",
  "Private school",
  "Public school",
  "Other",
];

export const STEP_FORM_DEFINITIONS: StepFormDefinition[] = [
  {
    stepId: "1",
    saveHandler: "save1",
    title: "General information",
    description: (name) => `Student identity and demographics for ${name}.`,
    fields: [
      { key: "student_name", label: "Student first name", type: "text" },
      { key: "student_nick_name", label: "Nickname", type: "text" },
      { key: "student_last_name", label: "Last name", type: "text" },
      { key: "student_birth_date", label: "Birth date", type: "date" },
      { key: "male", label: "Male", type: "checkbox" },
      { key: "female", label: "Female", type: "checkbox" },
      { key: "transgender", label: "Transgender", type: "checkbox" },
      { key: "gender_variant_non_conforming", label: "Gender variant / non-conforming", type: "checkbox" },
      { key: "prefer_not_to_say_gender", label: "Prefer not to say (gender)", type: "checkbox" },
      { key: "other_gender", label: "Other gender", type: "text" },
      { key: "African_American", label: "African American", type: "checkbox" },
      { key: "Asian", label: "Asian", type: "checkbox" },
      { key: "Caucasian", label: "Caucasian", type: "checkbox" },
      { key: "Latino_Hispanic", label: "Latino / Hispanic", type: "checkbox" },
      { key: "Native_American", label: "Native American", type: "checkbox" },
      { key: "Native_Hawaiian", label: "Native Hawaiian", type: "checkbox" },
      { key: "other_unknown_ethnicity", label: "Other / unknown ethnicity", type: "checkbox" },
      { key: "prefer_not_to_say_ethnicity", label: "Prefer not to say (ethnicity)", type: "checkbox" },
      { key: "studentBirthCert", label: "Birth certificate", type: "file", uploadType: "birth_cert" },
      { key: "studentPic", label: "Student photo", type: "file", uploadType: "student_pic" },
    ],
  },
  {
    stepId: "1.5",
    saveHandler: "save1.5",
    title: "Parent contact",
    description: (name) => `Primary parent or guardian contact for ${name}.`,
    fields: [
      { key: "parent_name", label: "Parent first name", type: "text" },
      { key: "parent_last_name", label: "Parent last name", type: "text" },
      { key: "parent_email", label: "Email", type: "email" },
      { key: "parent_phone", label: "Phone", type: "phone" },
      { key: "parent_address", label: "Address", type: "textarea" },
      { key: "parent_relation", label: "Relationship to student", type: "text" },
    ],
  },
  {
    stepId: "1.6",
    saveHandler: "save1.6",
    title: "Secondary guardian",
    description: (name) => `Secondary guardian and PTO preferences for ${name}.`,
    fields: [
      { key: "secondary_guardian.parent_name", label: "Guardian first name", type: "text" },
      { key: "secondary_guardian.parent_last_name", label: "Guardian last name", type: "text" },
      { key: "secondary_guardian.parent_email", label: "Guardian email", type: "email" },
      { key: "secondary_guardian.parent_phone", label: "Guardian phone", type: "phone" },
      { key: "secondary_guardian.parent_relation", label: "Relationship", type: "text" },
      { key: "PTO", label: "Interested in PTO", type: "checkbox" },
    ],
  },
  {
    stepId: "2",
    saveHandler: "save2",
    title: "Interests",
    description: (name) => `What is ${name} most interested in?`,
    fields: [
      { key: "most_interested_in", label: "Most interested in", type: "textarea" },
    ],
  },
  {
    stepId: "3",
    saveHandler: "save3",
    title: "Learning profile",
    description: (name) => `Learning and behavioral challenges for ${name}.`,
    fields: [
      { key: "learning_or_behavioral_challenges", label: "Has learning or behavioral challenges", type: "checkbox" },
      { key: "ADHD", label: "ADHD", type: "checkbox" },
      { key: "Dyslexia", label: "Dyslexia", type: "checkbox" },
      { key: "Dyscalculia", label: "Dyscalculia", type: "checkbox" },
      { key: "Dysgraphia", label: "Dysgraphia", type: "checkbox" },
      { key: "anxiety", label: "Anxiety", type: "checkbox" },
      { key: "depression", label: "Depression", type: "checkbox" },
      { key: "asperger", label: "Asperger", type: "checkbox" },
      { key: "austism_spectrum_discorder", label: "Autism spectrum disorder", type: "checkbox" },
      { key: "behavioral_issues", label: "Behavioral issues", type: "checkbox" },
      { key: "additional_info_behavioral_challenges", label: "Additional information", type: "textarea" },
    ],
  },
  {
    stepId: "4",
    saveHandler: "save4",
    title: "Grade levels",
    description: (name) => `Current grade levels for ${name}.`,
    fields: [
      { key: "math_grade_level", label: "Math", type: "select", options: GRADE_OPTIONS },
      { key: "ela_grade_level", label: "ELA", type: "select", options: GRADE_OPTIONS },
      { key: "science_grade_level", label: "Science", type: "select", options: GRADE_OPTIONS },
    ],
  },
  {
    stepId: "5",
    saveHandler: "save5",
    title: "Confidence",
    description: (name) => `Rate ${name}'s confidence in these areas (1–5).`,
    fields: [
      { key: "confidence_in_reading", label: "Reading", type: "select", options: CONFIDENCE_OPTIONS },
      { key: "confidence_in_writing", label: "Writing", type: "select", options: CONFIDENCE_OPTIONS },
      { key: "confidence_using_technology", label: "Technology", type: "select", options: CONFIDENCE_OPTIONS },
      { key: "confidence_in_collaborating", label: "Collaborating", type: "select", options: CONFIDENCE_OPTIONS },
      { key: "confidence_in_engaging_independent_work", label: "Independent work", type: "select", options: CONFIDENCE_OPTIONS },
      { key: "connecting_with_adults", label: "Connecting with adults", type: "select", options: CONFIDENCE_OPTIONS },
    ],
  },
  {
    stepId: "6",
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
    stepId: "6.1",
    saveHandler: "save6.1",
    title: "Transcripts",
    description: (name) => `Transcripts and credit transfer for ${name}.`,
    fields: [
      { key: "transferCredit", label: "Request credit transfer", type: "checkbox" },
      { key: "uploadTranscript", label: "Transcript upload", type: "file", uploadType: "transcript" },
    ],
  },
  {
    stepId: "7",
    saveHandler: "save7",
    title: "State requirements",
    description: (name) => `Home state rules and vaccines for ${name}.`,
    fields: [
      { key: "home_state", label: "Home state", type: "text" },
      { key: "determining_required_paperwork_home_state", label: "Required paperwork notes", type: "textarea" },
      { key: "vaccine_situation", label: "Vaccine situation", type: "textarea" },
      { key: "step_up_id", label: "Step Up ID", type: "text" },
      { key: "student_award_id", label: "Student award ID", type: "text" },
      { key: "submit_step_up", label: "Submit Step Up", type: "checkbox" },
    ],
  },
  {
    stepId: "8",
    saveHandler: "save8",
    title: "Technology & scheduling",
    description: (name) => `Technology and scheduling for ${name}.`,
    fields: [
      { key: "email", label: "Student email", type: "email" },
      { key: "computer_system", label: "Computer system", type: "text" },
      { key: "electives", label: "Electives", type: "textarea" },
      { key: "starting_date", label: "Starting date", type: "date" },
      { key: "length_of_staying", label: "Length of stay", type: "text" },
    ],
  },
  {
    stepId: "9",
    title: "IEP / 504 upload",
    description: (name) => `Upload IEP or 504 documents for ${name}.`,
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
  const flat: Record<string, unknown> = { ...student };

  const secondary = student.secondary_guardian;
  if (secondary && typeof secondary === "object" && !Array.isArray(secondary)) {
    for (const [key, value] of Object.entries(secondary as Record<string, unknown>)) {
      flat[`secondary_guardian.${key}`] = value;
    }
  }

  return flat;
}

export function unflattenFormValues(values: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const secondary: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(values)) {
    if (key.startsWith("secondary_guardian.")) {
      secondary[key.replace("secondary_guardian.", "")] = value;
      continue;
    }
    result[key] = value;
  }

  if (Object.keys(secondary).length > 0) {
    result.secondary_guardian = secondary;
  }

  return result;
}
