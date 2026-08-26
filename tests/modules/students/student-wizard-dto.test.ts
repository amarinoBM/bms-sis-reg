import { describe, expect, it } from "vitest";

import {
  collectLeadParentEmails,
  isEmailAllowedForLead,
  stripStudentForClient,
} from "@/modules/students/student-wizard-dto";

describe("student wizard dto", () => {
  it("strips sensitive and internal fields", () => {
    const stripped = stripStudentForClient({
      student_name: "Noah",
      studentMSPassword: "secret",
      studentMSEmail: "noah@bms.family",
      UpdateHistory: [{ step: "save1" }],
      parent_email: "parent@example.com",
    });

    expect(stripped.student_name).toBe("Noah");
    expect(stripped.parent_email).toBe("parent@example.com");
    expect(stripped.studentMSPassword).toBeUndefined();
    expect(stripped.studentMSEmail).toBeUndefined();
    expect(stripped.UpdateHistory).toBeUndefined();
  });

  it("matches parent email case-insensitively", () => {
    const allowed = collectLeadParentEmails([
      { parent_email: "Parent@Example.com" },
    ]);

    expect(isEmailAllowedForLead("parent@example.com", allowed)).toBe(true);
    expect(isEmailAllowedForLead("other@example.com", allowed)).toBe(false);
  });
});
