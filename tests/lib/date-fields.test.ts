import { describe, expect, it } from "vitest";

import { fromDateInputValue, toDateInputValue } from "@/lib/date-fields";

describe("date-fields", () => {
  it("formats epoch ms using local calendar date", () => {
    const local = new Date(2015, 2, 15).getTime();
    expect(toDateInputValue(local)).toBe("2015-03-15");
  });

  it("accepts YYYY-MM-DD strings from the backend", () => {
    expect(toDateInputValue("2015-03-15")).toBe("2015-03-15");
  });

  it("parses date input values at local midnight", () => {
    const ms = fromDateInputValue("2015-03-15");
    expect(ms).not.toBeNull();

    const date = new Date(ms as number);
    expect(date.getFullYear()).toBe(2015);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(15);
  });

  it("round-trips through the date input value", () => {
    const ms = fromDateInputValue("2020-07-04");
    expect(toDateInputValue(ms)).toBe("2020-07-04");
  });

  it("returns empty string for unsupported values", () => {
    expect(toDateInputValue(null)).toBe("");
    expect(toDateInputValue("not-a-date")).toBe("");
  });
});
