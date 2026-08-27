import { describe, expect, it } from "vitest";

import { buildDriveAllowAccessBody, normalizeDriveFileId } from "@/server/connectors/backendless/sis-cloud-code";

describe("buildDriveAllowAccessBody", () => {
  it("returns the raw file id for a single JSON.stringify in invokeCloudCode", () => {
    const fileId = "1qmisFS-4gjOVe8NV1pNckSjlQsPOW8NFhZya3TvVvy4";
    expect(buildDriveAllowAccessBody(fileId)).toBe(fileId);
    expect(JSON.stringify(buildDriveAllowAccessBody(fileId))).toBe(JSON.stringify(fileId));
  });

  it("strips accidental quote wrapping from copied ids", () => {
    expect(normalizeDriveFileId('"abc123"')).toBe("abc123");
  });
});
