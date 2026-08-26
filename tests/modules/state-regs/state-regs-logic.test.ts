import { describe, expect, it } from "vitest";

import {
  buildStateRequirementItems,
  isCustomVaccineSituation,
  PAPERWORK_SUPPORT_YES,
  shouldShowFloridaVaccineSection,
  shouldShowStateRequirementsPanel,
  stateNameForBackendlessQuery,
  toStateRegDto,
  VACCINE_CONFIRMING,
  VACCINE_PENDING,
} from "@/modules/state-regs/state-regs-logic";
import type { StateRegRecord } from "@/modules/state-regs/types";

function baseReg(overrides: Partial<StateRegRecord> = {}): StateRegRecord {
  return {
    State_Name: "Colorado",
    enrollment_type: "home",
    Difficulty: "medium",
    ...overrides,
  };
}

describe("stateNameForBackendlessQuery", () => {
  it("replaces spaces with hyphens", () => {
    expect(stateNameForBackendlessQuery("New Jersey")).toBe("New-Jersey");
  });
});

describe("shouldShowStateRequirementsPanel", () => {
  it("hides Alabama, private enrollment, and easy difficulty", () => {
    expect(shouldShowStateRequirementsPanel(baseReg({ State_Name: "Alabama" }))).toBe(false);
    expect(
      shouldShowStateRequirementsPanel(baseReg({ enrollment_type: "private" })),
    ).toBe(false);
    expect(
      shouldShowStateRequirementsPanel(baseReg({ Difficulty: "easy" })),
    ).toBe(false);
  });

  it("shows typical homeschool states", () => {
    expect(shouldShowStateRequirementsPanel(baseReg())).toBe(true);
  });
});

describe("buildStateRequirementItems", () => {
  it("maps boolean requirements and text fields", () => {
    const items = buildStateRequirementItems(
      baseReg({
        Affidavit: true,
        Minimum_number_of_hours: "175 days",
        url: "https://hslda.org/legal/Colorado",
      }),
    );

    expect(items.map((item) => item.label)).toEqual([
      "Affidavit",
      "Minimum number of hours: 175 days",
      "State Requirements website here",
    ]);
    expect(items[1]?.label).toBe("Minimum number of hours: 175 days");
    expect(items[2]?.detail).toBe("https://hslda.org/legal/Colorado");
  });
});

describe("toStateRegDto", () => {
  it("flags annual evaluation guidance", () => {
    const dto = toStateRegDto(baseReg({ Annual_Evaluation: true }));
    expect(dto.showAnnualEvaluationNote).toBe(true);
    expect(dto.showRequirementsPanel).toBe(true);
  });
});

describe("vaccine situation helpers", () => {
  it("detects preset vs custom vaccine values", () => {
    expect(isCustomVaccineSituation(VACCINE_CONFIRMING)).toBe(false);
    expect(isCustomVaccineSituation(VACCINE_PENDING)).toBe(false);
    expect(isCustomVaccineSituation("Religious exemption")).toBe(true);
    expect(isCustomVaccineSituation("")).toBe(false);
  });

  it("shows Florida-only sections for Florida home state", () => {
    expect(shouldShowFloridaVaccineSection("Florida")).toBe(true);
    expect(shouldShowFloridaVaccineSection("Colorado")).toBe(false);
  });
});

describe("paperwork constants", () => {
  it("matches legacy yesState/noState strings", () => {
    expect(PAPERWORK_SUPPORT_YES).toBe("I need support with local paperwork");
  });
});
