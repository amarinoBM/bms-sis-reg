"use client";

import { Plus, X } from "lucide-react";

import {
  FormSelect,
  FormTextarea,
  FormTextInput,
} from "@/app/reg/_components/form-fields";
import { Button } from "@/components/ui/button";
import { PARENT_RELATION_OPTIONS } from "@/modules/wizard/field-options";
import {
  GUARDIAN_CONTACT_FIELD_KEYS,
  type GuardianContactPrefix,
  guardianContactHasValues,
  guardianFlatKey,
  readGuardianContact,
} from "@/modules/wizard/guardian-contact";
import { REG_TOUCH_CLASS } from "@/lib/reg-ui";
import { cn } from "@/lib/utils";

type SecondaryGuardiansFieldsProps = {
  values: Record<string, unknown>;
  readOnly: boolean;
  showSecondGuardian: boolean;
  fieldErrors?: Record<string, string>;
  onShowSecondGuardian: () => void;
  onRemoveSecondGuardian: () => void;
  onChange: (key: string, value: unknown) => void;
};

const GUARDIAN_FIELD_LABELS: Record<string, string> = {
  parent_name: "Guardian first name",
  parent_last_name: "Guardian last name",
  parent_email: "Guardian email",
  parent_phone: "Guardian phone",
  parent_address: "Guardian address",
  parent_relation: "Relationship",
};

export function SecondaryGuardiansFields({
  values,
  readOnly,
  showSecondGuardian,
  fieldErrors = {},
  onShowSecondGuardian,
  onRemoveSecondGuardian,
  onChange,
}: SecondaryGuardiansFieldsProps) {
  const secondaryGuardian = readGuardianContact("secondary_guardian", values);
  const tertiaryGuardian = readGuardianContact("tertiary_guardian", values);
  const hasSecondGuardian =
    showSecondGuardian || guardianContactHasValues(tertiaryGuardian);

  return (
    <div className="space-y-4">
      <GuardianCard
        title="Additional guardian 1"
        prefix="secondary_guardian"
        guardian={secondaryGuardian}
        readOnly={readOnly}
        fieldErrors={fieldErrors}
        onChange={onChange}
      />

      {hasSecondGuardian ? (
        <GuardianCard
          title="Additional guardian 2"
          prefix="tertiary_guardian"
          guardian={tertiaryGuardian}
          readOnly={readOnly}
          removable={!readOnly}
          fieldErrors={fieldErrors}
          onRemove={onRemoveSecondGuardian}
          onChange={onChange}
        />
      ) : null}

      {!readOnly && !hasSecondGuardian ? (
        <Button
          type="button"
          variant="outline"
          className={cn(REG_TOUCH_CLASS, "gap-2")}
          onClick={onShowSecondGuardian}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add another guardian
        </Button>
      ) : null}
    </div>
  );
}

type GuardianCardProps = {
  title: string;
  prefix: GuardianContactPrefix;
  guardian: Record<string, string | undefined>;
  readOnly: boolean;
  removable?: boolean;
  fieldErrors?: Record<string, string>;
  onRemove?: () => void;
  onChange: (key: string, value: unknown) => void;
};

function GuardianCard({
  title,
  prefix,
  guardian,
  readOnly,
  removable = false,
  fieldErrors = {},
  onRemove,
  onChange,
}: GuardianCardProps) {
  return (
    <fieldset className="rounded-lg border border-border/80 bg-muted/25 p-4">
      <legend className="flex w-full items-start justify-between gap-3 px-0 text-label font-medium text-foreground">
        <span className="min-w-0">{title}</span>
        {removable && onRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-11 shrink-0 gap-1.5 text-muted-foreground"
            onClick={onRemove}
          >
            <X className="size-4" aria-hidden="true" />
            Remove
          </Button>
        ) : null}
      </legend>

      <div className="mt-4 space-y-4">
        {GUARDIAN_CONTACT_FIELD_KEYS.map((fieldKey) => {
          const id = guardianFlatKey(prefix, fieldKey);
          const value = guardian[fieldKey] ?? "";

          if (fieldKey === "parent_address") {
            return (
              <FormTextarea
                key={id}
                id={id}
                label={GUARDIAN_FIELD_LABELS[fieldKey]}
                value={value}
                disabled={readOnly}
                error={fieldErrors[id]}
                onChange={(next) => onChange(id, next)}
              />
            );
          }

          if (fieldKey === "parent_relation") {
            return (
              <FormSelect
                key={id}
                id={id}
                label={GUARDIAN_FIELD_LABELS[fieldKey]}
                value={value}
                options={[...PARENT_RELATION_OPTIONS]}
                disabled={readOnly}
                onChange={(next) => onChange(id, next)}
              />
            );
          }

          if (fieldKey === "parent_email") {
            return (
              <FormTextInput
                key={id}
                id={id}
                label={GUARDIAN_FIELD_LABELS[fieldKey]}
                type="email"
                value={value}
                disabled={readOnly}
                error={fieldErrors[id]}
                onChange={(next) => onChange(id, next)}
              />
            );
          }

          if (fieldKey === "parent_phone") {
            return (
              <FormTextInput
                key={id}
                id={id}
                label={GUARDIAN_FIELD_LABELS[fieldKey]}
                type="tel"
                value={value}
                disabled={readOnly}
                error={fieldErrors[id]}
                onChange={(next) => onChange(id, next)}
              />
            );
          }

          return (
            <FormTextInput
              key={id}
              id={id}
              label={GUARDIAN_FIELD_LABELS[fieldKey]}
              value={value}
              disabled={readOnly}
              onChange={(next) => onChange(id, next)}
            />
          );
        })}
      </div>
    </fieldset>
  );
}
