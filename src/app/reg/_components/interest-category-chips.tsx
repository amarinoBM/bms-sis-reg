"use client";

import { useMemo } from "react";

import { REG_TOUCH_CLASS } from "@/lib/reg-ui";
import { cn } from "@/lib/utils";
import type { InterestCategory } from "@/modules/wizard/interest-categories";

type InterestCategoryChipsProps = {
  id: string;
  label: string;
  description?: string;
  error?: string;
  categories: InterestCategory[];
  mode: "single" | "multiple";
  value: string | string[];
  disabled?: boolean;
  excludeValues?: string[];
  onChange: (value: string | string[]) => void;
};

function InterestChip({
  category,
  selected,
  disabled,
  mode,
  onClick,
}: {
  category: InterestCategory;
  selected: boolean;
  disabled?: boolean;
  mode: "single" | "multiple";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      role={mode === "single" ? "radio" : "checkbox"}
      aria-checked={selected}
      className={cn(
        REG_TOUCH_CLASS,
        "rounded-lg border px-3 py-2.5 text-left text-sm transition-colors outline-none select-none",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40",
        "disabled:pointer-events-none disabled:opacity-50",
        selected
          ? "border-primary/50 bg-[#fae2d9] text-[#12324a] shadow-sm"
          : "border-border/80 bg-card text-foreground hover:border-primary/30 hover:bg-muted/40",
      )}
      onClick={onClick}
    >
      <span className="font-medium leading-snug">{category.category}</span>
      {category.examples ? (
        <span className="mt-0.5 block text-[0.75rem] leading-snug text-muted-foreground">
          {category.examples}
        </span>
      ) : null}
    </button>
  );
}

export function InterestCategoryChips({
  id,
  label,
  description,
  error,
  categories,
  mode,
  value,
  disabled,
  excludeValues = [],
  onChange,
}: InterestCategoryChipsProps) {
  const excluded = useMemo(() => new Set(excludeValues), [excludeValues]);
  const visibleCategories = useMemo(
    () => categories.filter((item) => !excluded.has(item.fullValue)),
    [categories, excluded],
  );

  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  const selectedValues =
    mode === "single"
      ? typeof value === "string" && value
        ? [value]
        : []
      : Array.isArray(value)
        ? value
        : [];

  function handleToggle(fullValue: string) {
    if (mode === "single") {
      const current = typeof value === "string" ? value : "";
      onChange(current === fullValue ? "" : fullValue);
      return;
    }

    const current = Array.isArray(value) ? value : [];
    if (current.includes(fullValue)) {
      onChange(current.filter((item) => item !== fullValue));
      return;
    }
    onChange([...current, fullValue]);
  }

  return (
    <div className="min-w-0 space-y-3">
      <div className="space-y-1">
        <p id={`${id}-label`} className="text-label font-medium text-foreground">
          {label}
        </p>
        {description ? (
          <p id={descriptionId} className="max-w-prose text-label text-muted-foreground">
            {description}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} className="text-label text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {visibleCategories.length === 0 ? (
        <p className="text-label text-muted-foreground">No interests match your search.</p>
      ) : (
        <div
          role={mode === "single" ? "radiogroup" : "group"}
          aria-labelledby={`${id}-label`}
          aria-describedby={describedBy}
          className="grid gap-2 sm:grid-cols-2"
        >
          {visibleCategories.map((category) => {
            const selected = selectedValues.includes(category.fullValue);

            return (
              <InterestChip
                key={category.fullValue}
                category={category}
                selected={selected}
                disabled={disabled}
                mode={mode}
                onClick={() => handleToggle(category.fullValue)}
              />
            );
          })}
        </div>
      )}

      {mode === "multiple" && selectedValues.length > 0 ? (
        <p className="text-label text-muted-foreground">
          {selectedValues.length} selected. Tap again to remove.
        </p>
      ) : null}
    </div>
  );
}
