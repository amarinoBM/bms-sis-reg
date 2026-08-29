import { describe, expect, it } from "vitest";

import { HOME_STATE_COPY } from "@/modules/wizard/home-state-copy";

describe("home state copy", () => {
  it("places the student name naturally in the travel guidance", () => {
    expect(`${HOME_STATE_COPY.travelLead}Noah${HOME_STATE_COPY.travelTail}`).toBe(
      "If you often travel, select the state where Noah will spend most of their time this academic year.",
    );
  });
});
