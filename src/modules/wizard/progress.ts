import type { WizardStepId } from "@/modules/wizard/steps";
import {
  MAIN_PROGRESS_STEPS,
  getWizardStepDisabledKey,
  wizardStepIdFromCompletionKey,
} from "@/modules/wizard/steps";

export type StepCompletionMap = Record<string, boolean>;

export type ProgressStepState = "complete" | "current" | "upcoming" | "locked";

export type MainProgressStepStatus = {
  number: number;
  label: string;
  state: ProgressStepState;
};

export function buildStepCompletionMap(
  student: Record<string, unknown>,
): StepCompletionMap {
  const completion: StepCompletionMap = {};

  for (const key of Object.keys(student)) {
    if (key.endsWith("disabled") && student[key] === true) {
      const completionKey = key.replace(/disabled$/, "");
      const wizardStepId = wizardStepIdFromCompletionKey(completionKey);
      if (wizardStepId) {
        completion[wizardStepId] = true;
      }
    }
  }

  if (student.honorCodeSigned === "Completed" || student.honorCodeSigned === true) {
    completion["12"] = true;
  }

  if (student.ToSBool === true) {
    completion["13"] = true;
  }

  if (student.is_complete_sis === true) {
    completion["14"] = true;
  }

  return completion;
}

export function isStepComplete(
  stepId: WizardStepId,
  completion: StepCompletionMap,
): boolean {
  return completion[stepId] === true;
}

function isMainProgressStepComplete(
  stepIds: WizardStepId[],
  completion: StepCompletionMap,
): boolean {
  return stepIds.every((stepId) => isStepComplete(stepId, completion));
}

export function getMainProgressStatuses(
  activeStepId: WizardStepId,
  completion: StepCompletionMap,
): MainProgressStepStatus[] {
  const activeMainStep = MAIN_PROGRESS_STEPS.find((step) =>
    step.stepIds.includes(activeStepId),
  );
  const activeNumber = activeMainStep?.number ?? 1;

  return MAIN_PROGRESS_STEPS.map((step) => {
    const saved = isMainProgressStepComplete(step.stepIds, completion);

    if (step.number === activeNumber) {
      return { number: step.number, label: step.label, state: "current" as const };
    }

    if (saved) {
      return { number: step.number, label: step.label, state: "complete" as const };
    }

    return { number: step.number, label: step.label, state: "upcoming" as const };
  });
}

export function isStepDisabled(
  stepId: WizardStepId,
  student: Record<string, unknown>,
): boolean {
  return student[getWizardStepDisabledKey(stepId)] === true;
}
