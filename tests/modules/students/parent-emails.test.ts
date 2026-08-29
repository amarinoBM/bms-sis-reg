import { describe, expect, it } from "vitest";

import {
  collectPreferredParentEmails,
  prepareParentEmailSaveFields,
  resolveParentEmailState,
} from "@/modules/students/parent-emails";

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

  it("falls back to the legacy email when the preferred value is invalid", () => {
    expect(
      collectPreferredParentEmails([
        { parent_email: "not an email", email: "fallback@example.test" },
      ]),
    ).toEqual(["fallback@example.test"]);
  });

  it.each([
    [{}, "missing", null],
    [{ parent_email: "parent@example.test" }, "parent_only", "parent@example.test"],
    [{ email: "legacy@example.test" }, "legacy_only", "legacy@example.test"],
    [
      { parent_email: "Parent@example.test", email: "parent@EXAMPLE.test" },
      "matching",
      "Parent@example.test",
    ],
    [
      { parent_email: "one@example.test", email: "two@example.test" },
      "different",
      "one@example.test",
    ],
  ] as const)("resolves %j as %s", (row, status, effectiveEmail) => {
    expect(resolveParentEmailState(row)).toMatchObject({ status, effectiveEmail });
  });

  it("prefills a missing parent email without trusting a submitted legacy email field", () => {
    expect(
      prepareParentEmailSaveFields(
        { parent_email: "legacy@example.test", email: "attacker@example.test" },
        { email: "legacy@example.test" },
      ),
    ).toEqual({ parent_email: "legacy@example.test" });
  });

  it("swaps differing stored addresses when the parent chooses the legacy address", () => {
    expect(
      prepareParentEmailSaveFields(
        { parent_email: "legacy@example.test", email: "legacy@example.test" },
        { parent_email: "current@example.test", email: "legacy@example.test" },
      ),
    ).toEqual({
      parent_email: "legacy@example.test",
      email: "current@example.test",
    });
  });
});
