import { describe, expect, it } from "vitest";

import {
  buildStepCompletionMap,
  getMainProgressStatuses,
  isStepComplete,
} from "@/modules/wizard/progress";
import { INITIAL_ACTIVE_STEP } from "@/modules/wizard/steps";

describe("wizard progress", () => {
  it("marks disabled flags and honor/TOS completion", () => {
    const completion = buildStepCompletionMap({
      "1disabled": true,
      "6.1disabled": true,
      honorCodeSigned: "Completed",
      ToSBool: true,
    });

    expect(isStepComplete("1", completion)).toBe(true);
    expect(isStepComplete("6.1", completion)).toBe(true);
    expect(isStepComplete("10", completion)).toBe(true);
    expect(isStepComplete("11", completion)).toBe(true);
    expect(isStepComplete("2", completion)).toBe(false);
  });

  it("highlights the active main step", () => {
    const statuses = getMainProgressStatuses(INITIAL_ACTIVE_STEP, { "1": true });

    expect(statuses[0].state).toBe("current");
    expect(statuses[1].state).toBe("upcoming");
  });
});
