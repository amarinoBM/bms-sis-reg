"use client";

import { useMemo, useState } from "react";

import { FormTextInput } from "@/app/reg/_components/form-fields";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { REG_TOUCH_CLASS } from "@/lib/reg-ui";
import { cn } from "@/lib/utils";
import { readInterestsSelection } from "@/modules/wizard/field-options";
import {
  filterInterestCategories,
  type InterestCategory,
} from "@/modules/wizard/interest-categories";

type InterestsFieldsProps = {
  values: Record<string, unknown>;
  readOnly: boolean;
  onChange: (key: string, value: unknown) => void;
};

function InterestExamples({ examples }: { examples: string }) {
  if (!examples) {
    return null;
  }

  return (
    <p className="mt-0.5 text-label leading-snug text-muted-foreground break-words">
      {examples}
    </p>
  );
}

function PrimaryInterestOption({
  item,
  selected,
  readOnly,
  onSelect,
}: {
  item: InterestCategory;
  selected: boolean;
  readOnly: boolean;
  onSelect: () => void;
}) {
  const inputId = `primary-interest-${item.category.replace(/\s+/g, "-")}`;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "flex min-w-0 cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
        selected
          ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
          : "border-border bg-card hover:bg-muted/40",
        readOnly && "cursor-default opacity-80",
      )}
    >
      <input
        id={inputId}
        type="radio"
        name="most_interested_in"
        className="mt-1 size-4 shrink-0 accent-primary"
        checked={selected}
        disabled={readOnly}
        onChange={() => onSelect()}
      />
      <span className="min-w-0">
        <span className="text-body font-medium text-foreground">{item.category}</span>
        <InterestExamples examples={item.examples} />
      </span>
    </label>
  );
}

function AdditionalInterestOption({
  item,
  checked,
  readOnly,
  onToggle,
}: {
  item: InterestCategory;
  checked: boolean;
  readOnly: boolean;
  onToggle: (next: boolean) => void;
}) {
  const inputId = `additional-interest-${item.category.replace(/\s+/g, "-")}`;

  return (
    <div
      className={cn(
        "flex min-w-0 items-start gap-3 rounded-lg border border-border bg-card p-3",
        checked && "border-primary/30 bg-primary/5",
      )}
    >
      <Checkbox
        id={inputId}
        className="mt-0.5 shrink-0"
        checked={checked}
        disabled={readOnly}
        onCheckedChange={(next) => onToggle(next === true)}
      />
      <Label htmlFor={inputId} className="min-w-0 cursor-pointer text-body leading-snug">
        <span className="font-medium text-foreground">{item.category}</span>
        <InterestExamples examples={item.examples} />
      </Label>
    </div>
  );
}

export function InterestsFields({ values, readOnly, onChange }: InterestsFieldsProps) {
  const [query, setQuery] = useState("");
  const primaryValue = typeof values.most_interested_in === "string" ? values.most_interested_in : "";
  const additionalValues = readInterestsSelection(values.interests);

  const filteredCategories = useMemo(() => filterInterestCategories(query), [query]);
  const additionalChoices = filteredCategories.filter((item) => item.fullValue !== primaryValue);

  function handlePrimaryChange(fullValue: string) {
    onChange("most_interested_in", fullValue);
    if (additionalValues.includes(fullValue)) {
      onChange(
        "interests",
        additionalValues.filter((item) => item !== fullValue),
      );
    }
  }

  function handleAdditionalToggle(fullValue: string, next: boolean) {
    if (next) {
      onChange("interests", [...additionalValues, fullValue]);
      return;
    }

    onChange(
      "interests",
      additionalValues.filter((item) => item !== fullValue),
    );
  }

  return (
    <div className="space-y-6">
      <FormTextInput
        id="interest-search"
        label="Search interests"
        description="Filter by topic, like sports, music, or technology."
        value={query}
        disabled={readOnly}
        placeholder="Search…"
        onChange={setQuery}
      />

      <fieldset className="min-w-0 space-y-3">
        <legend className="text-label font-medium text-foreground">Top interest</legend>
        <p className="text-label text-muted-foreground">
          Choose the one area that fits best. This is your student&apos;s main interest.
        </p>
        <div className="max-h-[min(28rem,var(--available-height,28rem))] space-y-2 overflow-y-auto pr-1">
          {filteredCategories.length === 0 ? (
            <p className="text-body text-muted-foreground">No interests match your search.</p>
          ) : (
            filteredCategories.map((item) => (
              <PrimaryInterestOption
                key={item.fullValue}
                item={item}
                selected={primaryValue === item.fullValue}
                readOnly={readOnly}
                onSelect={() => handlePrimaryChange(item.fullValue)}
              />
            ))
          )}
        </div>
      </fieldset>

      <fieldset className="min-w-0 space-y-3">
        <legend className="text-label font-medium text-foreground">
          Additional interests (optional)
        </legend>
        <p className="text-label text-muted-foreground">
          Add any other areas your student enjoys. Your top interest is not listed here.
        </p>
        <div className="max-h-[min(24rem,var(--available-height,24rem))] space-y-2 overflow-y-auto pr-1">
          {additionalChoices.length === 0 ? (
            <p className="text-body text-muted-foreground">
              {primaryValue
                ? "No other interests match your search."
                : "Pick a top interest first, then add more here."}
            </p>
          ) : (
            additionalChoices.map((item) => (
              <AdditionalInterestOption
                key={item.fullValue}
                item={item}
                checked={additionalValues.includes(item.fullValue)}
                readOnly={readOnly}
                onToggle={(next) => handleAdditionalToggle(item.fullValue, next)}
              />
            ))
          )}
        </div>
      </fieldset>
    </div>
  );
}
