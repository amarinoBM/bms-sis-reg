"use client";

import type { WizardStepId } from "@/modules/wizard/steps";
import { WIZARD_STEPS } from "@/modules/wizard/steps";
import { isStepComplete } from "@/modules/wizard/progress";
import { cn } from "@/lib/utils";

type StepNavProps = {
  activeStepId: WizardStepId;
  stepCompletion: Record<string, boolean>;
  onStepSelect: (stepId: WizardStepId) => void;
};

export function StepNav({ activeStepId, stepCompletion, onStepSelect }: StepNavProps) {
  return (
    <nav className="rounded-lg border border-border bg-card p-4">
      <p className="text-label font-medium text-muted-foreground">Sections</p>
      <ul className="mt-3 space-y-1">
        {WIZARD_STEPS.map((step) => {
          const complete = isStepComplete(step.id, stepCompletion);
          const active = step.id === activeStepId;

          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => onStepSelect(step.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-body transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <span>{step.label}</span>
                {complete && (
                  <span className="text-label text-muted-foreground">Done</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
