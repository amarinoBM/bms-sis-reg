import {
  INITIAL_ACTIVE_STEP,
  WIZARD_STEPS,
  type WizardStepId,
} from "@/modules/wizard/steps";
import { normalizeStudentName } from "@/modules/students/student-row-selection";

export type RegistrationLinkContext = {
  studentName?: string;
  stepId: WizardStepId;
};

export function isWizardStepId(value: unknown): value is WizardStepId {
  return typeof value === "string" && WIZARD_STEPS.some((step) => step.id === value);
}

export function normalizeRegistrationStudentName(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = normalizeStudentName(value);
  return normalized.length > 0 ? normalized : undefined;
}

export function parseRegistrationLinkContext(input: {
  studentName?: unknown;
  step?: unknown;
}): RegistrationLinkContext {
  return {
    studentName: normalizeRegistrationStudentName(input.studentName),
    stepId: isWizardStepId(input.step) ? input.step : INITIAL_ACTIVE_STEP,
  };
}
