"use client";

import { FormOptionSelect, type FormFieldOption } from "@/app/reg/_components/form-fields";
import {
  CONFIDENCE_FIELD_DEFINITIONS,
  CONFIDENCE_SCALE_OPTIONS,
} from "@/modules/wizard/confidence-scale";

const CONFIDENCE_OPTIONS: FormFieldOption[] = CONFIDENCE_SCALE_OPTIONS.map((option) => ({
  value: option.value,
  label: `${option.value} — ${option.shortLabel}`,
  description: option.description,
}));

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

      {CONFIDENCE_FIELD_DEFINITIONS.map((field) => (
        <FormOptionSelect
          key={field.key}
          id={field.key}
          label={field.label}
          value={readConfidenceValue(values[field.key])}
          options={CONFIDENCE_OPTIONS}
          disabled={readOnly}
          placeholder="Select confidence level"
          required
          onChange={(value) => onChange(field.key, value)}
        />
      ))}
    </div>
  );
}
