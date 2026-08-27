"use client";

import type { MainProgressStepStatus } from "@/modules/wizard/progress";
import type { WizardStepId } from "@/modules/wizard/steps";
import { WIZARD_STEPS } from "@/modules/wizard/steps";
import { isStepComplete } from "@/modules/wizard/progress";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REG_TOUCH_CLASS } from "@/lib/reg-ui";
import { cn } from "@/lib/utils";

type StepNavProps = {
  activeStepId: WizardStepId;
  stepCompletion: Record<string, boolean>;
  progressSteps: MainProgressStepStatus[];
  onStepSelect: (stepId: WizardStepId) => void;
  className?: string;
};

export function StepNav({
  activeStepId,
  stepCompletion,
  progressSteps,
  onStepSelect,
  className,
}: StepNavProps) {
  const activeStep = WIZARD_STEPS.find((step) => step.id === activeStepId);
  const activeIndex = WIZARD_STEPS.findIndex((step) => step.id === activeStepId);
  const completedCount = WIZARD_STEPS.filter((step) =>
    isStepComplete(step.id, stepCompletion),
  ).length;
  const currentMainStep =
    progressSteps.find((step) => step.state === "current") ?? progressSteps[0];
  const activeComplete = activeStep
    ? isStepComplete(activeStep.id, stepCompletion)
    : false;
  const activeSectionLabel = activeStep
    ? `${activeIndex + 1}. ${activeStep.label}${activeComplete ? " · Complete" : ""}`
    : "Choose a section";

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

      {currentMainStep ? (
        <p className="mt-2 text-body font-semibold text-foreground">
          Part {currentMainStep.number} of {progressSteps.length}: {currentMainStep.label}
        </p>
      ) : null}

      {progressSteps.length > 0 ? (
        <ol className="mt-3 flex min-w-0 gap-1" aria-hidden="true">
          {progressSteps.map((step) => (
            <li
              key={step.number}
              className={cn(
                "h-1.5 min-w-0 flex-1 rounded-full",
                step.state === "complete" && "bg-primary/70",
                step.state === "current" && "bg-primary",
                step.state === "upcoming" && "bg-muted",
              )}
            />
          ))}
        </ol>
      ) : null}

      <div className="mt-4 space-y-2">
        <Label htmlFor="registration-section-picker" className="text-label font-medium">
          Current section
        </Label>
        <p className="text-label text-muted-foreground">
          Section {activeIndex + 1} of {WIZARD_STEPS.length}
          {activeStep ? ` · ${activeStep.label}` : ""}
        </p>
        <Select
          value={activeStepId}
          onValueChange={(value) => {
            if (value) {
              onStepSelect(value as WizardStepId);
            }
          }}
        >
          <SelectTrigger
            id="registration-section-picker"
            className={cn(
              REG_TOUCH_CLASS,
              "w-full min-w-0 whitespace-normal text-left",
            )}
          >
            <SelectValue placeholder="Choose a section" className="truncate text-left">
              {activeSectionLabel}
            </SelectValue>
          </SelectTrigger>
          <SelectContent
            align="start"
            alignItemWithTrigger={false}
            sideOffset={8}
            className="min-w-[var(--anchor-width)] w-max max-w-[min(100vw-2rem,var(--available-width))]"
          >
            {WIZARD_STEPS.map((step, index) => {
              const complete = isStepComplete(step.id, stepCompletion);

              return (
                <SelectItem key={step.id} value={step.id}>
                  {index + 1}. {step.label}
                  {complete ? " · Complete" : ""}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
