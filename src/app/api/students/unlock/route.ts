import { z } from "zod";

import { AppError } from "@/core/app-error";
import { saveStudentRecord } from "@/modules/students/repository";
import { WIZARD_STEPS } from "@/modules/wizard/steps";
import { runRoute } from "@/server/http/route-handler";
import type { WizardStepId } from "@/modules/wizard/steps";

const bodySchema = z.object({
  leadId: z.string().min(1),
  objectId: z.string().min(1),
  stepId: z.string().min(1),
});

function isWizardStepId(value: string): value is WizardStepId {
  return WIZARD_STEPS.some((step) => step.id === value);
}

export async function POST(request: Request) {
  return runRoute(async () => {
    const parsed = bodySchema.parse(await request.json());

    if (!isWizardStepId(parsed.stepId)) {
      throw new AppError({
        code: "INVALID_INPUT",
        message: "Invalid step id.",
      });
    }

    const disabledKey = `${parsed.stepId}disabled`;

    await saveStudentRecord(parsed.leadId, parsed.objectId, {
      [disabledKey]: false,
    });

    return { stepId: parsed.stepId, unlocked: true };
  });
}
