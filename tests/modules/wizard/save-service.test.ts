import { describe, expect, it } from "vitest";

import { buildDriveFileUrl, UPLOAD_FIELD_MAP } from "@/modules/uploads/upload-config";
import { buildStepSavePayload } from "@/modules/wizard/save-service";
import { unflattenFormValues } from "@/modules/wizard/step-schemas";

describe("wizard save-service", () => {
  it("marks step disabled on save", () => {
    const payload = buildStepSavePayload(
      "save1",
      { student_last_name: "Moore" },
      { student_last_name: "Bennett" },
    );

    expect(payload["1disabled"]).toBe(true);
    expect(payload.student_last_name).toBe("Moore");
    expect(payload.changed_fields).toBe("student_last_name");
  });

  it("rejects empty diffs", () => {
    expect(() =>
      buildStepSavePayload("save2", { most_interested_in: "math" }, {
        most_interested_in: "math",
      }),
    ).toThrow();
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
    expect(buildDriveFileUrl("abc123")).toContain("abc123");
  });
});
