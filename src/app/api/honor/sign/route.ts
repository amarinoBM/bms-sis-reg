import { z } from "zod";

import { AppError } from "@/core/app-error";
import { signHonorCode } from "@/modules/honor/sign-honor";
import { loadStudentRecord } from "@/modules/students/repository";
import { runRoute } from "@/server/http/route-handler";
import { requireParentApiSession } from "@/server/auth/require-parent-api-session";

const bodySchema = z.object({
  leadId: z.string().min(1),
  objectId: z.string().min(1),
  studentName: z.string().min(1),
  parentSignature: z.string().min(1),
  studentSignature: z.string().min(1),
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

    if (
      current.student.honorCodeSigned === "Completed" &&
      typeof current.student.honorCodeURL === "string" &&
      current.student.honorCodeURL.trim()
    ) {
      return { honorCodeURL: current.student.honorCodeURL };
    }

    const email = String(current.student.parent_email ?? "").trim();
    if (!email) {
      throw new AppError({
        code: "INVALID_INPUT",
        message: "Parent email is required before signing.",
      });
    }

    return signHonorCode({
      leadId: parsed.leadId,
      objectId: parsed.objectId,
      parentSignature: parsed.parentSignature,
      studentSignature: parsed.studentSignature,
      parentName: String(current.student.parent_name ?? parsed.parentSignature),
      studentName: parsed.studentName,
      email,
    });
  }, request);
}
