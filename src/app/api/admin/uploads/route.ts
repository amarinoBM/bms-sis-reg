import { randomUUID } from "node:crypto";
import { z } from "zod";
import { AppError } from "@/core/app-error";
import { requireAdminSession } from "@/server/admin/session";
import { loadAdminStudent, registrationVersion } from "@/server/admin/registrations";
import { assertAdminWriteEnabled, assertRegistrationVersion } from "@/server/admin/edit";
import { adminRef } from "@/server/admin/store";
import { auditAdminAccess } from "@/server/admin/audit";
import { adminRoute } from "@/server/admin/route";
import { assertUploadFileAllowed } from "@/modules/uploads/upload-limits";
import { uploadStudentFile } from "@/modules/uploads/upload-service";
import { readStudentTranscriptFiles } from "@/modules/uploads/document-files";
const schema = z.object({ leadId: z.string().min(1).max(160), objectId: z.string().min(1).max(100), version: z.string().length(64), uploadType: z.enum(["birth_cert", "student_pic", "learning", "transcript", "iep"]) });
export async function POST(request: Request) {
  return adminRoute(request, async () => {
    const session = await requireAdminSession();
    assertAdminWriteEnabled();
    const form = await request.formData();
    const input = schema.parse(Object.fromEntries(form));
    const file = form.get("file");
    if (!(file instanceof File)) throw new AppError({ code: "INVALID_INPUT", message: "Choose a supported file to upload." });
    assertUploadFileAllowed(file);
    const current = await loadAdminStudent(input.leadId, input.objectId);
    assertRegistrationVersion(current.student, input.version);
    const operationId = randomUUID();
    await auditAdminAccess("upload_requested", session.email, input, operationId);
    const result = await uploadStudentFile({
      leadId: input.leadId, objectId: input.objectId, file, uploadType: input.uploadType,
      parentName: String(current.student.parent_name ?? "Parent"), studentName: current.studentInfo.studentName,
      currentRow: current.student, actor: { role: "admin", actorRef: adminRef("actor", session.email), operationId },
    });
    const saved = await loadAdminStudent(input.leadId, input.objectId);
    const confirmed = input.uploadType === "transcript" ? readStudentTranscriptFiles(saved.student).includes(result.url) : saved.student[result.fieldKey] === result.url;
    if (!confirmed) throw new AppError({ code: "EXTERNAL_READBACK_MISMATCH", message: "The upload could not be confirmed. Reload the registration before trying again." });
    await auditAdminAccess("upload_verified", session.email, input, operationId);
    return { fieldKey: result.fieldKey, adminVersion: registrationVersion(saved.student), url: "/api/admin/document?" + new URLSearchParams({
      leadId: input.leadId, objectId: input.objectId, field: result.fieldKey,
      index: String(input.uploadType === "transcript" ? readStudentTranscriptFiles(saved.student).indexOf(result.url) : 0),
    }) };
  });
}
