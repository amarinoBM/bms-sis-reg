export type StateRegRecord = {
  State_Name: string;
  Abbreviation?: string;
  Affidavit?: boolean;
  Notice_of_Intent?: boolean;
  Register_with_the_DoE?: boolean;
  Individualized_Home_Instruction_Plan?: boolean;
  Annual_Evaluation?: boolean;
  Maintain_a_portfolio?: boolean;
  Notice_of_termination?: boolean;
  State_certified_teacher?: boolean;
  Quarterly_Reports?: boolean;
  Minimum_number_of_hours?: string | null;
  Comments?: string | null;
  Subject_Requirements?: string | null;
  url?: string | null;
  enrollment_type?: string | null;
  Difficulty?: string | null;
};

export type StateRegDto = {
  stateName: string;
  abbreviation?: string;
  enrollmentType?: string | null;
  difficulty?: string | null;
  minimumHours?: string | null;
  comments?: string | null;
  subjectRequirements?: string | null;
  url?: string | null;
  requirements: StateRequirementItem[];
  requirementDisplays: StateRequirementDisplay[];
  showRequirementsPanel: boolean;
  showAnnualEvaluationNote: boolean;
};

export type StateRequirementItem = {
  label: string;
  detail?: string;
};

export type StateRequirementDisplay = {
  primaryLine: string;
  linkUrl?: string;
  linkLabel?: string;
};
