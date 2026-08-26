"use client";

import type { WizardStepId } from "@/modules/wizard/steps";
import { WIZARD_STEPS } from "@/modules/wizard/steps";
import { isStepComplete } from "@/modules/wizard/progress";
import { REG_TOUCH_CLASS } from "@/lib/reg-ui";
import { cn } from "@/lib/utils";

type StepNavProps = {
  activeStepId: WizardStepId;
  stepCompletion: Record<string, boolean>;
  onStepSelect: (stepId: WizardStepId) => void;
};

export function StepNav({ activeStepId, stepCompletion, onStepSelect }: StepNavProps) {
  return (
    <nav
      aria-label="Registration sections"
      className="rounded-lg border border-border bg-card p-4 lg:max-h-[70vh] lg:overflow-y-auto"
    >
      <p className="text-label font-medium text-muted-foreground">Sections</p>
      <ul className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
        {WIZARD_STEPS.map((step) => {
          const complete = isStepComplete(step.id, stepCompletion);
          const active = step.id === activeStepId;

          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => onStepSelect(step.id)}
                aria-current={active ? "step" : undefined}
                className={cn(
                  REG_TOUCH_CLASS,
                  "flex min-w-0 shrink-0 items-center justify-between rounded-md px-3 py-2 text-left text-body transition-colors lg:w-full",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <span className="min-w-0 break-words">{step.label}</span>
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
