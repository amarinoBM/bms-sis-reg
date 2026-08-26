import { z } from "zod";

import { AppError } from "@/core/app-error";
import { completeSisRegistration } from "@/modules/sis/complete-form";
import { loadStudentRecord } from "@/modules/students/repository";
import {
  formatMissingFieldsMessage,
  validateSubmitReadiness,
} from "@/modules/wizard/submit-validation";
import { runRoute } from "@/server/http/route-handler";
import { requireParentApiSession } from "@/server/auth/require-parent-api-session";

const bodySchema = z.object({
  leadId: z.string().min(1),
  objectId: z.string().min(1),
  studentName: z.string().min(1),
});

export async function POST(request: Request) {
  return runRoute(async () => {
    const parsed = bodySchema.parse(await request.json());

    await requireParentApiSession(parsed.leadId);

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

    const readiness = validateSubmitReadiness(current.student);
    if (!readiness.ready) {
      throw new AppError({
        code: "INVALID_INPUT",
        message: formatMissingFieldsMessage(readiness.missingLabels),
      });
    }

    await completeSisRegistration({
      leadId: parsed.leadId,
      objectId: parsed.objectId,
      student: current.student,
    });

    return { submitted: true };
  }, request);
}
