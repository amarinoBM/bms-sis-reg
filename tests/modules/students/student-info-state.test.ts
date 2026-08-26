import { describe, expect, it } from "vitest";

import { buildStudentInfoState } from "@/modules/students/student-info-state";

describe("student info state", () => {
  it("sets chargebeeID from weekly slot and tracks disabled steps", () => {
    const state = buildStudentInfoState(
      "lead_test",
      {
        objectId: "obj-1",
        student_name: "Noah",
        "1disabled": true,
        "2disabled": true,
      },
      "chargebee_abc",
    );

    expect(state.chargebeeID).toBe("chargebee_abc");
    expect(state.studentName).toBe("Noah");
    expect(state.stepCompletion["1"]).toBe(true);
    expect(state.stepCompletion["2"]).toBe(true);
    expect(state.disabledSteps["1"]).toBe(true);
  });
});
