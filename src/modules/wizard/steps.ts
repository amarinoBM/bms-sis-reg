import type { SaveHandlerKey } from "@/modules/wizard/save-handlers";

export type WizardStepId =
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "11"
  | "12"
  | "13"
  | "14"
  | "15";

export type WizardStepDefinition = {
  /** Sequential id used in the UI and navigation (1–15). */
  id: WizardStepId;
  label: string;
  /** Backendless `{completionKey}disabled` flag prefix (legacy save-step keys). */
  completionKey: string;
  saveHandler?: SaveHandlerKey;
};

export const WIZARD_STEPS: WizardStepDefinition[] = [
  { id: "1", label: "Student info", completionKey: "1", saveHandler: "save1" },
  { id: "2", label: "Parent contact", completionKey: "1.5", saveHandler: "save1.5" },
  { id: "3", label: "Secondary guardians", completionKey: "1.6", saveHandler: "save1.6" },
  { id: "4", label: "Interests", completionKey: "2", saveHandler: "save2" },
  { id: "5", label: "Learning profile", completionKey: "3", saveHandler: "save3" },
  { id: "6", label: "Grade levels", completionKey: "4", saveHandler: "save4" },
  { id: "7", label: "Confidence", completionKey: "5", saveHandler: "save5" },
  { id: "8", label: "Prior school", completionKey: "6", saveHandler: "save6" },
  { id: "9", label: "Transcripts", completionKey: "6.1", saveHandler: "save6.1" },
  { id: "10", label: "State & vaccines", completionKey: "7", saveHandler: "save7" },
  { id: "11", label: "Technology", completionKey: "8", saveHandler: "save8" },
  { id: "12", label: "IEP / 504", completionKey: "9" },
  { id: "13", label: "Honor code", completionKey: "10" },
  { id: "14", label: "Terms of service", completionKey: "11" },
  { id: "15", label: "Submit", completionKey: "12" },
];

export const MAIN_PROGRESS_STEPS = [
  { number: 1, label: "Profile", stepIds: ["1", "2", "3"] as WizardStepId[] },
  { number: 2, label: "Interests", stepIds: ["4"] as WizardStepId[] },
  { number: 3, label: "Learning", stepIds: ["5"] as WizardStepId[] },
  { number: 4, label: "Grades", stepIds: ["6"] as WizardStepId[] },
  { number: 5, label: "Confidence", stepIds: ["7"] as WizardStepId[] },
  { number: 6, label: "School history", stepIds: ["8", "9"] as WizardStepId[] },
  { number: 7, label: "State rules", stepIds: ["10"] as WizardStepId[] },
  { number: 8, label: "Technology", stepIds: ["11"] as WizardStepId[] },
  { number: 9, label: "IEP / 504", stepIds: ["12"] as WizardStepId[] },
  { number: 10, label: "Honor code", stepIds: ["13"] as WizardStepId[] },
  { number: 11, label: "Terms", stepIds: ["14"] as WizardStepId[] },
  { number: 12, label: "Submit", stepIds: ["15"] as WizardStepId[] },
];

export const INITIAL_ACTIVE_STEP: WizardStepId = "1";

export function getWizardStep(stepId: WizardStepId): WizardStepDefinition | undefined {
  return WIZARD_STEPS.find((step) => step.id === stepId);
}

export function getWizardStepLabel(stepId: WizardStepId): string {
  return getWizardStep(stepId)?.label ?? stepId;
}

export function getWizardStepCompletionKey(stepId: WizardStepId): string {
  return getWizardStep(stepId)?.completionKey ?? stepId;
}

export function getWizardStepDisabledKey(stepId: WizardStepId): string {
  return `${getWizardStepCompletionKey(stepId)}disabled`;
}

export function wizardStepIdFromCompletionKey(completionKey: string): WizardStepId | undefined {
  return WIZARD_STEPS.find((step) => step.completionKey === completionKey)?.id;
}

export function getNextStepId(stepId: WizardStepId): WizardStepId | null {
  const index = WIZARD_STEPS.findIndex((step) => step.id === stepId);
  if (index < 0 || index >= WIZARD_STEPS.length - 1) {
    return null;
  }

  return WIZARD_STEPS[index + 1].id;
}
