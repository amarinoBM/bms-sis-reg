export type ConfidenceScaleOption = {
  value: string;
  shortLabel: string;
  description: string;
};

export const CONFIDENCE_SCALE_OPTIONS: ConfidenceScaleOption[] = [
  { value: "1", shortLabel: "Needs support", description: "Needs a lot of support" },
  { value: "2", shortLabel: "Some support", description: "Needs some support" },
  { value: "3", shortLabel: "Somewhat", description: "Somewhat confident" },
  { value: "4", shortLabel: "Mostly", description: "Mostly confident" },
  { value: "5", shortLabel: "Very confident", description: "Very confident" },
];

export const CONFIDENCE_FIELD_DEFINITIONS = [
  { key: "confidence_in_reading", label: "Reading" },
  { key: "confidence_in_writing", label: "Writing" },
  { key: "confidence_using_technology", label: "Technology" },
  { key: "confidence_in_collaborating", label: "Collaborating" },
  { key: "confidence_in_engaging_independent_work", label: "Independent work" },
  { key: "connecting_with_adults", label: "Connecting with adults" },
] as const;
