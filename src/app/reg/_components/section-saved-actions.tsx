import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { REG_TOUCH_CLASS } from "@/lib/reg-ui";
import { cn } from "@/lib/utils";

type SectionSavedActionsProps = {
  message?: string;
  onEdit?: () => void;
  editLabel?: string;
  editDisabled?: boolean;
  onNext?: () => void;
  nextLabel?: string;
  className?: string;
};

export function SectionSavedActions({
  message = "This section is complete.",
  onEdit,
  editLabel = "Edit section",
  editDisabled = false,
  onNext,
  nextLabel = "Next section",
  className,
}: SectionSavedActionsProps) {
  return (
    <div
      className={cn(
        "mt-6 rounded-lg border border-border bg-muted/20 p-4",
        className,
      )}
    >
      <p className="text-body text-foreground">{message}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {onEdit ? (
          <Button
            type="button"
            variant="outline"
            className={REG_TOUCH_CLASS}
            disabled={editDisabled}
            onClick={onEdit}
          >
            {editLabel}
          </Button>
        ) : null}
        {onNext ? (
          <Button
            type="button"
            className={cn(REG_TOUCH_CLASS, "gap-1.5")}
            onClick={onNext}
          >
            {nextLabel}
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
