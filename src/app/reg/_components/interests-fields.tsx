"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { InterestCategoryChips } from "@/app/reg/_components/interest-category-chips";
import { FieldRequirementBadge } from "@/app/reg/_components/form-fields";
import { Input } from "@/components/ui/input";
import { REG_TOUCH_CLASS } from "@/lib/reg-ui";
import { cn } from "@/lib/utils";
import { readInterestsSelection } from "@/modules/wizard/field-options";
import {
  filterInterestCategories,
  INTEREST_CATEGORIES,
} from "@/modules/wizard/interest-categories";

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
  const [query, setQuery] = useState("");
  const filteredCategories = useMemo(() => filterInterestCategories(query), [query]);

  const primaryValue =
    typeof values.most_interested_in === "string" ? values.most_interested_in.trim() : "";
  const additionalValues = readInterestsSelection(values.interests);
  const primaryIsKnown = primaryValue ? isKnownInterestValue(primaryValue) : false;
  const topInterestValue = primaryIsKnown ? primaryValue : "";

  function handleTopInterestChange(next: string | string[]) {
    const selection = typeof next === "string" ? next : next[0] ?? "";
    onChange("most_interested_in", selection);
    if (selection && additionalValues.includes(selection)) {
      onChange(
        "interests",
        additionalValues.filter((item) => item !== selection),
      );
    }
  }

  return (
    <div className="space-y-8">
      {primaryValue && !primaryIsKnown ? (
        <div className="rounded-lg border border-amber-200/80 bg-amber-50/80 p-4 text-body text-foreground">
          <p className="font-medium">Saved answer</p>
          <p className="mt-1 text-muted-foreground">{primaryValue}</p>
          <p className="mt-2 text-label text-muted-foreground">
            Pick the closest category below to update this answer.
          </p>
        </div>
      ) : null}

      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id="interests-search"
          type="search"
          value={query}
          disabled={readOnly}
          placeholder="Search interests…"
          className={cn(REG_TOUCH_CLASS, "pl-9")}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="text-section font-medium text-foreground">Top interest</h3>
          <FieldRequirementBadge kind="required" />
        </div>
        <InterestCategoryChips
          id="most_interested_in"
          label="What fits best right now?"
          description="Tap one area — the one they care about most."
          mode="single"
          categories={filteredCategories}
          value={topInterestValue}
          disabled={readOnly}
          error={fieldErrors.most_interested_in}
          onChange={handleTopInterestChange}
        />
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="text-section font-medium text-foreground">Also enjoys</h3>
          <FieldRequirementBadge kind="optional" />
        </div>
        <InterestCategoryChips
          id="interests"
          label="Anything else they love?"
          description={
            topInterestValue
              ? "Tap as many as you like. Their top pick is hidden here."
              : "Choose a top interest first, then add more here."
          }
          mode="multiple"
          categories={filteredCategories}
          value={additionalValues}
          disabled={readOnly || !topInterestValue}
          excludeValues={topInterestValue ? [topInterestValue] : []}
          error={fieldErrors.interests}
          onChange={(next) => onChange("interests", next)}
        />
      </div>
    </div>
  );
}
