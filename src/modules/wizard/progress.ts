import type { WizardStepId } from "@/modules/wizard/steps";
import { MAIN_PROGRESS_STEPS } from "@/modules/wizard/steps";

export type StepCompletionMap = Record<string, boolean>;

export type ProgressStepState = "complete" | "current" | "upcoming" | "locked";

export type MainProgressStepStatus = {
  number: number;
  label: string;
  state: ProgressStepState;
};

function disabledKeyForStep(stepId: WizardStepId): string {
  return `${stepId}disabled`;
}

export function buildStepCompletionMap(
  student: Record<string, unknown>,
): StepCompletionMap {
  const completion: StepCompletionMap = {};

  for (const key of Object.keys(student)) {
    if (key.endsWith("disabled") && student[key] === true) {
      const stepId = key.replace(/disabled$/, "");
      completion[stepId] = true;
    }
  }

  if (student.honorCodeSigned === "Completed" || student.honorCodeSigned === true) {
    completion["10"] = true;
  }

  if (student.ToSBool === true) {
    completion["11"] = true;
  }

  if (student.is_complete_sis === true) {
    completion["12"] = true;
  }

  return completion;
}

export function isStepComplete(
  stepId: WizardStepId,
  completion: StepCompletionMap,
): boolean {
  return completion[stepId] === true;
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
    const allComplete = step.stepIds.every((id) => isStepComplete(id, completion));

    if (allComplete) {
      return { number: step.number, label: step.label, state: "complete" as const };
    }

    if (step.number === activeNumber) {
      return { number: step.number, label: step.label, state: "current" as const };
    }

    if (step.number < activeNumber) {
      return { number: step.number, label: step.label, state: "complete" as const };
    }

    return { number: step.number, label: step.label, state: "upcoming" as const };
  });
}

export function isStepDisabled(
  stepId: WizardStepId,
  student: Record<string, unknown>,
): boolean {
  return student[disabledKeyForStep(stepId)] === true;
}
