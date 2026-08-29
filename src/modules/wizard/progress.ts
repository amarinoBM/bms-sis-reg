import type { WizardStepId } from "@/modules/wizard/steps";
import {
  MAIN_PROGRESS_STEPS,
  WIZARD_STEPS,
  getWizardStep,
  getWizardStepDisabledKey,
  wizardStepIdFromCompletionKey,
} from "@/modules/wizard/steps";
import { hasRecordedSectionCompletion } from "@/modules/wizard/section-completion";

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
  // A successful submission is authoritative. Legacy registrations may have
  // complete answers without the per-section `disabled` flags used by the new
  // form, so never show a submitted registration as partially complete.
  if (student.is_complete_sis === true) {
    return Object.fromEntries(WIZARD_STEPS.map((step) => [step.id, true]));
  }

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

  for (const step of WIZARD_STEPS) {
    if (step.saveHandler && hasRecordedSectionCompletion(student, step.saveHandler)) {
      completion[step.id] = true;
    }
  }

  if (student.honorCodeSigned === "Completed" || student.honorCodeSigned === true) {
    completion["12"] = true;
  }

  if (student.ToSBool === true) {
    completion["13"] = true;
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
  if (student[getWizardStepDisabledKey(stepId)] === true) {
    return true;
  }

  const saveHandler = getWizardStep(stepId)?.saveHandler;
  return saveHandler ? hasRecordedSectionCompletion(student, saveHandler) : false;
}
