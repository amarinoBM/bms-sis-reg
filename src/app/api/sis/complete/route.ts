import { z } from "zod";

import { AppError } from "@/core/app-error";
import { completeSisRegistration } from "@/modules/sis/complete-form";
import { loadStudentRecord } from "@/modules/students/repository";
import { runRoute } from "@/server/http/route-handler";

const bodySchema = z.object({
  leadId: z.string().min(1),
  objectId: z.string().min(1),
  studentName: z.string().min(1),
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

    if (current.student.honorCodeSigned !== "Completed") {
      throw new AppError({
        code: "INVALID_INPUT",
        message: "Honor code must be signed before submitting.",
      });
    }

    if (current.student.ToSBool !== true) {
      throw new AppError({
        code: "INVALID_INPUT",
        message: "Terms of service must be signed before submitting.",
      });
    }

    const result = await completeSisRegistration({
      leadId: parsed.leadId,
      objectId: parsed.objectId,
      student: current.student,
    });

    return { success: true, result };
  });
}
