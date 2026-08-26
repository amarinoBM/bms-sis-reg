"use client";

import { useState } from "react";
import { toast } from "sonner";

import { ExternalLink } from "@/app/reg/_components/external-link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { StepFieldDefinition, StepFormDefinition } from "@/modules/wizard/step-schemas";
import { REG_TOUCH_CLASS } from "@/lib/reg-ui";
import { postApi, postFormApi } from "@/lib/client-api";

type StepFormProps = {
  definition: StepFormDefinition;
  leadId: string;
  objectId: string;
  studentName: string;
  stepId: string;
  initialValues: Record<string, unknown>;
  disabled: boolean;
  onSaved: () => Promise<void>;
};

type FieldGroup = {
  legend?: string;
  fields: StepFieldDefinition[];
};

function toDateInputValue(value: unknown): string {
  if (typeof value !== "number") {
    return "";
  }
  return new Date(value).toISOString().slice(0, 10);
}

function fromDateInputValue(value: string): number | null {
  if (!value) {
    return null;
  }
  return new Date(value).getTime();
}

function fieldValue(values: Record<string, unknown>, key: string): unknown {
  return values[key];
}

function groupStepFields(fields: StepFieldDefinition[]): FieldGroup[] {
  const groups: FieldGroup[] = [];
  let checkboxRun: StepFieldDefinition[] = [];
  let checkboxLegend: string | undefined;

  function flushCheckboxRun() {
    if (checkboxRun.length > 0) {
      groups.push({ legend: checkboxLegend, fields: checkboxRun });
      checkboxRun = [];
      checkboxLegend = undefined;
    }
  }

  for (const field of fields) {
    if (field.type === "checkbox" && field.group) {
      if (checkboxLegend && checkboxLegend !== field.group) {
        flushCheckboxRun();
      }
      checkboxLegend = field.group;
      checkboxRun.push(field);
      continue;
    }

    flushCheckboxRun();
    groups.push({ fields: [field] });
  }

  flushCheckboxRun();
  return groups;
}

export function StepForm({
  definition,
  leadId,
  objectId,
  studentName,
  stepId,
  initialValues,
  disabled,
  onSaved,
}: StepFormProps) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [saving, setSaving] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const readOnly = disabled && !isEditing;
  const activeValues = readOnly ? initialValues : values;
  const fieldGroups = groupStepFields(definition.fields);
  const uploadOnlyStep = !definition.saveHandler && definition.fields.some((f) => f.type === "file");

  async function handleUnlock() {
    setUnlocking(true);
    try {
      await postApi<{ unlocked: boolean }>("/api/students/unlock", {
        leadId,
        objectId,
        stepId,
      });
      setValues(initialValues);
      setIsEditing(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not unlock section.");
    } finally {
      setUnlocking(false);
    }
  }

  async function handleSave() {
    if (!definition.saveHandler) {
      return;
    }

    setSaving(true);
    try {
      await postApi<{ objectId: string }>("/api/students/save", {
        leadId,
        objectId,
        saveStep: definition.saveHandler,
        studentName,
        fields: values,
      });
      toast.success("Saved");
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(field: StepFieldDefinition, file: File) {
    if (!field.uploadType) {
      return;
    }

    setUploadingKey(field.key);
    try {
      const formData = new FormData();
      formData.append("leadId", leadId);
      formData.append("objectId", objectId);
      formData.append("studentName", studentName);
      formData.append("uploadType", field.uploadType);
      formData.append("fieldKey", field.key);
      formData.append("file", file);

      const uploadResult = await postFormApi<{ fieldKey: string; url: string }>(
        "/api/uploads",
        formData,
      );

      setValues((current) => ({ ...current, [uploadResult.fieldKey]: uploadResult.url }));
      toast.success("File uploaded");
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploadingKey(null);
    }
  }

  function updateValue(key: string, value: unknown) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-section font-semibold text-foreground">{definition.title}</h2>
      <p className="mt-2 text-body text-muted-foreground">
        {definition.description(studentName)}
      </p>

      <div className="mt-6 space-y-4">
        {fieldGroups.map((group, groupIndex) => {
          if (group.legend) {
            return (
              <fieldset key={`${group.legend}-${groupIndex}`} className="space-y-3">
                <legend className="text-label font-medium text-foreground">{group.legend}</legend>
                {group.fields.map((field) => (
                  <FieldControl
                    key={field.key}
                    field={field}
                    value={fieldValue(activeValues, field.key)}
                    readOnly={readOnly}
                    uploading={uploadingKey === field.key}
                    onChange={(value) => updateValue(field.key, value)}
                    onUpload={(file) => handleUpload(field, file)}
                  />
                ))}
              </fieldset>
            );
          }

          return group.fields.map((field) => (
            <FieldControl
              key={field.key}
              field={field}
              value={fieldValue(activeValues, field.key)}
              readOnly={readOnly}
              uploading={uploadingKey === field.key}
              onChange={(value) => updateValue(field.key, value)}
              onUpload={(file) => handleUpload(field, file)}
            />
          ));
        })}
      </div>

      {uploadOnlyStep && (
        <p className="mt-4 text-label text-muted-foreground">
          Uploads in this section are saved automatically.
        </p>
      )}

      {definition.saveHandler && !readOnly && (
        <div className="mt-6">
          <Button className={REG_TOUCH_CLASS} onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save section"}
          </Button>
        </div>
      )}

      {disabled && !isEditing && definition.saveHandler && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <p className="text-label text-muted-foreground">This section has been saved.</p>
          <Button
            variant="outline"
            className={REG_TOUCH_CLASS}
            onClick={handleUnlock}
            disabled={unlocking}
          >
            {unlocking ? "Unlocking…" : "Edit section"}
          </Button>
        </div>
      )}
    </section>
  );
}

type FieldControlProps = {
  field: StepFieldDefinition;
  value: unknown;
  readOnly: boolean;
  uploading: boolean;
  onChange: (value: unknown) => void;
  onUpload: (file: File) => void;
};

function FieldControl({
  field,
  value,
  readOnly,
  uploading,
  onChange,
  onUpload,
}: FieldControlProps) {
  if (field.type === "checkbox") {
    return (
      <div className="flex items-center gap-2">
        <Checkbox
          checked={Boolean(value)}
          disabled={readOnly}
          onCheckedChange={(checked) => onChange(checked === true)}
          id={field.key}
        />
        <Label htmlFor={field.key}>{field.label}</Label>
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="space-y-2">
        <Label htmlFor={field.key}>{field.label}</Label>
        <Textarea
          id={field.key}
          className={REG_TOUCH_CLASS}
          value={String(value ?? "")}
          disabled={readOnly}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div className="space-y-2">
        <Label htmlFor={field.key}>{field.label}</Label>
        <Select
          value={value ? String(value) : ""}
          onValueChange={(next) => onChange(next)}
          disabled={readOnly}
        >
          <SelectTrigger id={field.key} className={REG_TOUCH_CLASS}>
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (field.type === "file") {
    return (
      <div className="space-y-2">
        <Label htmlFor={field.key}>{field.label}</Label>
        {value ? (
          <p className="text-body text-foreground">
            <ExternalLink href={String(value)} className="text-primary underline">
              View uploaded file
            </ExternalLink>
          </p>
        ) : (
          <p className="text-label text-muted-foreground">No file uploaded yet.</p>
        )}
        {!readOnly && (
          <Input
            id={field.key}
            type="file"
            className={REG_TOUCH_CLASS}
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                onUpload(file);
              }
            }}
          />
        )}
      </div>
    );
  }

  if (field.type === "date") {
    return (
      <div className="space-y-2">
        <Label htmlFor={field.key}>{field.label}</Label>
        <Input
          id={field.key}
          type="date"
          className={REG_TOUCH_CLASS}
          value={toDateInputValue(value)}
          disabled={readOnly}
          onChange={(event) => onChange(fromDateInputValue(event.target.value))}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={field.key}>{field.label}</Label>
      <Input
        id={field.key}
        className={REG_TOUCH_CLASS}
        type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
        value={String(value ?? "")}
        disabled={readOnly}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
