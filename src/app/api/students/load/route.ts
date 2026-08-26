import { z } from "zod";

import { runRoute } from "@/server/http/route-handler";
import { loadStudentRecord } from "@/modules/students/repository";

const querySchema = z.object({
  lead_id: z.string().min(1),
  student_name: z.string().optional(),
});

export async function GET(request: Request) {
  return runRoute(async () => {
    const url = new URL(request.url);
    const parsed = querySchema.parse({
      lead_id: url.searchParams.get("lead_id"),
      student_name: url.searchParams.get("student_name") ?? undefined,
    });

    return loadStudentRecord(parsed.lead_id, parsed.student_name);
  });
}
