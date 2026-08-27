/** Learning profile fields — keys match ms_student_dir columns saved via save3. */

export type LearningProfileField = {
  key: string;
  label: string;
};

export function learningChallengesGateLabel(studentName: string): string {
  return `Does ${studentName} have any learning or behavioral challenges?`;
}

export function disabilitySelectionPrompt(studentName: string): string {
  return `Please choose any challenges ${studentName} is experiencing that may affect ${studentName}'s learning or behavioral challenges?`;
}

export const EXPRESSION_SECTION_PROMPT =
  "Please check any challenges, behaviors or emotions your student frequently expresses due to their disability:";

export function additionalBehavioralInfoLabel(studentName: string): string {
  return `${studentName}'s (learning and/or behavioral) challenges, such as past experiences/events or personal advice to your teacher to avoid any triggers?`;
}

export const LEARNING_DISABILITY_FIELDS: LearningProfileField[] = [
  { key: "Dyslexia", label: "Dyslexia" },
  { key: "Dysgraphia", label: "Dysgraphia" },
  { key: "Dyscalculia", label: "Dyscalculia" },
  { key: "ADHD", label: "ADHD" },
  { key: "auditory_processing_disorder", label: "Auditory processing disorder" },
  { key: "language_processing_disorder", label: "Language processing disorder" },
  { key: "nonverbal_learning_disorder", label: "Nonverbal learning disorder" },
  {
    key: "visual_perceptual_or_visual_motor_defecit",
    label: "Visual perceptual/visual motor deficit",
  },
  { key: "austism_spectrum_discorder", label: "Autism spectrum disorder" },
  { key: "asperger", label: "Asperger’s" },
  { key: "anxiety", label: "Anxiety" },
  { key: "depression", label: "Depression" },
  { key: "behavioral_issues", label: "Behavioral issues" },
];

export const LEARNING_EXPRESSION_FIELDS: LearningProfileField[] = [
  { key: "inattention_poor_focus", label: "Inattention/poor focus" },
  { key: "impulsivity_hyperactivity", label: "Impulsivity/hyperactivity" },
  { key: "disorganization", label: "Disorganization" },
  { key: "frustration_overwhelm", label: "Frustration/overwhelm" },
  {
    key: "mood_swings_emotional_disregulation",
    label: "Mood swings/emotional disregulation",
  },
  { key: "anxiety_fear", label: "Anxiety/fear" },
  { key: "social_withdrawal_shyness", label: "Social withdrawal/shyness" },
  { key: "emotional_outbursts", label: "Emotional outbursts" },
  { key: "difficulty_transitioning", label: "Difficulty transitioning" },
  { key: "defiance", label: "Defiance" },
  { key: "low_perseverance", label: "Low perseverance" },
  { key: "forgetfulness", label: "Forgetfulness" },
  { key: "perfectionism", label: "Perfectionism" },
];

export const LEARNING_PROFILE_TEXT_FIELDS = [
  "other_behavioral_challenges",
  "additional_info_behavioral_challenges",
] as const;

export const LEARNING_PROFILE_SAVE3_KEYS = [
  "learning_or_behavioral_challenges",
  ...LEARNING_PROFILE_TEXT_FIELDS,
  ...LEARNING_DISABILITY_FIELDS.map((field) => field.key),
  ...LEARNING_EXPRESSION_FIELDS.map((field) => field.key),
] as const;

export function isLearningProfileCheckboxKey(key: string): boolean {
  return (
    LEARNING_DISABILITY_FIELDS.some((field) => field.key === key) ||
    LEARNING_EXPRESSION_FIELDS.some((field) => field.key === key)
  );
}

export function readLearningOrBehavioralChallenges(
  value: unknown,
): boolean | null {
  if (value === true) {
    return true;
  }
  if (value === false) {
    return false;
  }
  return null;
}
