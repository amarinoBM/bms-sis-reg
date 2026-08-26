export type WizardStepId =
  | "1"
  | "1.5"
  | "1.6"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "6.1"
  | "7"
  | "8"
  | "9"
  | "10"
  | "11"
  | "12";

export type WizardStepDefinition = {
  id: WizardStepId;
  label: string;
  saveHandler?: string;
};

export const WIZARD_STEPS: WizardStepDefinition[] = [
  { id: "1", label: "Student info", saveHandler: "save1" },
  { id: "1.5", label: "Parent contact", saveHandler: "save1.5" },
  { id: "1.6", label: "Secondary guardian", saveHandler: "save1.6" },
  { id: "2", label: "Interests", saveHandler: "save2" },
  { id: "3", label: "Learning profile", saveHandler: "save3" },
  { id: "4", label: "Grade levels", saveHandler: "save4" },
  { id: "5", label: "Confidence", saveHandler: "save5" },
  { id: "6", label: "Prior school", saveHandler: "save6" },
  { id: "6.1", label: "Transcripts", saveHandler: "save6.1" },
  { id: "7", label: "State & vaccines", saveHandler: "save7" },
  { id: "8", label: "Technology", saveHandler: "save8" },
  { id: "9", label: "IEP / 504", saveHandler: undefined },
  { id: "10", label: "Honor code", saveHandler: undefined },
  { id: "11", label: "Terms of service", saveHandler: undefined },
  { id: "12", label: "Submit", saveHandler: undefined },
];

export const MAIN_PROGRESS_STEPS = [
  { number: 1, label: "Profile", stepIds: ["1", "1.5", "1.6"] as WizardStepId[] },
  { number: 2, label: "Interests", stepIds: ["2"] as WizardStepId[] },
  { number: 3, label: "Learning", stepIds: ["3"] as WizardStepId[] },
  { number: 4, label: "Grades", stepIds: ["4"] as WizardStepId[] },
  { number: 5, label: "Confidence", stepIds: ["5"] as WizardStepId[] },
  { number: 6, label: "School history", stepIds: ["6", "6.1"] as WizardStepId[] },
  { number: 7, label: "State rules", stepIds: ["7"] as WizardStepId[] },
  { number: 8, label: "Technology", stepIds: ["8"] as WizardStepId[] },
  { number: 9, label: "IEP / 504", stepIds: ["9"] as WizardStepId[] },
  { number: 10, label: "Honor code", stepIds: ["10"] as WizardStepId[] },
  { number: 11, label: "Terms", stepIds: ["11"] as WizardStepId[] },
  { number: 12, label: "Submit", stepIds: ["12"] as WizardStepId[] },
];

export const INITIAL_ACTIVE_STEP: WizardStepId = "1";
