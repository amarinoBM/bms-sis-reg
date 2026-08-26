import { z } from "zod";

import { AppError } from "@/core/app-error";
import { signTermsOfService } from "@/modules/tos/sign-tos";
import { loadStudentRecord } from "@/modules/students/repository";
import { runRoute } from "@/server/http/route-handler";

const bodySchema = z.object({
  leadId: z.string().min(1),
  objectId: z.string().min(1),
  studentName: z.string().min(1),
  parentSignature: z.string().min(1),
});

export async function POST(request: Request) {
  return runRoute(async () => {
    const parsed = bodySchema.parse(await request.json());
    const current = await loadStudentRecord(parsed.leadId, parsed.studentName);

    if (current.student.objectId !== parsed.objectId) {
      throw new AppError({
        code: "INVALID_INPUT",
        message: "Student record mismatch.",
      });
    }

    const email = String(current.student.email ?? current.student.parent_email ?? "");
    if (!email) {
      throw new AppError({
        code: "INVALID_INPUT",
        message: "Parent email is required before signing.",
      });
    }

    return signTermsOfService({
      leadId: parsed.leadId,
      objectId: parsed.objectId,
      parentSignature: parsed.parentSignature,
      parentName: String(current.student.parent_name ?? parsed.parentSignature),
      studentName: parsed.studentName,
      email,
      chargebeeId: current.chargebeeId,
      student: current.student,
    });
  });
}
