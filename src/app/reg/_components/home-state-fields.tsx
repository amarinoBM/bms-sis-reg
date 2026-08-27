"use client";

import { useEffect, useState, type ReactNode } from "react";

import {
  FormCheckbox,
  FormSelect,
  FormTextarea,
  FormTextInput,
} from "@/app/reg/_components/form-fields";
import { ExternalLink } from "@/app/reg/_components/external-link";
import { RegSpinner } from "@/app/reg/_components/reg-spinner";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/client-api";
import { REG_TOUCH_CLASS } from "@/lib/reg-ui";
import { US_STATE_OPTIONS } from "@/modules/wizard/field-options";
import {
  HOME_STATE_COPY,
  PAPERWORK_SUPPORT_NO,
  PAPERWORK_SUPPORT_YES,
  VACCINE_CONFIRMING,
  VACCINE_PENDING,
} from "@/modules/wizard/home-state-copy";
import {
  isCustomVaccineSituation,
  shouldShowFloridaStepUpSection,
  shouldShowFloridaVaccineSection,
} from "@/modules/state-regs/state-regs-logic";
import type { StateRegDto } from "@/modules/state-regs/types";
import { cn } from "@/lib/utils";

type HomeStateFieldsProps = {
  studentName: string;
  values: Record<string, unknown>;
  readOnly: boolean;
  fieldErrors?: Record<string, string>;
  onChange: (key: string, value: unknown) => void;
  onFieldsChange?: (updates: Record<string, unknown>) => void;
};

type StateRegsResponse = {
  stateReg: StateRegDto | null;
};

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readBoolean(value: unknown): boolean {
  return value === true;
}

function hsldaLegalPath(stateName: string): string {
  return stateName.trim().replace(/ /g, "-");
}

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

function RequirementsList({
  displays,
}: {
  displays: StateRegDto["requirementDisplays"];
}) {
  return (
    <ul className="space-y-2.5">
      {displays.map((display) => (
        <li key={display.primaryLine} className="flex gap-3 text-body leading-relaxed text-foreground">
          <span
            className="mt-2 size-1.5 shrink-0 rounded-full bg-[#f5713c]"
            aria-hidden="true"
          />
          <span className="min-w-0">
            {display.linkUrl ? (
              <ExternalLink
                href={display.linkUrl}
                className="font-medium text-[#32325d] underline underline-offset-4 hover:text-[#f5713c]"
              >
                {display.linkLabel ?? display.primaryLine}
              </ExternalLink>
            ) : (
              display.primaryLine
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

function SituationCard({
  title,
  detail,
  selected,
  disabled,
  onClick,
}: {
  title: string;
  detail: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-md border px-4 py-3 text-left transition-colors",
        selected
          ? "border-[#f5713c] bg-[#fae2d9] shadow-[inset_0_0_0_2px_#f5713c]"
          : "border-border bg-card hover:bg-muted/30",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <p className="text-label font-medium text-[#f5713c]">{title}</p>
      <p className="mt-1 text-body text-muted-foreground">{detail}</p>
    </button>
  );
}

export function HomeStateFields({
  studentName,
  values,
  readOnly,
  fieldErrors = {},
  onChange,
  onFieldsChange,
}: HomeStateFieldsProps) {
  const homeState = readString(values.home_state);
  const paperworkYesSelected =
    readString(values.determining_required_paperwork_home_state) === PAPERWORK_SUPPORT_YES;
  const paperworkNoSelected =
    readString(values.determining_required_paperwork_home_state) === PAPERWORK_SUPPORT_NO;
  const vaccineValue = readString(values.vaccine_situation);
  const submitStepUp = readBoolean(values.submit_step_up);
  const stepUpDeclined = values.submit_step_up === false;

  const [stateReg, setStateReg] = useState<StateRegDto | null>(null);
  const [loadingStateReg, setLoadingStateReg] = useState(false);
  const [stateRegError, setStateRegError] = useState<string | null>(null);
  const [stateRegRetryNonce, setStateRegRetryNonce] = useState(0);
  const [showExemptionInput, setShowExemptionInput] = useState(() =>
    isCustomVaccineSituation(vaccineValue),
  );

  const showFloridaVaccineSection = shouldShowFloridaVaccineSection(homeState);
  const showFloridaStepUpSection = shouldShowFloridaStepUpSection(homeState);
  const showRequirementsPanel = Boolean(stateReg?.showRequirementsPanel);

  useEffect(() => {
    if (!homeState) {
      setStateReg(null);
      setStateRegError(null);
      setLoadingStateReg(false);
      return;
    }

    let cancelled = false;
    setStateReg(null);
    setLoadingStateReg(true);
    setStateRegError(null);

    fetchApi<StateRegsResponse>(
      `/api/state-regs?state=${encodeURIComponent(homeState)}`,
    )
      .then((response) => {
        if (!cancelled) {
          setStateReg(response.stateReg);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setStateReg(null);
          setStateRegError(
            error instanceof Error ? error.message : "Could not load state requirements.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingStateReg(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [homeState, stateRegRetryNonce]);

  useEffect(() => {
    setShowExemptionInput(isCustomVaccineSituation(vaccineValue));
  }, [vaccineValue]);

  function handleHomeStateChange(value: string) {
    const updates: Record<string, unknown> = {
      home_state: value,
      determining_required_paperwork_home_state: "",
      vaccine_situation: "",
      submit_step_up: false,
      step_up_id: "",
      student_award_id: "",
    };

    if (onFieldsChange) {
      onFieldsChange(updates);
    } else {
      for (const [key, fieldValue] of Object.entries(updates)) {
        onChange(key, fieldValue);
      }
    }

    setShowExemptionInput(false);
  }

  function handlePaperworkYes() {
    onChange("determining_required_paperwork_home_state", PAPERWORK_SUPPORT_YES);
  }

  function handlePaperworkNo() {
    onChange("determining_required_paperwork_home_state", PAPERWORK_SUPPORT_NO);
  }

  function handleVaccineConfirming() {
    setShowExemptionInput(false);
    onChange("vaccine_situation", VACCINE_CONFIRMING);
  }

  function handleVaccinePending() {
    setShowExemptionInput(false);
    onChange("vaccine_situation", VACCINE_PENDING);
  }

  function handleVaccineExemption() {
    setShowExemptionInput(true);
    onChange("vaccine_situation", "");
  }

  function handleStepUpYes() {
    onChange("submit_step_up", true);
  }

  function handleStepUpNo() {
    onChange("submit_step_up", false);
    onChange("step_up_id", "");
    onChange("student_award_id", "");
  }

  const hsldaPath = homeState ? hsldaLegalPath(homeState) : "";

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-lg border border-[#f5713c]/20 bg-[#fdf6f3]/80 px-4 py-3">
        <p className="text-body leading-relaxed text-foreground">{HOME_STATE_COPY.intro}</p>
        <p className="text-label leading-relaxed text-[#537fb4]">
          {HOME_STATE_COPY.travelLead}
          <span className="font-medium text-foreground">{studentName}</span>
          {HOME_STATE_COPY.travelTail}
        </p>
      </div>

      <FormSelect
        id="home_state"
        label={HOME_STATE_COPY.fieldLabel}
        value={homeState}
        options={[...US_STATE_OPTIONS]}
        disabled={readOnly}
        placeholder="Select a state"
        error={fieldErrors.home_state}
        requirement="required"
        onChange={handleHomeStateChange}
      />

      {loadingStateReg ? (
        <div
          className="flex items-center gap-2 text-body text-muted-foreground"
          role="status"
        >
          <RegSpinner className="size-4" />
          Loading state requirements…
        </div>
      ) : null}

      {stateRegError ? (
        <div className="space-y-2">
          <p className="text-body text-destructive">{stateRegError}</p>
          <Button
            type="button"
            variant="outline"
            className={REG_TOUCH_CLASS}
            onClick={() => setStateRegRetryNonce((current) => current + 1)}
          >
            Try again
          </Button>
        </div>
      ) : null}

      {showRequirementsPanel && stateReg && !loadingStateReg ? (
        <fieldset
          key={stateReg.stateName}
          className="space-y-4 rounded-lg border border-border/80 bg-muted/25 p-4"
        >
          <legend className="px-1 text-label font-medium text-foreground">
            {HOME_STATE_COPY.requirementsHeading}
          </legend>

          <RequirementsList displays={stateReg.requirementDisplays} />

          {stateReg.showAnnualEvaluationNote ? (
            <p className="rounded-md border border-border/60 bg-background/80 px-3 py-2 text-body text-muted-foreground">
              {homeState} asks families to do one nationally-normed diagnostic per year. We
              provide this for you, but make sure {studentName} participates in our diagnostic
              when the time comes!
            </p>
          ) : null}

          <p className="text-body text-muted-foreground">
            {HOME_STATE_COPY.studyInformationLead}
            {hsldaPath ? (
              <ExternalLink
                href={`https://hslda.org/legal/${hsldaPath}`}
                className="font-semibold text-[#32325d] underline underline-offset-4 hover:text-[#f5713c]"
              >
                {HOME_STATE_COPY.studyInformationLink}
              </ExternalLink>
            ) : (
              <span className="font-semibold text-foreground">
                {HOME_STATE_COPY.studyInformationLink}
              </span>
            )}
          </p>

          <div className="space-y-3 border-t border-border/60 pt-4">
            <p className="text-label font-medium text-foreground">
              {HOME_STATE_COPY.paperworkPrompt}
            </p>
            <div className="flex flex-wrap gap-3">
              <ChoiceButton
                selected={paperworkYesSelected}
                disabled={readOnly}
                onClick={handlePaperworkYes}
              >
                {HOME_STATE_COPY.paperworkYes}
              </ChoiceButton>
              <ChoiceButton
                selected={paperworkNoSelected}
                disabled={readOnly}
                onClick={handlePaperworkNo}
              >
                {HOME_STATE_COPY.paperworkNo}
              </ChoiceButton>
            </div>
          </div>
        </fieldset>
      ) : null}

      {showFloridaVaccineSection ? (
        <div className="space-y-4">
          <div className="space-y-1 text-body text-muted-foreground">
            {HOME_STATE_COPY.floridaImmunization.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          <p className="text-label font-medium text-foreground">
            {HOME_STATE_COPY.vaccineSituationPrompt}
          </p>

          <div className="grid gap-3 md:grid-cols-3">
            <SituationCard
              title={HOME_STATE_COPY.vaccineConfirmingTitle}
              detail={HOME_STATE_COPY.vaccineConfirmingDetail}
              selected={vaccineValue === VACCINE_CONFIRMING}
              disabled={readOnly}
              onClick={handleVaccineConfirming}
            />
            <SituationCard
              title={HOME_STATE_COPY.vaccinePendingTitle}
              detail={HOME_STATE_COPY.vaccinePendingDetail}
              selected={vaccineValue === VACCINE_PENDING}
              disabled={readOnly}
              onClick={handleVaccinePending}
            />
            <SituationCard
              title={HOME_STATE_COPY.vaccineExemptionTitle}
              detail={HOME_STATE_COPY.vaccineExemptionDetail}
              selected={showExemptionInput}
              disabled={readOnly}
              onClick={handleVaccineExemption}
            />
          </div>

          {showExemptionInput ? (
            <FormTextarea
              id="vaccine_situation"
              label={HOME_STATE_COPY.vaccineSituationFieldLabel}
              value={vaccineValue}
              disabled={readOnly}
              onChange={(value) => onChange("vaccine_situation", value)}
            />
          ) : null}
        </div>
      ) : null}

      {showFloridaStepUpSection ? (
        <div className="space-y-3">
          <p className="text-label font-medium text-foreground">
            {HOME_STATE_COPY.stepUpQuestion}
          </p>
          <div className="flex flex-wrap gap-3">
            <ChoiceButton
              selected={submitStepUp}
              disabled={readOnly}
              onClick={handleStepUpYes}
            >
              {HOME_STATE_COPY.stepUpYes}
            </ChoiceButton>
            <ChoiceButton
              selected={stepUpDeclined}
              disabled={readOnly}
              onClick={handleStepUpNo}
            >
              {HOME_STATE_COPY.stepUpNo}
            </ChoiceButton>
          </div>

          {submitStepUp ? (
            <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
              <FormTextInput
                id="step_up_id"
                label={HOME_STATE_COPY.stepUpIdLabel}
                value={readString(values.step_up_id)}
                disabled={readOnly}
                onChange={(value) => onChange("step_up_id", value)}
              />
              <FormTextInput
                id="student_award_id"
                label={HOME_STATE_COPY.studentAwardIdLabel}
                value={readString(values.student_award_id)}
                disabled={readOnly}
                onChange={(value) => onChange("student_award_id", value)}
              />
              <FormCheckbox
                id="submit_step_up"
                label={HOME_STATE_COPY.submitStepUpLabel}
                checked={submitStepUp}
                disabled={readOnly}
                onChange={(checked) => onChange("submit_step_up", checked)}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
