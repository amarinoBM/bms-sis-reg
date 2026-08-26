import { runRoute } from "@/server/http/route-handler";
import { uploadStudentFile } from "@/modules/uploads/upload-service";
import { isUploadType } from "@/modules/uploads/upload-config";
import { loadStudentRecord } from "@/modules/students/repository";
import { AppError } from "@/core/app-error";

export async function POST(request: Request) {
  return runRoute(async () => {
    const formData = await request.formData();
    const leadId = String(formData.get("leadId") ?? "");
    const objectId = String(formData.get("objectId") ?? "");
    const studentName = String(formData.get("studentName") ?? "");
    const uploadType = String(formData.get("uploadType") ?? "");
    const file = formData.get("file");

    if (!leadId || !objectId || !studentName || !isUploadType(uploadType)) {
      throw new AppError({
        code: "INVALID_INPUT",
        message: "Upload request is missing required fields.",
      });
    }

    if (!(file instanceof File)) {
      throw new AppError({
        code: "INVALID_INPUT",
        message: "No file was provided.",
      });
    }

    const current = await loadStudentRecord(leadId, studentName);
    if (current.student.objectId !== objectId) {
      throw new AppError({
        code: "INVALID_INPUT",
        message: "Student record mismatch.",
      });
    }

    const parentName = String(current.student.parent_name ?? "Parent");

    return uploadStudentFile({
      leadId,
      objectId,
      uploadType,
      file,
      parentName,
      studentName,
    });
  });
}
