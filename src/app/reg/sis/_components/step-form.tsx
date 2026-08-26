"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

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
import type { ApiResponse } from "@/server/http/api-envelope";

type StepFormProps = {
  definition: StepFormDefinition;
  leadId: string;
  objectId: string;
  studentName: string;
  initialValues: Record<string, unknown>;
  disabled: boolean;
  onSaved: () => Promise<void>;
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

export function StepForm({
  definition,
  leadId,
  objectId,
  studentName,
  initialValues,
  disabled,
  onSaved,
}: StepFormProps) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const readOnly = disabled;

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  async function handleSave() {
    if (!definition.saveHandler) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/students/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          objectId,
          saveStep: definition.saveHandler,
          studentName,
          fields: values,
        }),
      });
      const body = (await response.json()) as ApiResponse<{ objectId: string }>;
      if (!body.success) {
        throw new Error(body.error.message);
      }
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

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      const body = (await response.json()) as ApiResponse<{ fieldKey: string; url: string }>;
      if (!body.success) {
        throw new Error(body.error.message);
      }

      setValues((current) => ({ ...current, [body.data.fieldKey]: body.data.url }));
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
        {definition.fields.map((field) => (
          <FieldControl
            key={field.key}
            field={field}
            value={fieldValue(values, field.key)}
            readOnly={readOnly}
            uploading={uploadingKey === field.key}
            onChange={(value) => updateValue(field.key, value)}
            onUpload={(file) => handleUpload(field, file)}
          />
        ))}
      </div>

      {definition.saveHandler && !readOnly && (
        <div className="mt-6">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save section"}
          </Button>
        </div>
      )}

      {readOnly && (
        <p className="mt-6 text-label text-muted-foreground">This section has been saved.</p>
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
          <SelectTrigger id={field.key}>
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
            <a href={String(value)} className="text-primary underline" target="_blank" rel="noreferrer">
              View uploaded file
            </a>
          </p>
        ) : (
          <p className="text-label text-muted-foreground">No file uploaded yet.</p>
        )}
        {!readOnly && (
          <Input
            id={field.key}
            type="file"
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
        type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
        value={String(value ?? "")}
        disabled={readOnly}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
