import type { StepFieldDefinition } from "@/modules/wizard/step-schemas";
import { PTO_COPY, SHARE_CONTACT_COPY } from "@/modules/wizard/parent-guardian-copy";
import {
  computerSystemLabel,
  LENGTH_OF_STAYING_HINT,
  lengthOfStayingLabel,
  preferredStudentEmailLabel,
  startingDateLabel,
} from "@/modules/wizard/technology-scheduling-copy";

export type FieldLayout = "full" | "half";

export type FieldUiHints = {
  label?: string;
  placeholder?: string;
  hint?: string;
  autoComplete?: string;
  layout?: FieldLayout;
  selectPlaceholder?: string;
};

const FIELD_UI_HINTS: Record<string, FieldUiHints> = {
  student_name: {
    placeholder: "e.g. Josiah",
    autoComplete: "given-name",
    layout: "half",
  },
  student_last_name: {
    placeholder: "e.g. Marinopoulos",
    autoComplete: "family-name",
    layout: "half",
  },
  student_nick_name: {
    placeholder: "Optional — what they like to be called",
    layout: "half",
    hint: "Leave blank if they use their first name.",
  },
  student_birth_date: {
    hint: "Use the date on their birth certificate.",
    layout: "half",
  },
  gender_selection: {
    selectPlaceholder: "Select gender",
    layout: "half",
  },
  other_gender: {
    placeholder: "How they identify",
    hint: "Only if you selected Other above.",
    layout: "half",
  },
  ethnicity_selection: {
    selectPlaceholder: "Select ethnicity",
    layout: "half",
  },
  parent_name: {
    placeholder: "First name",
    autoComplete: "given-name",
    layout: "half",
  },
  parent_last_name: {
    placeholder: "Last name",
    autoComplete: "family-name",
    layout: "half",
  },
  parent_email: {
    placeholder: "you@example.com",
    autoComplete: "email",
    hint: "We use this for registration updates and login codes.",
    layout: "half",
  },
  parent_phone: {
    placeholder: "+1 555 123 4567",
    autoComplete: "tel",
    layout: "half",
  },
  parent_relation: {
    selectPlaceholder: "Select relationship",
    layout: "half",
  },
  share_contact: {
    hint: SHARE_CONTACT_COPY.hint,
  },
  parent_address: {
    placeholder: "Street, city, state, ZIP",
    hint: "Match official school records when possible.",
  },
  math_grade_level: {
    selectPlaceholder: "Select math level",
    layout: "half",
  },
  ela_grade_level: {
    selectPlaceholder: "Select ELA level",
    layout: "half",
  },
  science_grade_level: {
    selectPlaceholder: "Select science level",
    layout: "half",
  },
  student_last_school_name: {
    placeholder: "School or program name",
    layout: "half",
  },
  student_last_school_address: {
    placeholder: "City, state, or full address",
  },
  learning_environment_past_12_months: {
    selectPlaceholder: "Where did they learn most recently?",
  },
  learning_experiece_past_12_months: {
    placeholder: "Brief notes about their recent learning experience",
    hint: "A few sentences is enough.",
  },
  school_like_to_see: {
    placeholder: "Optional — anything you wished had been different",
  },
  additional_info_behavioral_challenges: {
    placeholder: "Anything else we should know to support them",
  },
  email: {
    placeholder: "student@example.com",
    autoComplete: "email",
    hint: "Used for student logins and classroom tools.",
    layout: "half",
  },
  computer_system: {
    selectPlaceholder: "Select device type",
    layout: "half",
  },
  starting_date: {
    hint: "When you plan for them to begin with us.",
    layout: "half",
  },
  length_of_staying: {
    selectPlaceholder: "Select expected duration",
    hint: LENGTH_OF_STAYING_HINT,
    layout: "half",
  },
  PTO: {
    hint: PTO_COPY.description,
  },
};

export function getFieldUiHints(
  field: StepFieldDefinition,
  context?: { studentName?: string },
): FieldUiHints {
  const defaults = FIELD_UI_HINTS[field.key] ?? {};
  const studentName = context?.studentName?.trim();

  let label = defaults.label;
  if (studentName) {
    if (field.key === "email") {
      label = preferredStudentEmailLabel(studentName);
    } else if (field.key === "computer_system") {
      label = computerSystemLabel(studentName);
    } else if (field.key === "starting_date") {
      label = startingDateLabel(studentName);
    } else if (field.key === "length_of_staying") {
      label = lengthOfStayingLabel(studentName);
    }
  }

  return {
    label,
    placeholder: field.placeholder ?? defaults.placeholder,
    hint: defaults.hint,
    autoComplete: defaults.autoComplete,
    layout: defaults.layout ?? "full",
    selectPlaceholder: defaults.selectPlaceholder,
  };
}

export function fieldLayoutClass(layout: FieldLayout | undefined): string {
  return layout === "half" ? "sm:col-span-1" : "sm:col-span-2";
}
