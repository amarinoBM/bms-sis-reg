"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";

import type { Matcher } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  formatDateDisplay,
  parseDateInputIso,
  toDateInputValue,
} from "@/lib/date-fields";
import { REG_TOUCH_CLASS } from "@/lib/reg-ui";
import { cn } from "@/lib/utils";

export type DatePickerIntent = "birth" | "start" | "default";

type DatePickerBounds = {
  minDate?: Date;
  maxDate?: Date;
  startMonth: Date;
  endMonth: Date;
  defaultMonth: Date;
};

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function resolveBounds(
  intent: DatePickerIntent,
  min?: string,
  max?: string,
): DatePickerBounds {
  const today = startOfToday();
  const year = today.getFullYear();
  const minDate = min ? parseDateInputIso(min) : undefined;
  const maxDate = max ? parseDateInputIso(max) : undefined;

  if (intent === "birth") {
    const birthMax = maxDate ?? today;
    const birthMin = minDate ?? new Date(year - 25, 0, 1);

    return {
      minDate: birthMin,
      maxDate: birthMax,
      startMonth: new Date(birthMin.getFullYear(), 0, 1),
      endMonth: new Date(birthMax.getFullYear(), 11, 31),
      defaultMonth: new Date(year - 10, today.getMonth(), 1),
    };
  }

  if (intent === "start") {
    const startMin = minDate ?? today;
    const startMax = maxDate ?? new Date(year + 2, 11, 31);

    return {
      minDate: startMin,
      maxDate: startMax,
      startMonth: new Date(startMin.getFullYear(), startMin.getMonth(), 1),
      endMonth: new Date(startMax.getFullYear(), 11, 31),
      defaultMonth: today,
    };
  }

  const fallbackMin = minDate ?? new Date(year - 100, 0, 1);
  const fallbackMax = maxDate ?? new Date(year + 10, 11, 31);

  return {
    minDate: minDate ?? fallbackMin,
    maxDate: maxDate ?? fallbackMax,
    startMonth: minDate ?? fallbackMin,
    endMonth: maxDate ?? fallbackMax,
    defaultMonth: today,
  };
}

type DatePickerProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  min?: string;
  max?: string;
  placeholder?: string;
  intent?: DatePickerIntent;
  className?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  "aria-required"?: boolean;
};

export function DatePicker({
  id,
  value,
  onChange,
  disabled,
  min,
  max,
  placeholder = "Select date",
  intent = "default",
  className,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  "aria-required": ariaRequired,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? parseDateInputIso(value) : undefined;
  const bounds = resolveBounds(intent, min, max);
  const displayValue = value ? formatDateDisplay(value) : "";

  function handleSelect(date: Date | undefined) {
    if (!date) {
      onChange("");
      return;
    }

    onChange(toDateInputValue(date));
    setOpen(false);
  }

  const disabledMatchers: Matcher[] = [];
  if (bounds.minDate) {
    disabledMatchers.push({ before: bounds.minDate });
  }
  if (bounds.maxDate) {
    disabledMatchers.push({ after: bounds.maxDate });
  }

  return (
    <Popover open={open} onOpenChange={setOpen} triggerId={id}>
      <PopoverTrigger
        id={id}
        render={
          <button
            type="button"
            disabled={disabled}
            aria-describedby={ariaDescribedBy}
            aria-invalid={ariaInvalid}
            aria-required={ariaRequired}
            className={cn(
              "flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-input bg-card px-2.5 py-1 text-left text-base shadow-sm outline-none select-none focus-visible:border-input focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:bg-muted/40 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-inset aria-invalid:ring-destructive/30 md:text-sm dark:bg-card/90",
              REG_TOUCH_CLASS,
              className,
            )}
          />
        }
      >
        <span className={cn("truncate", !displayValue && "text-muted-foreground")}>
          {displayValue || placeholder}
        </span>
        <CalendarIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          selected={selectedDate}
          defaultMonth={selectedDate ?? bounds.defaultMonth}
          startMonth={bounds.startMonth}
          endMonth={bounds.endMonth}
          disabled={disabledMatchers.length > 0 ? disabledMatchers : undefined}
          onSelect={handleSelect}
        />
        {value ? (
          <div className="border-t border-border/80 p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear date
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
