"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  FormCheckbox,
  FormCheckboxGroup,
  FormDateInput,
  FormFileUpload,
  FormSelect,
  FormTextarea,
  FormTextInput,
} from "@/app/reg/_components/form-fields";
import { SecondaryGuardiansFields } from "@/app/reg/_components/secondary-guardians-fields";
import { HomeStateFields } from "@/app/reg/_components/home-state-fields";
import { InterestsFields } from "@/app/reg/_components/interests-fields";
import { ConfidenceScaleFields } from "@/app/reg/_components/confidence-scale-fields";
import { RegSpinner } from "@/app/reg/_components/reg-spinner";
import { Button } from "@/components/ui/button";
import { SectionSavedActions } from "@/app/reg/_components/section-saved-actions";
import {
  GUARDIAN_CONTACT_FIELD_KEYS,
  guardianContactHasValues,
  guardianFlatKey,
  readGuardianContact,
} from "@/modules/wizard/guardian-contact";
import {
  getNextStepId,
  getWizardStepLabel,
  type WizardStepId,
} from "@/modules/wizard/steps";
import { isAppError } from "@/core/app-error";
import { fromDateInputValue, toDateInputValue } from "@/lib/date-fields";
import { messageFromRegApiError } from "@/lib/reg-api-errors";
import { REG_TOUCH_CLASS } from "@/lib/reg-ui";
import { cn } from "@/lib/utils";
import { postApi, postFormApi } from "@/lib/client-api";
import { assertUploadFileAllowed } from "@/modules/uploads/upload-limits";
import type { StepFieldDefinition, StepFormDefinition } from "@/modules/wizard/step-schemas";

type StepFormProps = {
  definition: StepFormDefinition;
  leadId: string;
  objectId: string;
  studentName: string;
  stepId: WizardStepId;
  initialValues: Record<string, unknown>;
  disabled: boolean;
  onSaved: () => Promise<void>;
  onGoToStep: (stepId: WizardStepId) => void;
};

type FieldGroup = {
  legend?: string;
  fields: StepFieldDefinition[];
};

function fieldValue(values: Record<string, unknown>, key: string): unknown {
  return values[key];
}

function shouldShowStepField(
  stepId: WizardStepId,
  field: StepFieldDefinition,
  values: Record<string, unknown>,
): boolean {
  if (stepId === "5") {
    if (field.group === "Challenges" || field.key === "additional_info_behavioral_challenges") {
      return values.learning_or_behavioral_challenges === true;
    }
  }

  if (stepId === "9" && (field.key === "CreditTransfer" || field.key === "uploadTranscript")) {
    return values.transferCredit === true;
  }

  return true;
}

function visibleStepFields(
  stepId: WizardStepId,
  fields: StepFieldDefinition[],
  values: Record<string, unknown>,
): StepFieldDefinition[] {
  return fields.filter((field) => shouldShowStepField(stepId, field, values));
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
  onGoToStep,
}: StepFormProps) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [saving, setSaving] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [pendingUpload, setPendingUpload] = useState<{
    key: string;
    fileName: string;
  } | null>(null);
  const [uploadedFileNames, setUploadedFileNames] = useState<Record<string, string>>({});
  const [showSecondGuardian, setShowSecondGuardian] = useState(() =>
    guardianContactHasValues(
      readGuardianContact("tertiary_guardian", initialValues),
    ),
  );

  const sectionComplete = (disabled || justSaved) && !isEditing;
  const readOnly = sectionComplete;
  const activeValues = readOnly && !justSaved ? initialValues : values;
  const visibleFields = visibleStepFields(stepId, definition.fields, activeValues);
  const fieldGroups = groupStepFields(visibleFields);
  const uploadOnlyStep = !definition.saveHandler && visibleFields.some((f) => f.type === "file");
  const iepNotRequired = stepId === "12" && activeValues.IEP_or_504_plan !== true;
  const nextStepId = getNextStepId(stepId);

  async function handleUnlock() {
    setUnlocking(true);
    try {
      await postApi<{ unlocked: boolean }>("/api/students/unlock", {
        leadId,
        objectId,
        stepId,
      });
      setValues(initialValues);
      setJustSaved(false);
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
      toast.success("Section saved");
      setIsEditing(false);
      setJustSaved(true);
      await onSaved();
    } catch (error) {
      toast.error(messageFromRegApiError(error, "Could not save."));
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(field: StepFieldDefinition, file: File) {
    if (!field.uploadType) {
      return;
    }

    try {
      assertUploadFileAllowed(file);
    } catch (error) {
      toast.error(
        isAppError(error)
          ? error.exposeMessage
          : "Could not upload this file. Try a PDF or image under 10 MB.",
      );
      return;
    }

    setPendingUpload({ key: field.key, fileName: file.name });
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
      setUploadedFileNames((current) => ({
        ...current,
        [uploadResult.fieldKey]: file.name,
      }));
      toast.success("File uploaded");
      setIsEditing(false);
      setJustSaved(true);
      await onSaved();
    } catch (error) {
      toast.error(messageFromRegApiError(error, "Upload failed."));
    } finally {
      setUploadingKey(null);
      setPendingUpload(null);
    }
  }

  function updateValue(key: string, value: unknown) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleRemoveSecondGuardian() {
    const clearedFields = GUARDIAN_CONTACT_FIELD_KEYS.reduce<
      Record<string, unknown>
    >((acc, fieldKey) => {
      acc[guardianFlatKey("tertiary_guardian", fieldKey)] = "";
      return acc;
    }, {});

    setValues((current) => ({ ...current, ...clearedFields }));
    setShowSecondGuardian(false);
  }

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-section font-semibold text-foreground">{definition.title}</h2>
      <p className="mt-2 text-body text-muted-foreground">
        {definition.description(studentName)}
      </p>

      <div className="mt-6 space-y-5">
        {iepNotRequired ? (
          <div className="rounded-md border border-border bg-muted/30 p-4 text-body text-muted-foreground">
            You indicated that {studentName} does not have an IEP or 504 plan. No document upload
            is required for this section.
          </div>
        ) : null}

        {stepId === "3" ? (
          <SecondaryGuardiansFields
            values={activeValues}
            readOnly={readOnly}
            showSecondGuardian={showSecondGuardian}
            onShowSecondGuardian={() => setShowSecondGuardian(true)}
            onRemoveSecondGuardian={handleRemoveSecondGuardian}
            onChange={updateValue}
          />
        ) : null}

        {stepId === "4" ? (
          <InterestsFields
            values={activeValues}
            readOnly={readOnly}
            onChange={updateValue}
          />
        ) : null}

        {stepId === "7" ? (
          <ConfidenceScaleFields
            values={activeValues}
            readOnly={readOnly}
            onChange={updateValue}
          />
        ) : null}

        {stepId === "10" ? (
          <HomeStateFields
            studentName={studentName}
            values={activeValues}
            readOnly={readOnly}
            onChange={updateValue}
          />
        ) : null}

        {fieldGroups.map((group, groupIndex) => {
          if (iepNotRequired) {
            return null;
          }

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
                    pendingFileName={
                      pendingUpload?.key === field.key
                        ? pendingUpload.fileName
                        : undefined
                    }
                    uploadedFileName={uploadedFileNames[field.key]}
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
              pendingFileName={
                pendingUpload?.key === field.key
                  ? pendingUpload.fileName
                  : undefined
              }
              uploadedFileName={uploadedFileNames[field.key]}
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
          <Button
            className={cn(REG_TOUCH_CLASS, "gap-2")}
            onClick={handleSave}
            disabled={saving}
            aria-busy={saving}
          >
            {saving ? (
              <>
                <RegSpinner size="sm" variant="onPrimary" />
                Saving…
              </>
            ) : (
              "Save section"
            )}
          </Button>
        </div>
      )}

      {(sectionComplete && (definition.saveHandler || uploadOnlyStep)) || iepNotRequired ? (
        <SectionSavedActions
          message={
            iepNotRequired
              ? "No IEP or 504 document is required."
              : definition.saveHandler
                ? "This section has been saved."
                : "This section is complete."
          }
          onEdit={
            definition.saveHandler && sectionComplete
              ? () => void handleUnlock()
              : undefined
          }
          editLabel={unlocking ? "Unlocking…" : "Edit section"}
          editDisabled={unlocking}
          onNext={
            nextStepId
              ? () => onGoToStep(nextStepId)
              : undefined
          }
          nextLabel={
            nextStepId
              ? `Next: ${getWizardStepLabel(nextStepId)}`
              : "Next section"
          }
        />
      ) : null}
    </section>
  );
}

type FieldControlProps = {
  field: StepFieldDefinition;
  value: unknown;
  readOnly: boolean;
  uploading: boolean;
  pendingFileName?: string;
  uploadedFileName?: string;
  onChange: (value: unknown) => void;
  onUpload: (file: File) => void;
};

function FieldControl({
  field,
  value,
  readOnly,
  uploading,
  pendingFileName,
  uploadedFileName,
  onChange,
  onUpload,
}: FieldControlProps) {
  if (field.type === "multiselect") {
    const selected = Array.isArray(value) ? value.map(String) : [];

    return (
      <FormCheckboxGroup
        legend={field.label}
        idPrefix={field.key}
        options={field.options ?? []}
        value={selected}
        disabled={readOnly}
        onChange={(next) => onChange(next)}
      />
    );
  }

  if (field.type === "checkbox") {
    return (
      <FormCheckbox
        id={field.key}
        label={field.label}
        checked={Boolean(value)}
        disabled={readOnly}
        onChange={(checked) => onChange(checked)}
      />
    );
  }

  if (field.type === "textarea") {
    return (
      <FormTextarea
        id={field.key}
        label={field.label}
        value={String(value ?? "")}
        disabled={readOnly}
        onChange={(next) => onChange(next)}
      />
    );
  }

  if (field.type === "select") {
    return (
      <FormSelect
        id={field.key}
        label={field.label}
        value={value ? String(value) : ""}
        options={field.options ?? []}
        disabled={readOnly}
        onChange={(next) => onChange(next)}
      />
    );
  }

  if (field.type === "file") {
    return (
      <FormFileUpload
        id={field.key}
        label={field.label}
        fileUrl={value ? String(value) : null}
        pendingFileName={pendingFileName}
        uploadedFileName={uploadedFileName}
        uploading={uploading}
        readOnly={readOnly}
        onFileSelect={onUpload}
      />
    );
  }

  if (field.type === "date") {
    return (
      <FormDateInput
        id={field.key}
        label={field.label}
        value={toDateInputValue(value)}
        disabled={readOnly}
        onChange={(next) => onChange(fromDateInputValue(next))}
      />
    );
  }

  if (field.type === "email") {
    return (
      <FormTextInput
        id={field.key}
        label={field.label}
        type="email"
        value={String(value ?? "")}
        disabled={readOnly}
        onChange={(next) => onChange(next)}
      />
    );
  }

  if (field.type === "phone") {
    return (
      <FormTextInput
        id={field.key}
        label={field.label}
        type="tel"
        value={String(value ?? "")}
        disabled={readOnly}
        onChange={(next) => onChange(next)}
      />
    );
  }

  return (
    <FormTextInput
      id={field.key}
      label={field.label}
      value={String(value ?? "")}
      disabled={readOnly}
      onChange={(next) => onChange(next)}
    />
  );
}
