"use client";

import {
  FormMultiOptionSelect,
  FormOptionSelect,
  type FormFieldOption,
} from "@/app/reg/_components/form-fields";
import { readInterestsSelection } from "@/modules/wizard/field-options";
import { INTEREST_CATEGORIES } from "@/modules/wizard/interest-categories";

const INTEREST_OPTIONS: FormFieldOption[] = INTEREST_CATEGORIES.map((item) => ({
  value: item.fullValue,
  label: item.category,
  description: item.examples,
}));

type InterestsFieldsProps = {
  values: Record<string, unknown>;
  readOnly: boolean;
  fieldErrors?: Record<string, string>;
  onChange: (key: string, value: unknown) => void;
};

function isKnownInterestValue(value: string): boolean {
  return INTEREST_CATEGORIES.some((item) => item.fullValue === value);
}

export function InterestsFields({ values, readOnly, fieldErrors = {}, onChange }: InterestsFieldsProps) {
  const primaryValue =
    typeof values.most_interested_in === "string" ? values.most_interested_in.trim() : "";
  const additionalValues = readInterestsSelection(values.interests);
  const primaryIsKnown = primaryValue ? isKnownInterestValue(primaryValue) : false;

  function handlePrimaryChange(fullValue: string) {
    onChange("most_interested_in", fullValue);
    if (additionalValues.includes(fullValue)) {
      onChange(
        "interests",
        additionalValues.filter((item) => item !== fullValue),
      );
    }
  }

  return (
    <div className="space-y-6">
      {primaryValue && !primaryIsKnown ? (
        <div className="rounded-lg border border-amber-200/80 bg-amber-50/80 p-4 text-body text-foreground">
          <p className="font-medium">Saved answer</p>
          <p className="mt-1 text-muted-foreground">{primaryValue}</p>
          <p className="mt-2 text-label text-muted-foreground">
            Pick the closest category below to update this answer.
          </p>
        </div>
      ) : null}

      <FormOptionSelect
        id="most_interested_in"
        label="Top interest"
        description="Choose the one area that fits best. This is required."
        value={primaryIsKnown ? primaryValue : ""}
        options={INTEREST_OPTIONS}
        disabled={readOnly}
        placeholder="Select top interest"
        required
        error={fieldErrors.most_interested_in}
        onChange={handlePrimaryChange}
      />

      <FormMultiOptionSelect
        id="interests"
        label="Interests"
        description="Add any other areas your student enjoys. Your top interest is not listed here."
        value={additionalValues}
        options={INTEREST_OPTIONS}
        disabled={readOnly || !primaryValue}
        placeholder="Add another interest…"
        excludeValues={primaryValue ? [primaryValue] : []}
        onChange={(next) => onChange("interests", next)}
      />
    </div>
  );
}
