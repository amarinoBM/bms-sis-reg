import { describe, expect, it } from "vitest";

import {
  buildStepCompletionMap,
  getMainProgressStatuses,
  isStepComplete,
} from "@/modules/wizard/progress";
import { INITIAL_ACTIVE_STEP, getNextStepId, getPreviousStepId, getWizardStepLabel } from "@/modules/wizard/steps";

describe("wizard progress", () => {
  it("marks disabled flags and honor/TOS completion", () => {
    const completion = buildStepCompletionMap({
      "1disabled": true,
      "6.1disabled": true,
      honorCodeSigned: "Completed",
      ToSBool: true,
    });

    expect(isStepComplete("1", completion)).toBe(true);
    expect(isStepComplete("9", completion)).toBe(true);
    expect(isStepComplete("12", completion)).toBe(true);
    expect(isStepComplete("13", completion)).toBe(true);
    expect(isStepComplete("4", completion)).toBe(false);
  });

  it("highlights the active main step", () => {
    const statuses = getMainProgressStatuses(INITIAL_ACTIVE_STEP, { "1": true });

    expect(statuses[0].state).toBe("current");
    expect(statuses[1].state).toBe("upcoming");
  });

  it("marks saved main parts complete even when viewing an earlier section", () => {
    const statuses = getMainProgressStatuses("5", { "12": true, "13": true });

    expect(statuses.find((step) => step.number === 9)?.state).toBe("complete");
    expect(statuses.find((step) => step.number === 10)?.state).toBe("complete");
    expect(statuses.find((step) => step.number === 3)?.state).toBe("current");
  });

  it("returns the next wizard step in order", () => {
    expect(getNextStepId("1")).toBe("2");
    expect(getNextStepId("8")).toBe("9");
    expect(getNextStepId("11")).toBe("12");
    expect(getWizardStepLabel("2")).toBe("Parent contact");
    expect(getNextStepId("14")).toBeNull();
    expect(getPreviousStepId("2")).toBe("1");
    expect(getPreviousStepId("1")).toBeNull();
  });
});
