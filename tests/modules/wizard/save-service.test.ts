import { describe, expect, it } from "vitest";

import { buildDriveFileUrl, UPLOAD_FIELD_MAP } from "@/modules/uploads/upload-config";
import { expandVirtualFormFields } from "@/modules/wizard/field-normalization";
import { buildStepSavePayload } from "@/modules/wizard/save-service";
import { unflattenFormValues } from "@/modules/wizard/step-schemas";

describe("wizard save-service", () => {
  it("records section completion in persisted save history", () => {
    const payload = buildStepSavePayload(
      "save1",
      { student_last_name: "Moore" },
      { student_last_name: "Bennett" },
    );

    expect(payload["1disabled"]).toBeUndefined();
    expect(payload.student_last_name).toBe("Moore");
    expect(payload.UpdateHistory).toEqual([
      expect.objectContaining({ step: "save1", fields: ["student_last_name"] }),
    ]);
  });

  it("rejects empty diffs", () => {
    expect(() =>
      buildStepSavePayload("save2", { most_interested_in: "math" }, {
        most_interested_in: "math",
        UpdateHistory: [{ step: "save2", at: 1, fields: ["most_interested_in"] }],
      }),
    ).toThrow();
  });

  it("can finish a section after a document-only change", () => {
    const fields = { uploadTranscript: "I can upload them", transcriptFiles: ["https://drive.google.com/file/d/already-uploaded/view"] };
    const payload = buildStepSavePayload("save6.1", fields, fields);
    expect(payload["6.1disabled"]).toBeUndefined();
    expect(payload.transcriptFiles).toEqual(fields.transcriptFiles);
    expect(payload.UpdateHistory).toEqual([
      expect.objectContaining({ step: "save6.1", fields: ["section_completion"] }),
    ]);
  });

  it("keeps the prior school records email in save6.1 payloads", () => {
    const payload = buildStepSavePayload(
      "save6.1",
      {
        uploadTranscript: "I prefer you source them from the school ($50 processing fee)",
        student_last_school_contact_email: "records@example.org",
      },
      {},
    );

    expect(payload.student_last_school_contact_email).toBe("records@example.org");
  });

  it("trims the prior school records email during save6.1 normalization", () => {
    expect(
      expandVirtualFormFields("save6.1", {
        uploadTranscript: "I prefer you source them from the school ($50 processing fee)",
        student_last_school_contact_email: "  records@example.org  ",
      }).student_last_school_contact_email,
    ).toBe("records@example.org");
  });

  it("does not add an absent prior school records email to upload saves", () => {
    expect(
      expandVirtualFormFields("save6.1", {
        uploadTranscript: "I can upload them",
      }),
    ).not.toHaveProperty("student_last_school_contact_email");
  });

  it("still rejects an empty or unrelated save request", () => {
    expect(() => buildStepSavePayload("save6.1", {}, {})).toThrow();
    expect(() => buildStepSavePayload("save6.1", { unrelated: true }, {})).toThrow();
  });
});

describe("step-schemas unflatten", () => {
  it("rebuilds secondary guardian object", () => {
    const result = unflattenFormValues({
      parent_name: "James",
      "secondary_guardian.parent_email": "test@example.com",
    });

    expect(result.parent_name).toBe("James");
    expect(result.secondary_guardian).toEqual({ parent_email: "test@example.com" });
  });
});

describe("upload config", () => {
  it("maps birth cert uploads to studentBirthCert", () => {
    expect(UPLOAD_FIELD_MAP.birth_cert.fieldKey).toBe("studentBirthCert");
    expect(UPLOAD_FIELD_MAP.immunization.fieldKey).toBe("immunizationFiles");
    expect(buildDriveFileUrl("abc123")).toContain("abc123");
  });
});
