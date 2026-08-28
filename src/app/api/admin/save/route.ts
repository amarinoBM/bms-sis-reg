import { randomUUID } from "node:crypto";
import { z } from "zod";
import { AppError } from "@/core/app-error";
import { requireAdminSession } from "@/server/admin/session";
import { loadAdminStudent, preserveDocumentFields } from "@/server/admin/registrations";
import { adminRef } from "@/server/admin/store";
import { assertAdminWriteEnabled, assertRegistrationVersion } from "@/server/admin/edit";
import { auditAdminAccess } from "@/server/admin/audit";
import { adminRoute } from "@/server/admin/route";
import { parseSaveStep, pickSaveStepFields } from "@/modules/wizard/save-service";
import { unflattenFormValues, flattenFormValues } from "@/modules/wizard/step-schemas";
import { expandVirtualFormFields } from "@/modules/wizard/field-normalization";
import { validateStepForSave } from "@/modules/wizard/step-validation";
import { WIZARD_STEPS } from "@/modules/wizard/steps";
import { saveStudentStep } from "@/modules/students/repository";
import type { AdminEditActor } from "@/modules/admin/policy";

const schema = z.object({
  leadId: z.string().min(1).max(160), objectId: z.string().min(1).max(100),
  saveStep: z.enum(["save1", "save1.5", "save1.6", "save2", "save3", "save4", "save5", "save6", "save6.1", "save7", "save8"]),
  version: z.string().length(64), fields: z.record(z.string(), z.unknown()),
});
export async function POST(request: Request) {
  return adminRoute(request, async () => {
    const session = await requireAdminSession();
    assertAdminWriteEnabled();
    const input = schema.parse(await request.json());
    const current = await loadAdminStudent(input.leadId, input.objectId);
    assertRegistrationVersion(current.student, input.version);
    // These addresses determine where parent OTPs are sent. Contact editing
    // must not let an administrator acquire a parent's signing session.
    for (const field of ["parent_email", "email"] as const) {
      if (Object.hasOwn(input.fields, field) && input.fields[field] !== current.student[field]) {
        throw new AppError({ code: "FORBIDDEN", message: "Parent sign-in email addresses cannot be changed in admin mode." });
      }
    }
    const saveStep = parseSaveStep(input.saveStep);
    const fields = preserveDocumentFields(unflattenFormValues(input.fields), current.student);
    const operationId = randomUUID();
    const actor: AdminEditActor = { role: "admin", actorRef: adminRef("actor", session.email), operationId };
    const expected = pickSaveStepFields(saveStep, expandVirtualFormFields(saveStep, fields), actor);
    const step = WIZARD_STEPS.find((s) => s.saveHandler === saveStep)!;
    const validation = validateStepForSave(step.id, flattenFormValues({ ...current.student, ...expected }));
    if (!validation.valid) throw new AppError({ code: "INVALID_INPUT", message: validation.summary ?? "Check the required fields before saving." });
    await auditAdminAccess("save_requested", session.email, input, operationId);
    const result = await saveStudentStep(input.leadId, input.objectId, saveStep, fields, current.student, fetch, actor);
    const saved = await loadAdminStudent(input.leadId, input.objectId);
    if (saveStep === "save1.5" && typeof expected.share_contact === "boolean") expected.share_contact = expected.share_contact ? "Yes" : "No";
    for (const [key, value] of Object.entries(expected)) {
      if (JSON.stringify(saved.student[key] ?? null) !== JSON.stringify(value ?? null)) {
        throw new AppError({ code: "EXTERNAL_READBACK_MISMATCH", message: "The save could not be confirmed. Reload the registration before making more changes." });
      }
    }
    await auditAdminAccess("save_verified", session.email, input, operationId);
    return result;
  });
}
