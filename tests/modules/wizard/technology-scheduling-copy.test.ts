import { describe, expect, it } from "vitest";

import {
  computerSystemLabel,
  LENGTH_OF_STAYING_HINT,
  lengthOfStayingLabel,
  startingDateLabel,
  technologySchedulingStepDescription,
} from "@/modules/wizard/technology-scheduling-copy";

describe("technology-scheduling copy", () => {
  it("interpolates student name in field labels", () => {
    expect(technologySchedulingStepDescription("Josiah")).toContain("Josiah");
    expect(computerSystemLabel("Josiah")).toBe("What computer system will Josiah be using?");
    expect(startingDateLabel("Josiah")).toBe("When will Josiah start?");
    expect(lengthOfStayingLabel("Josiah")).toContain("Josiah");
  });

  it("includes calendar guidance for length of stay", () => {
    expect(LENGTH_OF_STAYING_HINT).toContain("late June");
    expect(LENGTH_OF_STAYING_HINT).toContain("early August");
  });
});
