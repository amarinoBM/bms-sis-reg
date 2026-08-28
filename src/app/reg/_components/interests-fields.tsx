"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { InterestCategoryChips } from "@/app/reg/_components/interest-category-chips";
import { FieldRequirementBadge, FormTextarea } from "@/app/reg/_components/form-fields";
import { Input } from "@/components/ui/input";
import { REG_TOUCH_CLASS } from "@/lib/reg-ui";
import { cn } from "@/lib/utils";
import { readInterestsSelection } from "@/modules/wizard/field-options";
import { filterInterestCategories } from "@/modules/wizard/interest-categories";

type InterestsFieldsProps = {
  values: Record<string, unknown>;
  readOnly: boolean;
  fieldErrors?: Record<string, string>;
  onChange: (key: string, value: unknown) => void;
};

export function InterestsFields({ values, readOnly, fieldErrors = {}, onChange }: InterestsFieldsProps) {
  const [query, setQuery] = useState("");
  const filteredCategories = useMemo(() => filterInterestCategories(query), [query]);

  const primaryValue =
    typeof values.most_interested_in === "string" ? values.most_interested_in : "";
  const additionalValues = readInterestsSelection(values.interests);
  const studentName = typeof values.student_name === "string" && values.student_name.trim()
    ? values.student_name.trim()
    : "your child";

  return (
    <div className="space-y-8">
      <FormTextarea
        id="most_interested_in"
        label={`What is ${studentName} most interested in?`}
        description="Tell us what they love learning about or doing, in your own words."
        value={primaryValue}
        onChange={(next) => onChange("most_interested_in", next)}
        disabled={readOnly}
        requirement="required"
        error={fieldErrors.most_interested_in}
        rows={6}
      />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="text-section font-medium text-foreground">Also enjoys</h3>
          <FieldRequirementBadge kind="optional" />
        </div>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="interests-search"
            aria-label="Search interests"
            type="search"
            value={query}
            disabled={readOnly}
            placeholder="Search interests…"
            className={cn(REG_TOUCH_CLASS, "pl-9")}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <InterestCategoryChips
          id="interests"
          label="Anything else they love?"
          description="Choose as many categories as you like. This will not change your written answer."
          mode="multiple"
          categories={filteredCategories}
          value={additionalValues}
          disabled={readOnly}
          error={fieldErrors.interests}
          onChange={(next) => onChange("interests", next)}
        />
      </div>
    </div>
  );
}
