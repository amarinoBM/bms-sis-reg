"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import type { WizardStepId } from "@/modules/wizard/steps";
import {
  WIZARD_STEPS,
  getNextStepId,
  getPreviousStepId,
} from "@/modules/wizard/steps";
import { isStepComplete } from "@/modules/wizard/progress";
import { Button } from "@/components/ui/button";
import { REG_TOUCH_CLASS } from "@/lib/reg-ui";
import { cn } from "@/lib/utils";

type StepNavProps = {
  activeStepId: WizardStepId;
  stepCompletion: Record<string, boolean>;
  onStepSelect: (stepId: WizardStepId) => void;
  className?: string;
};

export function StepNav({
  activeStepId,
  stepCompletion,
  onStepSelect,
  className,
}: StepNavProps) {
  const activeStep = WIZARD_STEPS.find((step) => step.id === activeStepId);
  const activeIndex = WIZARD_STEPS.findIndex((step) => step.id === activeStepId);
  const completedCount = WIZARD_STEPS.filter((step) =>
    isStepComplete(step.id, stepCompletion),
  ).length;
  const previousStepId = getPreviousStepId(activeStepId);
  const nextStepId = getNextStepId(activeStepId);
  const activeComplete = activeStep ? isStepComplete(activeStep.id, stepCompletion) : false;

  return (
    <div
      className={cn(
        "min-w-0 rounded-lg border border-border bg-card p-4",
        className,
      )}
      aria-label="Registration navigation"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-label font-medium text-muted-foreground">
          Registration progress
        </p>
        <p className="text-label text-muted-foreground">
          {completedCount} of {WIZARD_STEPS.length} sections complete
        </p>
      </div>

      <ol
        className="mt-3 flex min-w-0 gap-0.5"
        aria-label="Section completion"
      >
        {WIZARD_STEPS.map((step, index) => {
          const saved = isStepComplete(step.id, stepCompletion);
          const isCurrent = step.id === activeStepId;

          return (
            <li
              key={step.id}
              className={cn(
                "h-2 min-w-0 flex-1 rounded-sm first:rounded-l-full last:rounded-r-full",
                isCurrent && "bg-primary ring-2 ring-primary/30 ring-offset-1 ring-offset-card",
                !isCurrent && saved && "bg-primary/35",
                !isCurrent && !saved && "bg-muted",
              )}
              title={`Section ${index + 1}: ${step.label}${saved ? " · complete" : ""}${isCurrent ? " · current" : ""}`}
            />
          );
        })}
      </ol>
      <p className="mt-2 text-label text-muted-foreground">
        Orange marks this section. Light orange marks completed sections.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-body font-semibold text-foreground">
            Section {activeIndex + 1} of {WIZARD_STEPS.length}
            {activeStep ? ` · ${activeStep.label}` : ""}
          </p>
          <p className="mt-1 text-label text-muted-foreground">
            {activeComplete ? "Section complete" : "Section not complete yet"}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="outline"
            className={cn(REG_TOUCH_CLASS, "min-w-[7.5rem]")}
            disabled={!previousStepId}
            onClick={() => previousStepId && onStepSelect(previousStepId)}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            className={cn(REG_TOUCH_CLASS, "min-w-[7.5rem]")}
            disabled={!nextStepId}
            onClick={() => nextStepId && onStepSelect(nextStepId)}
          >
            Next
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
