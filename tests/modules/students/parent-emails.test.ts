import { describe, expect, it } from "vitest";

import { collectPreferredParentEmails } from "@/modules/students/parent-emails";

describe("parent email selection", () => {
  it("uses each student's parent email and only falls back to email when needed", () => {
    expect(
      collectPreferredParentEmails([
        { parent_email: " Parent@One.test ", email: "obsolete@one.test" },
        { parent_email: " ", email: "fallback@two.test" },
        { email: "third@three.test" },
      ]),
    ).toEqual(["Parent@One.test", "fallback@two.test", "third@three.test"]);
  });

  it("deduplicates preferred addresses case-insensitively and ignores unusable values", () => {
    expect(
      collectPreferredParentEmails([
        { parent_email: "Parent@Example.test" },
        { parent_email: " parent@example.TEST " },
        { parent_email: "sis:v1:encrypted", email: "fallback@example.test" },
        { parent_email: 42 as unknown as string, email: "" },
      ]),
    ).toEqual(["Parent@Example.test", "fallback@example.test"]);
  });
});
