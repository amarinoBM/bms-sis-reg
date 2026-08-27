/** Transcript step — keys match ms_student_dir columns saved via save6.1. */

export const TRANSCRIPT_DELIVERY_UPLOAD =
  "I can upload them" as const;

export const TRANSCRIPT_DELIVERY_SCHOOL =
  "I prefer you source them from the school ($50 processing fee)" as const;

export const TRANSCRIPT_DELIVERY_OPTIONS = [
  TRANSCRIPT_DELIVERY_UPLOAD,
  TRANSCRIPT_DELIVERY_SCHOOL,
] as const;

export type TranscriptDeliveryOption = (typeof TRANSCRIPT_DELIVERY_OPTIONS)[number];

/** Parent-facing labels — `value` must stay the legacy Clever strings saved to `uploadTranscript`. */
export const TRANSCRIPT_DELIVERY_CHOICES: ReadonlyArray<{
  value: TranscriptDeliveryOption;
  label: string;
  description: string;
}> = [
  {
    value: TRANSCRIPT_DELIVERY_UPLOAD,
    label: "I'll upload records myself",
    description:
      "You already have transcripts, report cards, or grade reports and can upload them here.",
  },
  {
    value: TRANSCRIPT_DELIVERY_SCHOOL,
    label: "Ask BMS to request records from the school",
    description:
      "$50 fee — we contact the prior school and collect official records for you. No upload needed.",
  },
];

export function transcriptDeliveryQuestionLabel(): string {
  return "How should we get prior school records?";
}

export function transcriptStepIntro(studentName: string): string {
  return `We need records from ${studentName}'s prior school(s) to review coursework or placement. Choose how you'd like to provide them.`;
}

export function transcriptSchoolRequestNote(): string {
  return "We'll contact the prior school on your behalf. A $50 processing fee applies. You don't need to upload files here.";
}

export function readTranscriptFiles(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim().startsWith("http")) {
    return [value.trim()];
  }

  return [];
}

export function readCreditTransferSubjects(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(value) as unknown;
      return readCreditTransferSubjects(parsed);
    } catch {
      return [];
    }
  }

  return [];
}

export function readTranscriptDeliveryChoice(value: unknown): TranscriptDeliveryOption | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  if (value.includes("source them from the school")) {
    return TRANSCRIPT_DELIVERY_SCHOOL;
  }

  if (value.includes("I can upload them")) {
    return TRANSCRIPT_DELIVERY_UPLOAD;
  }

  if (value.startsWith("http")) {
    return TRANSCRIPT_DELIVERY_UPLOAD;
  }

  return null;
}

export function isFamilyTranscriptDelivery(value: unknown): boolean {
  return readTranscriptDeliveryChoice(value) === TRANSCRIPT_DELIVERY_UPLOAD;
}

export function hasTranscriptDeliveryChoice(value: unknown): boolean {
  return readTranscriptDeliveryChoice(value) !== null;
}

export function readTransferCreditFlag(value: unknown): boolean {
  if (value === true || value === "true") {
    return true;
  }

  return false;
}
