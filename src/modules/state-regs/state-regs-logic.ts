import {
  FLORIDA_HOME_STATE,
  PAPERWORK_SUPPORT_NO,
  PAPERWORK_SUPPORT_YES,
  VACCINE_CONFIRMING,
  VACCINE_PENDING,
} from "@/modules/wizard/home-state-copy";

import { formatStateRequirementDisplays } from "./requirement-display";
import type { StateRegRecord, StateRequirementItem, StateRegDto } from "./types";

export {
  FLORIDA_HOME_STATE,
  PAPERWORK_SUPPORT_NO,
  PAPERWORK_SUPPORT_YES,
  VACCINE_CONFIRMING,
  VACCINE_PENDING,
};

export function stateNameForBackendlessQuery(stateName: string): string {
  return stateName.trim().replace(/ /g, "-");
}

export function shouldShowStateRequirementsPanel(reg: StateRegRecord): boolean {
  if (reg.State_Name === "Alabama") {
    return false;
  }

  if (reg.enrollment_type === "private") {
    return false;
  }

  const difficulty = reg.Difficulty?.toLowerCase();
  if (difficulty === "easy") {
    return false;
  }

  return true;
}

export function buildStateRequirementItems(reg: StateRegRecord): StateRequirementItem[] {
  return formatStateRequirementDisplays(reg).map((display) => ({
    label: display.primaryLine,
    detail: display.linkUrl,
  }));
}

export function toStateRegDto(reg: StateRegRecord): StateRegDto {
  const showRequirementsPanel = shouldShowStateRequirementsPanel(reg);

  const requirementDisplays = formatStateRequirementDisplays(reg);

  return {
    stateName: reg.State_Name,
    abbreviation: reg.Abbreviation,
    enrollmentType: reg.enrollment_type,
    difficulty: reg.Difficulty,
    minimumHours: reg.Minimum_number_of_hours,
    comments: reg.Comments,
    subjectRequirements: reg.Subject_Requirements,
    url: reg.url,
    requirements: buildStateRequirementItems(reg),
    requirementDisplays,
    showRequirementsPanel,
    showAnnualEvaluationNote: Boolean(reg.Annual_Evaluation),
  };
}

export function isCustomVaccineSituation(value: unknown): boolean {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) {
    return false;
  }

  return text !== VACCINE_CONFIRMING && text !== VACCINE_PENDING;
}

export function shouldShowFloridaVaccineSection(homeState: unknown): boolean {
  return typeof homeState === "string" && homeState.trim() === FLORIDA_HOME_STATE;
}

export function shouldShowFloridaStepUpSection(homeState: unknown): boolean {
  return shouldShowFloridaVaccineSection(homeState);
}
