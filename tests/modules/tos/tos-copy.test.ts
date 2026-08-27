import { describe, expect, it } from "vitest";

import {
  TOS_HIGHLIGHT_BULLETS,
  TOS_INTRO,
  TOS_PARENT_NAME_LABEL,
  TOS_PRIVACY_URL,
  TOS_SIGN_BUTTON_LABEL,
  TOS_TITLE,
} from "@/modules/tos/tos-copy";

describe("tos copy", () => {
  it("matches legacy Clever terms of service strings", () => {
    expect(TOS_TITLE).toBe("Terms of Service");
    expect(TOS_INTRO).toBe("Please review our terms of service");
    expect(TOS_PARENT_NAME_LABEL).toBe("Parent Name");
    expect(TOS_SIGN_BUTTON_LABEL).toBe("Sign");
    expect(TOS_PRIVACY_URL).toBe("https://am.brilliantgrades.com/privacy");
    expect(TOS_HIGHLIGHT_BULLETS[0]).toContain("accuracy of all the information");
    expect(TOS_HIGHLIGHT_BULLETS[3]).toContain("$690/month (Gen Ed Program)");
  });
});
