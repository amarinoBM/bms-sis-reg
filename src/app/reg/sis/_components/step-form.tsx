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
import { TranscriptFields } from "@/app/reg/_components/transcript-fields";
import { HomeStateFields } from "@/app/reg/_components/home-state-fields";
import { InterestsFields } from "@/app/reg/_components/interests-fields";
import { LearningProfileFields } from "@/app/reg/_components/learning-profile-fields";
import { PriorSchoolFields } from "@/app/reg/_components/prior-school-fields";
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
import { fieldLayoutClass, getFieldUiHints } from "@/modules/wizard/field-hints";
import type { StepFieldDefinition, StepFormDefinition } from "@/modules/wizard/step-schemas";
import { readTranscriptFiles } from "@/modules/wizard/transcript-fields";

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
  _stepId: WizardStepId,
  _field: StepFieldDefinition,
  _values: Record<string, unknown>,
): boolean {
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

      setValues((current) => {
        if (uploadResult.fieldKey === "transcriptFiles") {
          const existing = readTranscriptFiles(current.transcriptFiles);
          return { ...current, transcriptFiles: [...existing, uploadResult.url] };
        }

        return { ...current, [uploadResult.fieldKey]: uploadResult.url };
      });
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

  async function handleTranscriptUpload(file: File) {
    await handleUpload(
      {
        key: "transcriptFiles",
        label: "Transcript upload",
        type: "file",
        uploadType: "transcript",
      },
      file,
    );
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
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-[#fae2d9] bg-[#fdf6f3]/70 px-6 py-5">
        <h2 className="text-section font-semibold text-foreground">{definition.title}</h2>
        <p className="mt-1.5 text-body leading-relaxed text-muted-foreground">
          {definition.description(studentName)}
        </p>
      </div>

      <div className="space-y-6 p-6">
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

        {stepId === "5" ? (
          <LearningProfileFields
            studentName={studentName}
            values={activeValues}
            readOnly={readOnly}
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

        {stepId === "8" ? (
          <PriorSchoolFields
            studentName={studentName}
            values={activeValues}
            readOnly={readOnly}
            onChange={updateValue}
            uploadingLearningSample={uploadingKey === "upload_student_curreny_learning"}
            uploadingIepPlan={uploadingKey === "upload_copy_EIP_504_plan"}
            pendingLearningSampleName={
              pendingUpload?.key === "upload_student_curreny_learning"
                ? pendingUpload.fileName
                : undefined
            }
            pendingIepPlanName={
              pendingUpload?.key === "upload_copy_EIP_504_plan"
                ? pendingUpload.fileName
                : undefined
            }
            learningSampleUrl={
              typeof activeValues.upload_student_curreny_learning === "string"
                ? activeValues.upload_student_curreny_learning
                : null
            }
            iepPlanUrl={
              typeof activeValues.upload_copy_EIP_504_plan === "string"
                ? activeValues.upload_copy_EIP_504_plan
                : null
            }
            uploadedLearningSampleName={uploadedFileNames.upload_student_curreny_learning}
            uploadedIepPlanName={uploadedFileNames.upload_copy_EIP_504_plan}
            onUploadLearningSample={
              readOnly
                ? undefined
                : (file) =>
                    handleUpload(
                      {
                        key: "upload_student_curreny_learning",
                        label: "Learning sample",
                        type: "file",
                        uploadType: "learning",
                      },
                      file,
                    )
            }
            onUploadIepPlan={
              readOnly
                ? undefined
                : (file) =>
                    handleUpload(
                      {
                        key: "upload_copy_EIP_504_plan",
                        label: "IEP plan",
                        type: "file",
                        uploadType: "iep",
                      },
                      file,
                    )
            }
          />
        ) : null}

        {stepId === "9" ? (
          <TranscriptFields
            studentName={studentName}
            values={activeValues}
            readOnly={readOnly}
            onChange={updateValue}
            uploading={uploadingKey === "transcriptFiles"}
            pendingFileName={
              pendingUpload?.key === "transcriptFiles" ? pendingUpload.fileName : undefined
            }
            transcriptFileUrl={readTranscriptFiles(activeValues.transcriptFiles)[0]}
            uploadedFileName={uploadedFileNames.transcriptFiles}
            onUploadTranscript={readOnly ? undefined : handleTranscriptUpload}
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
              <fieldset
                key={`${group.legend}-${groupIndex}`}
                className="space-y-4 rounded-lg border border-border/80 bg-muted/25 p-4"
              >
                <legend className="text-label font-medium text-foreground">{group.legend}</legend>
                <div className="grid gap-5 sm:grid-cols-2">
                  {group.fields.map((field) => (
                    <div key={field.key} className={cn("min-w-0", fieldLayoutClass("full"))}>
                      <FieldControl
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
                    </div>
                  ))}
                </div>
              </fieldset>
            );
          }

          return (
            <div key={`fields-${groupIndex}`} className="grid gap-5 sm:grid-cols-2">
              {group.fields.map((field) => (
                <div
                  key={field.key}
                  className={cn("min-w-0", fieldLayoutClass(getFieldUiHints(field).layout))}
                >
                  <FieldControl
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
                </div>
              ))}
            </div>
          );
        })}

        {uploadOnlyStep && (
          <p className="text-label text-muted-foreground">
            Uploads in this section are saved automatically.
          </p>
        )}

        {definition.saveHandler && !readOnly && (
          <div>
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
      </div>
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
  const ui = getFieldUiHints(field);

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
        description={ui.hint}
        value={String(value ?? "")}
        disabled={readOnly}
        placeholder={ui.placeholder}
        onChange={(next) => onChange(next)}
      />
    );
  }

  if (field.type === "select") {
    return (
      <FormSelect
        id={field.key}
        label={field.label}
        description={ui.hint}
        value={value ? String(value) : ""}
        options={field.options ?? []}
        disabled={readOnly}
        placeholder={ui.selectPlaceholder ?? "Select an option"}
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
        description={ui.hint}
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
        description={ui.hint}
        type="email"
        value={String(value ?? "")}
        disabled={readOnly}
        placeholder={ui.placeholder}
        autoComplete={ui.autoComplete}
        onChange={(next) => onChange(next)}
      />
    );
  }

  if (field.type === "phone") {
    return (
      <FormTextInput
        id={field.key}
        label={field.label}
        description={ui.hint}
        type="tel"
        value={String(value ?? "")}
        disabled={readOnly}
        placeholder={ui.placeholder}
        autoComplete={ui.autoComplete}
        inputMode="tel"
        onChange={(next) => onChange(next)}
      />
    );
  }

  return (
    <FormTextInput
      id={field.key}
      label={field.label}
      description={ui.hint}
      value={String(value ?? "")}
      disabled={readOnly}
      placeholder={ui.placeholder}
      autoComplete={ui.autoComplete}
      onChange={(next) => onChange(next)}
    />
  );
}
