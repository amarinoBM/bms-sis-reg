import { z } from "zod";

import { AppError } from "@/core/app-error";
import { runRoute } from "@/server/http/route-handler";
import { saveStudentStep, loadStudentRecord } from "@/modules/students/repository";
import { parseSaveStep } from "@/modules/wizard/save-service";
import { unflattenFormValues, flattenFormValues } from "@/modules/wizard/step-schemas";
import { expandVirtualFormFields } from "@/modules/wizard/field-normalization";
import { validateStepForSave } from "@/modules/wizard/step-validation";
import {
  readTranscriptDeliveryChoice,
  TRANSCRIPT_DELIVERY_SCHOOL,
  TRANSCRIPT_SCHOOL_CONTACT_EMAIL_FIELD,
} from "@/modules/wizard/transcript-fields";
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
    if (saveStep === "save6.1") {
      const validation = validateStepForSave(
        "9",
        flattenFormValues({ ...current.student, ...fields }),
      );
      if (!validation.valid) {
        throw new AppError({
          code: "INVALID_INPUT",
          message: validation.summary ?? "Fix the required fields before saving.",
        });
      }
    }

    const result = await saveStudentStep(
      parsed.leadId,
      parsed.objectId,
      saveStep,
      rawFields,
      current.student,
    );

    if (
      saveStep === "save6.1" &&
      readTranscriptDeliveryChoice(fields.uploadTranscript) === TRANSCRIPT_DELIVERY_SCHOOL &&
      Object.hasOwn(fields, TRANSCRIPT_SCHOOL_CONTACT_EMAIL_FIELD)
    ) {
      const saved = await loadStudentRecord(parsed.leadId, parsed.studentName);
      if (saved.student[TRANSCRIPT_SCHOOL_CONTACT_EMAIL_FIELD] !== fields[TRANSCRIPT_SCHOOL_CONTACT_EMAIL_FIELD]) {
        throw new AppError({
          code: "EXTERNAL_READBACK_MISMATCH",
          message: "The transcript contact email could not be confirmed. Reload the registration and try again.",
        });
      }
    }

    return result;
  }, request);
}
