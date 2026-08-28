import { describe, expect, it } from "vitest";
import { buildStudentInfoState } from "@/modules/students/student-info-state";
import { hydrateUploadMetadata } from "@/modules/students/upload-metadata";
import { TRANSCRIPT_DELIVERY_SCHOOL, TRANSCRIPT_DELIVERY_UPLOAD } from "@/modules/wizard/transcript-fields";
import { preserveDocumentFields, withAdminDocumentLinks } from "@/server/admin/registrations";

const legacy = "https://drive.google.com/file/d/legacy-file-id/view";
const existing = "https://drive.google.com/file/d/existing-file-id/view";

describe("admin document preservation", () => {
  it.each([TRANSCRIPT_DELIVERY_UPLOAD, TRANSCRIPT_DELIVERY_SCHOOL])("retains and deduplicates trusted legacy files for %s", (choice) => {
    const current = { uploadTranscript: legacy, transcriptFiles: [existing, legacy] };
    const result = preserveDocumentFields({ uploadTranscript: choice, transcriptFiles: ["/api/admin/document?forged"] }, current);
    expect(result).toEqual({ uploadTranscript: choice, transcriptFiles: [existing, legacy] });
    expect(current).toEqual({ uploadTranscript: legacy, transcriptFiles: [existing, legacy] });
  });

  it("keeps the legacy document even when the client omits transcriptFiles", () => {
    expect(preserveDocumentFields({ uploadTranscript: TRANSCRIPT_DELIVERY_UPLOAD }, { uploadTranscript: legacy }))
      .toEqual({ uploadTranscript: TRANSCRIPT_DELIVERY_UPLOAD, transcriptFiles: [legacy] });
  });

  it.each(["/api/admin/document?forged", "https://drive.google.com/file/d/forged/view", "https://evil.test/file"])("never stores a client-supplied legacy document location: %s", (value) => {
    expect(preserveDocumentFields({ uploadTranscript: value }, { uploadTranscript: legacy })).toEqual({ uploadTranscript: legacy });
    expect(preserveDocumentFields({ uploadTranscript: value }, {})).toEqual({});
  });

  it("strips upload metadata and exposes only guarded document links", () => {
    const student = hydrateUploadMetadata({
      objectId: "student-test", student_name: "Synthetic", studentBirthCert: existing,
      studentPic: existing, upload_student_curreny_learning: existing,
      uploadTranscript: legacy, transcriptFiles: [legacy],
      customUploadMetaData: { fileId: "metadata-file-id", downloadUrl: existing },
    });
    const result = withAdminDocumentLinks({
      student, studentInfo: buildStudentInfoState("lead_test", student, null),
      chargebeeId: null, enrolledStudents: [],
    }, "lead_test");
    const serialized = JSON.stringify(result);
    for (const value of ["legacy-file-id", "existing-file-id", "metadata-file-id", "drive.google.com"]) {
      expect(serialized).not.toContain(value);
    }
    expect(Object.keys(result.student).some((key) => /metadata$/i.test(key))).toBe(false);
    expect(result.student.studentBirthCert).toContain("/api/admin/document?");
    expect(result.student.transcriptFiles).toHaveLength(1);
    expect(result.student.uploadTranscript).toBe(TRANSCRIPT_DELIVERY_UPLOAD);
  });
});
