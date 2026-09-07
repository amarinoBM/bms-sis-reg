import { describe, expect, it } from "vitest";

import { createRegistrationDemo } from "@/modules/demo/registration-demo";
import { WIZARD_STEPS } from "@/modules/wizard/steps";

describe("registration demo", () => {
  it("uses synthetic data and marks every section ready to browse", () => {
    const demo = createRegistrationDemo();

    expect(demo.studentInfo.leadId).toBe("demo-family");
    expect(demo.studentInfo.studentName).toBe("Alex Example");
    expect(demo.enrolledStudents).toEqual([
      { objectId: "demo-student", studentName: "Alex Example" },
    ]);
    expect(
      WIZARD_STEPS.every((step) => demo.studentInfo.stepCompletion[step.id] === true),
    ).toBe(true);
    expect(demo.student).not.toHaveProperty("studentMSPassword");
    expect(demo.student).not.toHaveProperty("UpdateHistory");
    expect(String(demo.student.lead_id)).not.toMatch(/^lead_[a-z0-9]+$/i);
  });
});
