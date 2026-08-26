import { z } from "zod";

import { AppError } from "@/core/app-error";
import { runRoute } from "@/server/http/route-handler";
import { saveStudentRecord } from "@/modules/students/repository";

const bodySchema = z.object({
  leadId: z.string().min(1),
  objectId: z.string().min(1),
  fields: z.record(z.string(), z.unknown()),
});

export async function POST(request: Request) {
  return runRoute(async () => {
    const json = await request.json();
    const parsed = bodySchema.parse(json);

    if (Object.keys(parsed.fields).length === 0) {
      throw new AppError({
        code: "INVALID_INPUT",
        message: "No fields provided to save.",
      });
    }

    return saveStudentRecord(parsed.leadId, parsed.objectId, parsed.fields);
  });
}
