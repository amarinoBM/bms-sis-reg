import { describe, expect, it } from "vitest";

import { buildDriveAllowAccessBody } from "@/server/connectors/backendless/sis-cloud-code";

describe("buildDriveAllowAccessBody", () => {
  it("serializes the copied file id as a JSON string for uiBuilder", () => {
    const fileId = "1qmisFS-4gjOVe8NV1pNckSjlQsPOW8NFhZya3TvVvy4";
    expect(buildDriveAllowAccessBody(fileId)).toBe(JSON.stringify(fileId));
    expect(JSON.parse(buildDriveAllowAccessBody(fileId))).toBe(fileId);
  });
});
