import { describe, expect, it } from "vitest";

import {
  TOS_GUIDED_STUDY_BULLET,
  TOS_HIGHLIGHT_BULLETS,
  TOS_INTRO,
  TOS_PARENT_NAME_LABEL,
  TOS_PRIVACY_URL,
  TOS_SIGN_BUTTON_LABEL,
  TOS_SUMMER_BULLET,
  TOS_TITLE,
} from "@/modules/tos/tos-copy";

describe("tos copy", () => {
  it("matches the live signed-sheet highlight language", () => {
    expect(TOS_TITLE).toBe("Terms of Service");
    expect(TOS_INTRO).toBe("Please review our terms of service");
    expect(TOS_PARENT_NAME_LABEL).toBe("Parent Name");
    expect(TOS_SIGN_BUTTON_LABEL).toBe("Sign");
    expect(TOS_PRIVACY_URL).toBe("https://am.brilliantgrades.com/privacy");
    expect(TOS_HIGHLIGHT_BULLETS[0]).toContain("accuracy of all the information");
    expect(TOS_HIGHLIGHT_BULLETS.join(" ")).toContain("starting price appear in the table");
    expect(TOS_HIGHLIGHT_BULLETS.join(" ")).toContain("fifteenth (15th)");
    expect(TOS_HIGHLIGHT_BULLETS.join(" ")).not.toContain("$690/month");
    expect(TOS_HIGHLIGHT_BULLETS.join(" ")).not.toContain("$650/month");
    expect(TOS_GUIDED_STUDY_BULLET).not.toContain("$385");
    expect(TOS_SUMMER_BULLET).toContain("non-refundable");
    expect(TOS_SUMMER_BULLET).not.toContain("$385");
  });
});
