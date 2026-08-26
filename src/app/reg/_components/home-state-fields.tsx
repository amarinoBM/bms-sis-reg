"use client";

import { useEffect, useState, type ReactNode } from "react";

import {
  FormCheckbox,
  FormTextarea,
  FormTextInput,
} from "@/app/reg/_components/form-fields";
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
  onChange: (key: string, value: unknown) => void;
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
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function RequirementCard({
  primaryLine,
  linkUrl,
  linkLabel,
}: {
  primaryLine: string;
  linkUrl?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex gap-3 rounded-md border border-border bg-[#fdf6f3] px-3 py-2">
      <div className="mt-1 size-3 shrink-0 rounded-sm bg-[#f5713c]" aria-hidden />
      <div className="text-body text-foreground">
        {linkUrl ? (
          <a
            href={linkUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-[#32325d] underline-offset-4 hover:underline"
          >
            {linkLabel ?? primaryLine}
          </a>
        ) : (
          <p>{primaryLine}</p>
        )}
      </div>
    </div>
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
      onClick={onClick}
      className={cn(
        "rounded-md border px-4 py-3 text-left transition-colors",
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
  onChange,
}: HomeStateFieldsProps) {
  const homeState = readString(values.home_state);
  const paperworkYesSelected =
    readString(values.determining_required_paperwork_home_state) === PAPERWORK_SUPPORT_YES;
  const paperworkNoSelected =
    readString(values.determining_required_paperwork_home_state) === PAPERWORK_SUPPORT_NO;
  const vaccineValue = readString(values.vaccine_situation);
  const submitStepUp = readBoolean(values.submit_step_up);

  const [stateReg, setStateReg] = useState<StateRegDto | null>(null);
  const [loadingStateReg, setLoadingStateReg] = useState(false);
  const [stateRegError, setStateRegError] = useState<string | null>(null);
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
  }, [homeState]);

  useEffect(() => {
    setShowExemptionInput(isCustomVaccineSituation(vaccineValue));
  }, [vaccineValue]);

  function handleHomeStateChange(value: string) {
    onChange("home_state", value);
    onChange("determining_required_paperwork_home_state", "");
    onChange("vaccine_situation", "");
    onChange("submit_step_up", false);
    onChange("step_up_id", "");
    onChange("student_award_id", "");
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
      <div className="space-y-2">
        <p className="text-body text-muted-foreground">{HOME_STATE_COPY.intro}</p>
        <p className="text-label text-[#537fb4]">
          {HOME_STATE_COPY.travelLead}
          <span className="font-medium text-foreground">{studentName}</span>
          {HOME_STATE_COPY.travelTail}
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="home_state" className="text-label font-medium text-foreground">
          {HOME_STATE_COPY.fieldLabel}
        </label>
        <select
          id="home_state"
          value={homeState}
          disabled={readOnly}
          onChange={(event) => handleHomeStateChange(event.target.value)}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-body",
            readOnly && "cursor-not-allowed opacity-60",
          )}
        >
          <option value="">Select a state</option>
          {US_STATE_OPTIONS.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </div>

      {loadingStateReg ? (
        <div className="flex items-center gap-2 text-body text-muted-foreground">
          <RegSpinner className="size-4" />
          Loading state requirements…
        </div>
      ) : null}

      {stateRegError ? (
        <p className="text-body text-destructive">{stateRegError}</p>
      ) : null}

      {showRequirementsPanel && stateReg ? (
        <div className="space-y-4">
          <p className="text-label font-medium text-foreground">
            {HOME_STATE_COPY.requirementsHeading}
          </p>

          <div className="space-y-2">
            {stateReg.requirementDisplays.map((display) => (
              <RequirementCard
                key={display.primaryLine}
                primaryLine={display.primaryLine}
                linkUrl={display.linkUrl}
                linkLabel={display.linkLabel}
              />
            ))}
          </div>

          {stateReg.showAnnualEvaluationNote ? (
            <p className="text-body text-muted-foreground">
              {homeState} asks families to do one nationally-normed diagnostic per year. We
              provide this for you, but make sure {studentName} participates in our diagnostic
              when the time comes!
            </p>
          ) : null}

          <p className="text-body text-muted-foreground">
            {HOME_STATE_COPY.studyInformationLead}
            <a
              href={hsldaPath ? `https://hslda.org/legal/${hsldaPath}` : undefined}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[#32325d] underline-offset-4 hover:underline"
            >
              {HOME_STATE_COPY.studyInformationLink}
            </a>
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
              selected={!submitStepUp && homeState.length > 0}
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
