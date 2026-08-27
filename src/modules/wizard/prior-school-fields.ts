/** Prior school / learning environment step — keys match ms_student_dir via save6. */

export const LEARNING_ENVIRONMENT_OPTIONS = [
  "Homeschool with parent",
  "Homeschool co-op, pod, or microschool",
  "Physical private school",
  "Virtual private school",
  "Physical public/charter school",
  "Virtual public/charter school",
] as const;

export type LearningEnvironmentOption = (typeof LEARNING_ENVIRONMENT_OPTIONS)[number];

const SCHOOL_ATTENDANCE_ENVIRONMENTS = new Set<LearningEnvironmentOption>([
  "Physical private school",
  "Virtual private school",
  "Physical public/charter school",
  "Virtual public/charter school",
]);

export function priorSchoolNameLabel(studentName: string): string {
  return `What was the name of ${studentName}’s last school?`;
}

export function priorSchoolAddressLabel(studentName: string): string {
  return `What was the address of ${studentName}’s last school?`;
}

export function priorSchoolContactPersonLabel(studentName: string): string {
  return `Person to speak with from ${studentName}’s last school?`;
}

export function priorSchoolContactNumberLabel(studentName: string): string {
  return `How can we contact ${studentName}’s last school?`;
}

export function learningEnvironmentLabel(studentName: string): string {
  return `What best describes ${studentName}’s learning environment for the past 12 months?`;
}

export function learningExperienceLabel(studentName: string): string {
  return `Can you briefly describe ${studentName}’s past learning experience during the last 12 months?`;
}

export function priorSchoolStepDescription(studentName: string): string {
  return `Tell us about ${studentName}'s recent learning — where they've been, what worked, and what you'd change.`;
}

export function learningExperienceHint(studentName: string): string {
  return `For example: curriculum style, what ${studentName} enjoyed or found difficult, and where they thrived or struggled.`;
}

export function schoolLikeToSeeLabel(studentName: string): string {
  return `What would you have liked to see more or less of at ${studentName}'s previous school?`;
}

export function iepQuestionLabel(studentName: string): string {
  return `Does ${studentName} have an IEP or 504 plan?`;
}

export function learningSampleLabel(studentName: string): string {
  return `Upload a sample of ${studentName}'s current learning`;
}

export function learningSampleDescription(studentName: string): string {
  return `A recent assignment, project, or writing sample helps us see where ${studentName} is today.`;
}

export const IEP_UPLOAD_LABEL = "Upload a copy of the IEP Plan";

export function readLearningCenterBool(value: unknown): boolean | null {
  if (value === true) {
    return true;
  }
  if (value === false) {
    return false;
  }
  return null;
}

export function readIepOr504Plan(value: unknown): boolean | null {
  if (value === true) {
    return true;
  }
  if (value === false) {
    return false;
  }
  return null;
}

export function hasLastSchoolFieldValues(values: Record<string, unknown>): boolean {
  const keys = [
    "student_last_school_name",
    "student_last_school_address",
    "student_last_school_contact_person",
    "student_last_school_contact_num",
  ];

  return keys.some((key) => {
    const value = values[key];
    return typeof value === "string" && value.trim().length > 0;
  });
}

export function environmentImpliesLastSchool(
  learningEnvironment: unknown,
): boolean {
  return (
    typeof learningEnvironment === "string" &&
    SCHOOL_ATTENDANCE_ENVIRONMENTS.has(learningEnvironment as LearningEnvironmentOption)
  );
}

export function shouldShowLastSchoolFields(
  values: Record<string, unknown>,
): boolean {
  if (environmentImpliesLastSchool(values.learning_environment_past_12_months)) {
    return true;
  }

  const hadLastSchool = readLearningCenterBool(values.learningCenterBool);
  if (hadLastSchool === true) {
    return true;
  }
  if (hadLastSchool === false) {
    return false;
  }

  return hasLastSchoolFieldValues(values);
}

export function shouldAskLastSchoolAttendance(
  learningEnvironment: unknown,
): boolean {
  return (
    typeof learningEnvironment === "string" &&
    learningEnvironment.length > 0 &&
    !environmentImpliesLastSchool(learningEnvironment)
  );
}
