import { describe, expect, it } from "vitest";

import { maskEmail } from "@/lib/mask-email";

describe("maskEmail", () => {
  it("keeps first and last local characters", () => {
    expect(maskEmail("james@example.com")).toBe("j***s@example.com");
  });

  it("masks a single-character local part", () => {
    expect(maskEmail("a@example.com")).toBe("a***@example.com");
  });
});
