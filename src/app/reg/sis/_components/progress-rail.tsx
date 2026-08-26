import type { MainProgressStepStatus } from "@/modules/wizard/progress";
import { cn } from "@/lib/utils";

type ProgressRailProps = {
  steps: MainProgressStepStatus[];
  className?: string;
};

export function ProgressRail({ steps, className }: ProgressRailProps) {
  return (
    <nav
      aria-label="Registration progress"
      className={cn("overflow-x-auto pb-2", className)}
    >
      <ol className="flex min-w-max gap-1 sm:gap-2">
        {steps.map((step) => (
          <li key={step.number} className="min-w-0" aria-current={step.state === "current" ? "step" : undefined}>
            <div
              className={cn(
                "flex min-w-[4.25rem] max-w-[5.5rem] flex-col items-center gap-1 rounded-md px-1.5 py-2 text-center sm:min-w-[4.5rem] sm:px-2",
                step.state === "current" && "bg-secondary",
                step.state === "complete" && "text-muted-foreground",
                step.state === "upcoming" && "text-muted-foreground/70",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-label font-semibold",
                  step.state === "current" && "bg-primary text-primary-foreground",
                  step.state === "complete" &&
                    "border border-primary/35 bg-primary/10 text-primary",
                  step.state === "upcoming" && "border border-border bg-card text-muted-foreground",
                )}
              >
                {step.number}
              </span>
              <span className="line-clamp-2 min-w-0 text-label leading-tight break-words">
                {step.label}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
