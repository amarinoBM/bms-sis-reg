import { describe, expect, it } from "vitest";

import {
  filterInterestCategories,
  parseInterestOption,
} from "@/modules/wizard/interest-categories";

describe("interest categories", () => {
  it("parses category title and examples from legacy option strings", () => {
    const parsed = parseInterestOption(
      "Sports: Soccer, Basketball, Swimming, Tennis, Gymnastics, etc.",
    );

    expect(parsed.category).toBe("Sports");
    expect(parsed.examples).toContain("Soccer");
    expect(parsed.fullValue).toContain("Sports:");
  });

  it("filters categories by search query", () => {
    const matches = filterInterestCategories("technology");

    expect(matches.some((item) => item.category === "Technology and Computing")).toBe(true);
    expect(matches.some((item) => item.category === "Sports")).toBe(false);
  });
});
