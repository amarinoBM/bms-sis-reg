import { describe, expect, it } from "vitest";

import { normalizeStudentNameParam } from "@/server/auth/require-parent-session";

describe("normalizeStudentNameParam", () => {
  it("trims spaces and decodes percent-encoded spaces", () => {
    expect(normalizeStudentNameParam(" Test%20Noah ")).toBe("Test Noah");
  });

  it("returns undefined for empty values", () => {
    expect(normalizeStudentNameParam("   ")).toBeUndefined();
    expect(normalizeStudentNameParam(undefined)).toBeUndefined();
  });
});
