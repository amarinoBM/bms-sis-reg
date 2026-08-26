import { describe, expect, it } from "vitest";

import { formatStateRequirementDisplays } from "@/modules/state-regs/requirement-display";
import type { StateRegRecord } from "@/modules/state-regs/types";

describe("formatStateRequirementDisplays", () => {
  it("formats live UI requirement card lines", () => {
    const reg: StateRegRecord = {
      State_Name: "North-Carolina",
      Notice_of_Intent: true,
      Maintain_a_portfolio: true,
      Annual_Evaluation: true,
      Minimum_number_of_hours: "180 days",
      Comments: "this is a state specific policy",
      Subject_Requirements: "English, grammar, orthography",
      url: "https://hslda.org/legal/North-Carolina",
    };

    const displays = formatStateRequirementDisplays(reg);

    expect(displays.map((item) => item.primaryLine)).toEqual([
      "Notice of Intent",
      "Maintain a Portfolio",
      "Annual Evaluation",
      "Minimum number of hours: 180 days",
      "Comments - this is a state specific policy",
      "Subject Requirements - English, grammar, orthography",
      "State Requirements website here",
    ]);
    expect(displays.at(-1)?.linkLabel).toBe("State Requirements website here");
  });
});
