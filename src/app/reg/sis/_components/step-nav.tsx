"use client";

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

  return (
    <div className={cn("min-w-0", className)}>
      <div className="lg:hidden">
        <Label htmlFor="registration-section-picker" className="text-label font-medium">
          Section
        </Label>
        <p className="mt-1 text-label text-muted-foreground">
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
            className={cn(REG_TOUCH_CLASS, "mt-2 w-full min-w-0")}
          >
            <SelectValue placeholder="Choose a section" />
          </SelectTrigger>
          <SelectContent
            align="start"
            alignItemWithTrigger={false}
            sideOffset={8}
            className="min-w-[var(--anchor-width)] w-max max-w-[min(100vw-3rem,var(--available-width))]"
          >
            {WIZARD_STEPS.map((step, index) => {
              const complete = isStepComplete(step.id, stepCompletion);

              return (
                <SelectItem key={step.id} value={step.id}>
                  {index + 1}. {step.label}
                  {complete ? " · Done" : ""}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <nav
        aria-label="Registration sections"
        className="hidden rounded-lg border border-border bg-card p-4 lg:block lg:sticky lg:top-6 lg:self-start"
      >
        <p className="text-label font-medium text-muted-foreground">Sections</p>
        <ul className="mt-3 space-y-1">
          {WIZARD_STEPS.map((step, index) => {
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
                    "flex w-full min-w-0 items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-body transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  <span className="min-w-0 break-words">
                    <span className="text-label text-muted-foreground">{index + 1}.</span>{" "}
                    {step.label}
                  </span>
                  {complete ? (
                    <span className="shrink-0 text-label text-muted-foreground">Done</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
