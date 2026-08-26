import { z } from "zod";

import { AppError } from "@/core/app-error";
import { runRoute } from "@/server/http/route-handler";
import { saveStudentStep, loadStudentRecord } from "@/modules/students/repository";
import { parseSaveStep } from "@/modules/wizard/save-service";
import { unflattenFormValues } from "@/modules/wizard/step-schemas";
import { requireParentApiSession } from "@/server/auth/require-parent-api-session";

const bodySchema = z.object({
  leadId: z.string().min(1),
  objectId: z.string().min(1),
  saveStep: z.string().min(1),
  fields: z.record(z.string(), z.unknown()),
  studentName: z.string().optional(),
});

export async function POST(request: Request) {
  return runRoute(async () => {
    const json = await request.json();
    const parsed = bodySchema.parse(json);

    await requireParentApiSession(parsed.leadId);

    const saveStep = parseSaveStep(parsed.saveStep);

    const current = await loadStudentRecord(
      parsed.leadId,
      parsed.studentName,
    );

    if (current.student.objectId !== parsed.objectId) {
      throw new AppError({
        code: "INVALID_INPUT",
        message: "Student record mismatch.",
      });
    }

    const fields = unflattenFormValues(parsed.fields);

    return saveStudentStep(
      parsed.leadId,
      parsed.objectId,
      saveStep,
      fields,
      current.student,
    );
  });
}
