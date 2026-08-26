import type { MainProgressStepStatus } from "@/modules/wizard/progress";
import { cn } from "@/lib/utils";

type WizardProgressSummaryProps = {
  steps: MainProgressStepStatus[];
  className?: string;
};

export function WizardProgressSummary({ steps, className }: WizardProgressSummaryProps) {
  const currentStep = steps.find((step) => step.state === "current") ?? steps[0];
  const completedCount = steps.filter((step) => step.state === "complete").length;

  if (!currentStep) {
    return null;
  }

  return (
    <div
      className={cn("rounded-lg border border-border bg-card p-4", className)}
      aria-label="Registration progress"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-label font-medium text-muted-foreground">Registration progress</p>
        <p className="text-label text-muted-foreground">
          {completedCount} of {steps.length} complete
        </p>
      </div>
      <p className="mt-2 text-body font-semibold text-foreground">
        Step {currentStep.number} of {steps.length}: {currentStep.label}
      </p>
      <ol className="mt-4 flex gap-1" aria-hidden="true">
        {steps.map((step) => (
          <li
            key={step.number}
            className={cn(
              "h-2 flex-1 rounded-full",
              step.state === "complete" && "bg-primary/70",
              step.state === "current" && "bg-primary",
              step.state === "upcoming" && "bg-muted",
            )}
          />
        ))}
      </ol>
    </div>
  );
}
