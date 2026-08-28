import { beforeEach, describe, expect, it, vi } from "vitest";
import { uploadStudentFile } from "@/modules/uploads/upload-service";
import { saveStudentRecord } from "@/modules/students/repository";
import { uploadFileToDrive } from "@/server/connectors/backendless/sis-cloud-code";
vi.mock("@/modules/students/repository", () => ({ saveStudentRecord: vi.fn() }));
vi.mock("@/server/connectors/backendless/sis-cloud-code", () => ({ uploadFileToDrive: vi.fn() }));
const legacy = "https://drive.google.com/file/d/legacy/view";
const existing = "https://drive.google.com/file/d/existing/view";
const input = { leadId: "lead_test", objectId: "student-test", parentName: "Parent", studentName: "Synthetic", file: new File(["%PDF"], "record.pdf", { type: "application/pdf" }) };
describe("document upload preservation", () => {
  beforeEach(() => { vi.resetAllMocks(); vi.mocked(uploadFileToDrive).mockResolvedValue({ id: "new-file" }); });
  it("appends transcripts without dropping the older scalar upload", async () => {
    await uploadStudentFile({ ...input, uploadType: "transcript", currentRow: { uploadTranscript: legacy, transcriptFiles: [existing, existing] } });
    expect(saveStudentRecord).toHaveBeenCalledWith(input.leadId, input.objectId, { transcriptFiles: [existing, legacy, "https://drive.google.com/file/d/new-file/view"] }, expect.any(Function));
  });
  it("keeps IEP replacement on the existing encrypted field and leaves legacy attachments untouched", async () => {
    await uploadStudentFile({ ...input, uploadType: "iep", currentRow: { IEPFiles: [legacy], upload_copy_EIP_504_plan: existing } });
    const payload = vi.mocked(saveStudentRecord).mock.calls[0][2];
    expect(payload.upload_copy_EIP_504_plan).toBe("https://drive.google.com/file/d/new-file/view");
    expect(payload).not.toHaveProperty("IEPFiles");
    expect(payload).not.toHaveProperty("transcriptFiles");
  });
});
