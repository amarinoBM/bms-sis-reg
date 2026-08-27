import { describe, expect, it } from "vitest";

import { resolveStateRegsView } from "@/modules/state-regs/state-regs-load-view";

describe("resolveStateRegsView", () => {
  it("shows loading only for the state currently being fetched", () => {
    const view = resolveStateRegsView("Hawaii", {
      targetState: "Hawaii",
      status: "loading",
      data: null,
      error: null,
    });

    expect(view.isLoading).toBe(true);
    expect(view.stateReg).toBeNull();
    expect(view.error).toBeNull();
  });

  it("hides stale requirements when home state changes before fetch completes", () => {
    const view = resolveStateRegsView("Hawaii", {
      targetState: "Maine",
      status: "success",
      data: {
        stateName: "Maine",
        requirements: [],
        requirementDisplays: [],
        showRequirementsPanel: true,
        showAnnualEvaluationNote: false,
      },
      error: null,
    });

    expect(view.isLoading).toBe(false);
    expect(view.stateReg).toBeNull();
    expect(view.error).toBeNull();
  });

  it("returns requirements when the loaded state matches home state", () => {
    const stateReg = {
      stateName: "Maine",
      requirements: [],
      requirementDisplays: [{ primaryLine: "File notice" }],
      showRequirementsPanel: true,
      showAnnualEvaluationNote: false,
    };

    const view = resolveStateRegsView("Maine", {
      targetState: "Maine",
      status: "success",
      data: stateReg,
      error: null,
    });

    expect(view.stateReg).toEqual(stateReg);
  });

  it("returns empty view when no home state is selected", () => {
    expect(
      resolveStateRegsView("", {
        targetState: "",
        status: "idle",
        data: null,
        error: null,
      }),
    ).toEqual({
      isLoading: false,
      stateReg: null,
      error: null,
    });
  });
});
