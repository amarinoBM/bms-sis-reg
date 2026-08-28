import { describe, expect, it } from "vitest";
import { readIepFiles, readStudentTranscriptFiles, preserveDocumentFields } from "@/modules/uploads/document-files";
import { validateStepForSave } from "@/modules/wizard/step-validation";
import { validateSubmitReadiness } from "@/modules/wizard/submit-validation";
import { assertUploadFileAllowed, MAX_UPLOAD_BYTES } from "@/modules/uploads/upload-limits";
import { enrichFlatFormValues, expandVirtualFormFields } from "@/modules/wizard/field-normalization";

const first = "https://drive.google.com/file/d/first-file/view";
const second = "https://drive.google.com/file/d/second-file/view";
describe("registration documents", () => {
  it("merges current and legacy IEPs and deduplicates Drive IDs", () => {
    expect(readIepFiles({ upload_copy_EIP_504_plan: first, IEPFiles: [first, "https://drive.google.com/open?id=first-file", second] })).toEqual([first, second]);
  });
  it("handles legacy JSON arrays without accepting unsafe or encrypted links", () => {
    expect(readIepFiles({ IEPFiles: JSON.stringify([first, "javascript:alert(1)", "sis:v1:secret", "https://evil.test/a"]) })).toEqual([first]);
    expect(readIepFiles({ IEPFiles: "[broken" })).toEqual([]);
  });
  it("counts legacy IEPs in both validation paths", () => {
    const row = { IEP_or_504_plan: true, IEPFiles: [first] };
    expect(validateStepForSave("8", row).fieldErrors.upload_copy_EIP_504_plan).toBeUndefined();
    expect(validateSubmitReadiness(row).missingKeys).not.toContain("upload_copy_EIP_504_plan");
  });
  it("includes legacy transcripts and keeps stored documents when answers are saved", () => {
    const row = { uploadTranscript: first, transcriptFiles: [second], IEPFiles: [first], upload_copy_EIP_504_plan: second };
    expect(readStudentTranscriptFiles(row)).toEqual([second, first]);
    expect(preserveDocumentFields({ uploadTranscript: "I can upload them", transcriptFiles: [], IEPFiles: [], upload_copy_EIP_504_plan: "" }, row)).toEqual({ uploadTranscript: "I can upload them", transcriptFiles: [second, first], IEPFiles: [first], upload_copy_EIP_504_plan: second });
  });
  it("preserves JSON transcript lists throughout form load and save normalization", () => {
    const row = { transcriptFiles: JSON.stringify([first]), uploadTranscript: second };
    const flat = enrichFlatFormValues(row);
    expect(flat.transcriptFiles).toEqual([first, second]);
    const trusted = preserveDocumentFields({ ...flat, uploadTranscript: "I can upload them" }, row);
    expect(expandVirtualFormFields("save6.1", trusted).transcriptFiles).toEqual([first, second]);
    const jsonOnly = { transcriptFiles: JSON.stringify([first]), uploadTranscript: "I can upload them" };
    expect(expandVirtualFormFields("save6.1", preserveDocumentFields(jsonOnly, jsonOnly)).transcriptFiles).toEqual([first]);
  });
  it("uses a 4 MB limit on both sides of the boundary", () => {
    expect(MAX_UPLOAD_BYTES).toBe(4 * 1024 * 1024);
    expect(() => assertUploadFileAllowed(new File([new Uint8Array(4 * 1024 * 1024)], "ok.pdf", { type: "application/pdf" }))).not.toThrow();
    expect(() => assertUploadFileAllowed(new File([new Uint8Array(4 * 1024 * 1024 + 1)], "large.pdf", { type: "application/pdf" }))).toThrow();
  });
});
