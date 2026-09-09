import { z } from "zod";

import { AppError } from "@/core/app-error";
import { runRoute } from "@/server/http/route-handler";
import { saveStudentStep, loadStudentRecord } from "@/modules/students/repository";
import { parseSaveStep } from "@/modules/wizard/save-service";
import { unflattenFormValues, flattenFormValues } from "@/modules/wizard/step-schemas";
import { expandVirtualFormFields } from "@/modules/wizard/field-normalization";
import { validateStepForSave } from "@/modules/wizard/step-validation";
import { WIZARD_STEPS } from "@/modules/wizard/steps";
import { requireParentApiSession } from "@/server/auth/require-parent-api-session";
import { preserveDocumentFields } from "@/modules/uploads/document-files";

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

    const rawFields = preserveDocumentFields(unflattenFormValues(parsed.fields), current.student);
    const fields = expandVirtualFormFields(
      saveStep,
      rawFields,
    );
    const step = WIZARD_STEPS.find((candidate) => candidate.saveHandler === saveStep);
    if (step) {
      const validation = validateStepForSave(
        step.id,
        flattenFormValues({ ...current.student, ...fields }),
      );
      if (!validation.valid) {
        throw new AppError({
          code: "INVALID_INPUT",
          message: validation.summary ?? "Fix the required fields before saving.",
        });
      }
    }

    return saveStudentStep(
      parsed.leadId,
      parsed.objectId,
      saveStep,
      rawFields,
      current.student,
    );
  }, request);
}
