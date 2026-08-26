import type { MainProgressStepStatus } from "@/modules/wizard/progress";
import { cn } from "@/lib/utils";

type ProgressRailProps = {
  steps: MainProgressStepStatus[];
};

export function ProgressRail({ steps }: ProgressRailProps) {
  return (
    <nav aria-label="Registration progress" className="overflow-x-auto pb-2">
      <ol className="flex min-w-max gap-2">
        {steps.map((step) => (
          <li key={step.number}>
            <div
              className={cn(
                "flex min-w-[4.5rem] flex-col items-center gap-1 rounded-md px-2 py-2 text-center",
                step.state === "current" && "bg-secondary",
                step.state === "complete" && "text-muted-foreground",
                step.state === "upcoming" && "text-muted-foreground/70",
              )}
            >
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-label font-semibold",
                  step.state === "current" && "bg-primary text-primary-foreground",
                  step.state === "complete" && "bg-[var(--ink-primary)] text-white",
                  step.state === "upcoming" && "border border-border bg-card text-muted-foreground",
                )}
              >
                {step.number}
              </span>
              <span className="text-label leading-tight">{step.label}</span>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
