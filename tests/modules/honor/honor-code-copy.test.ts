import { describe, expect, it } from "vitest";

import {
  HONOR_CODE_BODY,
  HONOR_CODE_TITLE,
  HONOR_PARENT_NAME_LABEL,
  HONOR_SIGN_BUTTON_LABEL,
  HONOR_STUDENT_NAME_LABEL,
} from "@/modules/honor/honor-code-copy";

describe("honor code copy", () => {
  it("matches legacy honor code strings", () => {
    expect(HONOR_CODE_TITLE).toBe("BMS Honor Code");
    expect(HONOR_CODE_BODY).toContain("honor code that sets expectations");
    expect(HONOR_PARENT_NAME_LABEL).toBe("Parent's Full Name");
    expect(HONOR_STUDENT_NAME_LABEL).toBe("Student's Full Name");
    expect(HONOR_SIGN_BUTTON_LABEL).toBe("Sign");
  });
});
