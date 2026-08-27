"use client";

import type { ReactNode } from "react";

import { FormTextarea } from "@/app/reg/_components/form-fields";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { REG_TOUCH_CLASS } from "@/lib/reg-ui";
import { cn } from "@/lib/utils";
import {
  additionalBehavioralInfoLabel,
  disabilitySelectionPrompt,
  EXPRESSION_SECTION_PROMPT,
  LEARNING_DISABILITY_FIELDS,
  LEARNING_EXPRESSION_FIELDS,
  learningChallengesGateLabel,
  readLearningOrBehavioralChallenges,
} from "@/modules/wizard/learning-profile";

type LearningProfileFieldsProps = {
  studentName: string;
  values: Record<string, unknown>;
  readOnly: boolean;
  fieldErrors?: Record<string, string>;
  onChange: (key: string, value: unknown) => void;
};

function ChoiceButton({
  selected,
  disabled,
  onClick,
  children,
}: {
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={selected ? "default" : "outline"}
      className={cn(
        REG_TOUCH_CLASS,
        "h-auto whitespace-normal px-4 py-3 text-left",
        selected && "bg-[#fae2d9] text-[#f5713c] hover:bg-[#fae2d9]/90",
      )}
      disabled={disabled}
      aria-pressed={selected}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function ProfileCheckbox({
  id,
  label,
  checked,
  readOnly,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  readOnly: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-lg border border-border/80 bg-card p-3 shadow-sm">
      <Checkbox
        id={id}
        className="mt-0.5 size-5 shrink-0 after:-inset-x-4 after:-inset-y-3"
        checked={checked}
        disabled={readOnly}
        onCheckedChange={(next) => onChange(next === true)}
      />
      <Label htmlFor={id} className="min-w-0 py-0.5 text-body leading-snug break-words">
        {label}
      </Label>
    </div>
  );
}

function clearChallengeSelections(
  onChange: (key: string, value: unknown) => void,
) {
  for (const field of LEARNING_DISABILITY_FIELDS) {
    onChange(field.key, false);
  }
  for (const field of LEARNING_EXPRESSION_FIELDS) {
    onChange(field.key, false);
  }
  onChange("other_behavioral_challenges", "");
  onChange("additional_info_behavioral_challenges", "");
}

export function LearningProfileFields({
  studentName,
  values,
  readOnly,
  fieldErrors = {},
  onChange,
}: LearningProfileFieldsProps) {
  const hasChallenges = readLearningOrBehavioralChallenges(
    values.learning_or_behavioral_challenges,
  );

  function handleGateChange(next: boolean) {
    onChange("learning_or_behavioral_challenges", next);
    if (!next) {
      clearChallengeSelections(onChange);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-label font-medium text-foreground">
          {learningChallengesGateLabel(studentName)}
          <span className="text-destructive" aria-hidden="true"> *</span>
          <span className="sr-only"> (required)</span>
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <ChoiceButton
            selected={hasChallenges === true}
            disabled={readOnly}
            onClick={() => handleGateChange(true)}
          >
            Yes
          </ChoiceButton>
          <ChoiceButton
            selected={hasChallenges === false}
            disabled={readOnly}
            onClick={() => handleGateChange(false)}
          >
            No
          </ChoiceButton>
        </div>
        {fieldErrors.learning_or_behavioral_challenges ? (
          <p className="text-label text-destructive" role="alert">
            {fieldErrors.learning_or_behavioral_challenges}
          </p>
        ) : null}
      </div>

      {hasChallenges === true ? (
        <div className="space-y-6">
          {fieldErrors.learning_profile_details ? (
            <p className="text-label text-destructive" role="alert">
              {fieldErrors.learning_profile_details}
            </p>
          ) : null}
          <fieldset className="space-y-4 rounded-lg border border-border/80 bg-muted/25 p-4">
            <legend className="px-1 text-label font-medium leading-snug text-foreground">
              {disabilitySelectionPrompt(studentName)}
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {LEARNING_DISABILITY_FIELDS.map((field) => (
                <ProfileCheckbox
                  key={field.key}
                  id={field.key}
                  label={field.label}
                  checked={values[field.key] === true}
                  readOnly={readOnly}
                  onChange={(checked) => onChange(field.key, checked)}
                />
              ))}
            </div>
            <FormTextarea
              id="other_behavioral_challenges"
              label="Other"
              value={String(values.other_behavioral_challenges ?? "")}
              disabled={readOnly}
              placeholder="Describe any other learning or behavioral challenge"
              onChange={(value) => onChange("other_behavioral_challenges", value)}
            />
          </fieldset>

          <fieldset className="space-y-4 rounded-lg border border-border/80 bg-muted/25 p-4">
            <legend className="px-1 text-label font-medium leading-snug text-foreground">
              {EXPRESSION_SECTION_PROMPT}
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {LEARNING_EXPRESSION_FIELDS.map((field) => (
                <ProfileCheckbox
                  key={field.key}
                  id={field.key}
                  label={field.label}
                  checked={values[field.key] === true}
                  readOnly={readOnly}
                  onChange={(checked) => onChange(field.key, checked)}
                />
              ))}
            </div>
          </fieldset>

          <FormTextarea
            id="additional_info_behavioral_challenges"
            label={additionalBehavioralInfoLabel(studentName)}
            value={String(values.additional_info_behavioral_challenges ?? "")}
            disabled={readOnly}
            rows={7}
            className="min-h-44 field-sizing-fixed"
            placeholder="Share context, accommodations, or strategies that work at home."
            onChange={(value) => onChange("additional_info_behavioral_challenges", value)}
          />
        </div>
      ) : hasChallenges === false ? (
        <p className="rounded-lg border border-border/80 bg-muted/20 p-4 text-body text-muted-foreground">
          You indicated that {studentName} does not have learning or behavioral challenges. Save
          this section to continue.
        </p>
      ) : null}
    </div>
  );
}
