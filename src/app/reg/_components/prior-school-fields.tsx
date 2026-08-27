"use client";

import type { ReactNode } from "react";

import {
  FormFileUpload,
  FormOptionSelect,
  FormTextarea,
  FormTextInput,
  type FormFieldOption,
} from "@/app/reg/_components/form-fields";
import { Button } from "@/components/ui/button";
import { REG_TOUCH_CLASS } from "@/lib/reg-ui";
import { cn } from "@/lib/utils";
import {
  IEP_UPLOAD_LABEL,
  LEARNING_ENVIRONMENT_OPTIONS,
  iepQuestionLabel,
  learningEnvironmentLabel,
  learningExperienceHint,
  learningExperienceLabel,
  learningSampleDescription,
  learningSampleLabel,
  priorSchoolAddressLabel,
  priorSchoolContactNumberLabel,
  priorSchoolContactPersonLabel,
  priorSchoolNameLabel,
  readIepOr504Plan,
  readLearningCenterBool,
  schoolLikeToSeeLabel,
  shouldAskLastSchoolAttendance,
  shouldShowLastSchoolFields,
} from "@/modules/wizard/prior-school-fields";

const ENVIRONMENT_OPTIONS: FormFieldOption[] = LEARNING_ENVIRONMENT_OPTIONS.map((option) => ({
  value: option,
  label: option,
}));

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

type PriorSchoolFieldsProps = {
  studentName: string;
  values: Record<string, unknown>;
  readOnly: boolean;
  fieldErrors?: Record<string, string>;
  onChange: (key: string, value: unknown) => void;
  uploadingLearningSample?: boolean;
  uploadingIepPlan?: boolean;
  pendingLearningSampleName?: string;
  pendingIepPlanName?: string;
  learningSampleUrl?: string | null;
  iepPlanUrl?: string | null;
  uploadedLearningSampleName?: string;
  uploadedIepPlanName?: string;
  onUploadLearningSample?: (file: File) => void;
  onUploadIepPlan?: (file: File) => void;
};

export function PriorSchoolFields({
  studentName,
  values,
  readOnly,
  fieldErrors = {},
  onChange,
  uploadingLearningSample = false,
  uploadingIepPlan = false,
  pendingLearningSampleName,
  pendingIepPlanName,
  learningSampleUrl,
  iepPlanUrl,
  uploadedLearningSampleName,
  uploadedIepPlanName,
  onUploadLearningSample,
  onUploadIepPlan,
}: PriorSchoolFieldsProps) {
  const learningEnvironment = String(values.learning_environment_past_12_months ?? "");
  const hadLastSchool = readLearningCenterBool(values.learningCenterBool);
  const showLastSchoolFields = shouldShowLastSchoolFields(values);
  const askLastSchoolAttendance = shouldAskLastSchoolAttendance(learningEnvironment);
  const hasIep = readIepOr504Plan(values.IEP_or_504_plan);

  function setHadLastSchool(next: boolean) {
    onChange("learningCenterBool", next);
    if (!next) {
      onChange("student_last_school_name", "");
      onChange("student_last_school_address", "");
      onChange("student_last_school_contact_person", "");
      onChange("student_last_school_contact_num", "");
    }
  }

  function setHasIep(next: boolean) {
    onChange("IEP_or_504_plan", next);
    if (!next) {
      onChange("upload_copy_EIP_504_plan", "");
    }
  }

  return (
    <div className="space-y-6">
      <fieldset className="space-y-4 rounded-lg border border-border/80 bg-muted/25 p-4">
        <legend className="px-1 text-label font-medium text-foreground">
          Learning ENVIRONMENT for the past 12 months
        </legend>
        <FormOptionSelect
          id="learning_environment_past_12_months"
          label={learningEnvironmentLabel(studentName)}
          value={learningEnvironment}
          options={ENVIRONMENT_OPTIONS}
          disabled={readOnly}
          placeholder="Select an option"
          required
          error={fieldErrors.learning_environment_past_12_months}
          onChange={(value) => {
            onChange("learning_environment_past_12_months", value);
            if (shouldAskLastSchoolAttendance(value)) {
              onChange("learningCenterBool", null);
            } else {
              onChange("learningCenterBool", true);
            }
          }}
        />
      </fieldset>

      <fieldset className="space-y-4 rounded-lg border border-border/80 bg-muted/25 p-4">
        <legend className="px-1 text-label font-medium text-foreground">
          Learning EXPERIENCE for the past 12 months
        </legend>
        <FormTextarea
          id="learning_experiece_past_12_months"
          label={learningExperienceLabel(studentName)}
          description={learningExperienceHint(studentName)}
          value={String(values.learning_experiece_past_12_months ?? "")}
          disabled={readOnly}
          required
          error={fieldErrors.learning_experiece_past_12_months}
          onChange={(value) => onChange("learning_experiece_past_12_months", value)}
        />
      </fieldset>

      {askLastSchoolAttendance || showLastSchoolFields ? (
        <fieldset className="space-y-4 rounded-lg border border-border/80 bg-muted/25 p-4">
          <legend className="px-1 text-label font-medium text-foreground">Last school</legend>
          {askLastSchoolAttendance ? (
            <div className="flex flex-wrap gap-3">
              <ChoiceButton
                selected={hadLastSchool === true}
                disabled={readOnly}
                onClick={() => setHadLastSchool(true)}
              >
                Yes
              </ChoiceButton>
              <ChoiceButton
                selected={hadLastSchool === false}
                disabled={readOnly}
                onClick={() => setHadLastSchool(false)}
              >
                No
              </ChoiceButton>
            </div>
          ) : null}

          {showLastSchoolFields ? (
            <>
          <FormTextInput
            id="student_last_school_name"
            label={priorSchoolNameLabel(studentName)}
            value={String(values.student_last_school_name ?? "")}
            disabled={readOnly}
            error={fieldErrors.student_last_school_name}
            onChange={(value) => onChange("student_last_school_name", value)}
          />
          <FormTextarea
            id="student_last_school_address"
            label={priorSchoolAddressLabel(studentName)}
            value={String(values.student_last_school_address ?? "")}
            disabled={readOnly}
            error={fieldErrors.student_last_school_address}
            onChange={(value) => onChange("student_last_school_address", value)}
          />
          <FormTextInput
            id="student_last_school_contact_person"
            label={priorSchoolContactPersonLabel(studentName)}
            value={String(values.student_last_school_contact_person ?? "")}
            disabled={readOnly}
            onChange={(value) => onChange("student_last_school_contact_person", value)}
          />
          <FormTextInput
            id="student_last_school_contact_num"
            label={priorSchoolContactNumberLabel(studentName)}
            value={String(values.student_last_school_contact_num ?? "")}
            disabled={readOnly}
            onChange={(value) => onChange("student_last_school_contact_num", value)}
          />
            </>
          ) : null}
        </fieldset>
      ) : null}

      <FormTextarea
        id="school_like_to_see"
        label={schoolLikeToSeeLabel(studentName)}
        value={String(values.school_like_to_see ?? "")}
        disabled={readOnly}
        onChange={(value) => onChange("school_like_to_see", value)}
      />

      <div className="space-y-3">
        <p className="text-label font-medium text-foreground">{iepQuestionLabel(studentName)}</p>
        <div className="flex flex-wrap gap-3">
          <ChoiceButton
            selected={hasIep === true}
            disabled={readOnly}
            onClick={() => setHasIep(true)}
          >
            Yes
          </ChoiceButton>
          <ChoiceButton
            selected={hasIep === false}
            disabled={readOnly}
            onClick={() => setHasIep(false)}
          >
            No
          </ChoiceButton>
        </div>
      </div>

      {hasIep === true ? (
        <FormFileUpload
          id="upload_copy_EIP_504_plan"
          label={IEP_UPLOAD_LABEL}
          error={fieldErrors.upload_copy_EIP_504_plan}
          fileUrl={iepPlanUrl}
          pendingFileName={pendingIepPlanName}
          uploadedFileName={uploadedIepPlanName}
          uploading={uploadingIepPlan}
          readOnly={readOnly || !onUploadIepPlan}
          onFileSelect={(file) => onUploadIepPlan?.(file)}
        />
      ) : null}

      <FormFileUpload
        id="upload_student_curreny_learning"
        label={learningSampleLabel(studentName)}
        description={learningSampleDescription(studentName)}
        fileUrl={learningSampleUrl}
        pendingFileName={pendingLearningSampleName}
        uploadedFileName={uploadedLearningSampleName}
        uploading={uploadingLearningSample}
        readOnly={readOnly || !onUploadLearningSample}
        onFileSelect={(file) => onUploadLearningSample?.(file)}
      />
    </div>
  );
}
