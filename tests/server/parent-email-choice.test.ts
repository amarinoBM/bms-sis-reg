import { beforeEach, describe, expect, it, vi } from "vitest";

import { findPreferredParentEmails } from "@/modules/students/repository";
import {
  findParentEmailOptions,
  resolveParentEmailChoice,
} from "@/server/auth/parent-email-choice";

vi.mock("@/modules/students/repository", () => ({
  findPreferredParentEmails: vi.fn(),
}));

const findEmails = vi.mocked(findPreferredParentEmails);

describe("protected parent email choices", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_SECRET", "test-parent-email-choice-secret-32-chars!!");
    findEmails.mockReset();
  });

  it("returns one masked option without exposing its raw address", async () => {
    findEmails.mockResolvedValue(["parent@example.test"]);

    const options = await findParentEmailOptions("lead_one");

    expect(options).toEqual([
      {
        maskedEmail: "p****t@example.test",
        choiceToken: expect.stringMatching(/^[a-f0-9]{64}$/),
      },
    ]);
    expect(JSON.stringify(options)).not.toContain("parent@example.test");
  });

  it("returns distinct opaque choices when the family has two addresses", async () => {
    findEmails.mockResolvedValue(["first@example.test", "second@example.test"]);

    const options = await findParentEmailOptions("lead_two");

    expect(options.map((option) => option.maskedEmail)).toEqual([
      "f***t@example.test",
      "s****d@example.test",
    ]);
    expect(new Set(options.map((option) => option.choiceToken))).toHaveLength(2);
    expect(JSON.stringify(options)).not.toContain("first@example.test");
    expect(JSON.stringify(options)).not.toContain("second@example.test");
  });

  it("makes colliding masked addresses distinguishable without revealing either address", async () => {
    findEmails.mockResolvedValue(["john@example.test", "joan@example.test"]);

    const options = await findParentEmailOptions("lead_two");

    expect(options.map((option) => option.maskedEmail)).toEqual([
      "joh*@example.test",
      "joa*@example.test",
    ]);
    expect(new Set(options.map((option) => option.maskedEmail))).toHaveLength(2);
    expect(JSON.stringify(options)).not.toContain("john@example.test");
    expect(JSON.stringify(options)).not.toContain("joan@example.test");
  });

  it("keeps the one-email send path unchanged when no token is supplied", async () => {
    findEmails.mockResolvedValue(["parent@example.test"]);

    await expect(resolveParentEmailChoice("lead_one")).resolves.toBe(
      "parent@example.test",
    );
  });

  it("requires a valid choice when multiple addresses are currently available", async () => {
    findEmails.mockResolvedValue(["first@example.test", "second@example.test"]);

    await expect(resolveParentEmailChoice("lead_two")).rejects.toMatchObject({
      code: "INVALID_INPUT",
      message: expect.stringContaining("email address"),
    });
    await expect(resolveParentEmailChoice("lead_two", "not-a-token")).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });
  });

  it("re-fetches current addresses and resolves only a current matching token", async () => {
    findEmails.mockResolvedValue(["first@example.test", "second@example.test"]);
    const options = await findParentEmailOptions("lead_two");

    findEmails.mockResolvedValue(["first@example.test", "changed@example.test"]);

    await expect(
      resolveParentEmailChoice("lead_two", options[0].choiceToken),
    ).resolves.toBe("first@example.test");
    await expect(
      resolveParentEmailChoice("lead_two", options[1].choiceToken),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
    expect(findEmails).toHaveBeenCalledTimes(3);
  });
});
