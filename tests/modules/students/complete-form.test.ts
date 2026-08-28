import { beforeEach, describe, expect, it, vi } from "vitest";
import { completeSisRegistration } from "@/modules/sis/complete-form";
import { completeSisForm } from "@/server/connectors/backendless/sis-cloud-code";
import { getAppRow } from "@/server/connectors/backendless/app-data-client";
import { saveStudentRecord } from "@/modules/students/repository";
vi.mock("@/server/connectors/backendless/sis-cloud-code", () => ({ completeSisForm: vi.fn() }));
vi.mock("@/server/connectors/backendless/app-data-client", () => ({ getAppRow: vi.fn() }));
vi.mock("@/modules/students/repository", () => ({ saveStudentRecord: vi.fn() }));
const input = { leadId: "lead_test", objectId: "student-test", student: { student_name: "Synthetic" } };
const saved = { objectId: input.objectId, lead_id: input.leadId, is_complete_sis: true };
describe("authoritative registration completion", () => {
  beforeEach(() => { vi.resetAllMocks(); vi.mocked(completeSisForm).mockResolvedValue({ success: true }); vi.mocked(getAppRow).mockResolvedValue(saved); });
  it("reads back the flag without a duplicate app write", async () => {
    await expect(completeSisRegistration(input)).resolves.toMatchObject({ success: true });
    expect(getAppRow).toHaveBeenCalledWith("ms_student_dir", input.objectId, expect.any(Function));
    expect(saveStudentRecord).not.toHaveBeenCalled();
  });
  it.each([null, { ...saved, is_complete_sis: false }, { ...saved, lead_id: "another-lead" }, { ...saved, objectId: "another-student" }])("does not claim success without matching completion evidence", async (row) => {
    vi.mocked(getAppRow).mockResolvedValue(row);
    await expect(completeSisRegistration(input)).rejects.toMatchObject({ code: "EXTERNAL_READBACK_MISMATCH" });
  });
  it("recognizes a committed submission after a lost response", async () => {
    vi.mocked(completeSisForm).mockRejectedValue(new Error("connection lost"));
    await expect(completeSisRegistration(input)).resolves.toMatchObject({ success: true });
    expect(saveStudentRecord).not.toHaveBeenCalled();
  });
  it.each(["student_identity_guard", "registration_incomplete"])("does not mask a %s rejection with an old flag", async (stage) => {
    vi.mocked(completeSisForm).mockResolvedValue({ success: false, stage });
    await expect(completeSisRegistration(input)).rejects.toMatchObject({ code: "EXTERNAL_WRITE_FAILED" });
  });
});
