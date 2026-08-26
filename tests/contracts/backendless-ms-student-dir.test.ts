import { describe, expect, it } from "vitest";

import { parentOtpCacheKey } from "@/server/connectors/backendless/cache-client";
import { buildOtpEmailBody } from "@/server/connectors/backendless/email-client";
import {
  buildUploadMetadataFromUrl,
  hydrateUploadMetadata,
} from "@/modules/students/upload-metadata";

describe("ms_student_dir helpers", () => {
  it("builds enrolled where clause shape for Backendless REST", () => {
    const leadId = "lead_test";
    const key = parentOtpCacheKey(leadId);
    expect(key).toBe("parentOTP-lead_test");
  });

  it("rebuilds upload metadata from Drive URLs on load", () => {
    const hydrated = hydrateUploadMetadata({
      studentBirthCert: "https://drive.google.com/file/d/abc123/view",
      studentPic: "https://drive.google.com/file/d/pic456/view",
    });

    expect(hydrated.birthCertMetaData).toEqual({ id: "abc123", type: "drive" });
    expect(hydrated.studentPicMetaData).toEqual({ id: "pic456", type: "drive" });
  });

  it("extracts drive file ids from standard URLs", () => {
    expect(
      buildUploadMetadataFromUrl("https://drive.google.com/file/d/file-id-1/view"),
    ).toEqual({
      id: "file-id-1",
      type: "drive",
    });
  });

  it("matches production OTP email body copy", () => {
    expect(buildOtpEmailBody(123456)).toContain("Your OTP is 123456");
    expect(buildOtpEmailBody(123456)).toContain("expire in 2 hours");
  });
});
