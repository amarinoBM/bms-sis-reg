"use client";

import { REG_TOUCH_CLASS } from "@/lib/reg-ui";
import { cn } from "@/lib/utils";
import {
  CONFIDENCE_FIELD_DEFINITIONS,
  CONFIDENCE_SCALE_OPTIONS,
} from "@/modules/wizard/confidence-scale";

type ConfidenceScaleFieldsProps = {
  values: Record<string, unknown>;
  readOnly: boolean;
  onChange: (key: string, value: unknown) => void;
};

function readConfidenceValue(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

export function ConfidenceScaleFields({
  values,
  readOnly,
  onChange,
}: ConfidenceScaleFieldsProps) {
  return (
    <div className="space-y-6">
      <p className="text-label text-muted-foreground">
        1 means needs a lot of support. 5 means very confident. Pick the number that fits best
        today.
      </p>

      {CONFIDENCE_FIELD_DEFINITIONS.map((field) => {
        const selected = readConfidenceValue(values[field.key]);

        return (
          <fieldset key={field.key} className="min-w-0 space-y-3">
            <legend className="text-label font-medium text-foreground">{field.label}</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {CONFIDENCE_SCALE_OPTIONS.map((option) => {
                const inputId = `${field.key}-${option.value}`;
                const isSelected = selected === option.value;

                return (
                  <label
                    key={option.value}
                    htmlFor={inputId}
                    className={cn(
                      REG_TOUCH_CLASS,
                      "flex min-w-0 cursor-pointer flex-col items-center justify-center rounded-lg border px-2 py-2 text-center transition-colors",
                      isSelected
                        ? "border-primary/40 bg-primary/10 ring-1 ring-primary/20"
                        : "border-border bg-card hover:bg-muted/40",
                      readOnly && "cursor-default opacity-80",
                    )}
                  >
                    <input
                      id={inputId}
                      type="radio"
                      name={field.key}
                      value={option.value}
                      className="sr-only"
                      checked={isSelected}
                      disabled={readOnly}
                      onChange={() => onChange(field.key, option.value)}
                    />
                    <span className="text-body font-semibold text-foreground">{option.value}</span>
                    <span className="mt-0.5 text-label leading-tight text-muted-foreground break-words">
                      {option.shortLabel}
                    </span>
                    <span className="sr-only">{option.description}</span>
                  </label>
                );
              })}
            </div>
            {selected ? (
              <p className="text-label text-muted-foreground">
                Selected:{" "}
                {CONFIDENCE_SCALE_OPTIONS.find((option) => option.value === selected)?.description}
              </p>
            ) : (
              <p className="text-label text-muted-foreground">Choose a rating for this area.</p>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}
