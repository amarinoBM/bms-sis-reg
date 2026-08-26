import { z } from "zod";

import { runRoute } from "@/server/http/route-handler";
import { toStudentLoadResultDto } from "@/modules/students/student-wizard-dto";
import { loadStudentRecord } from "@/modules/students/repository";
import { requireParentApiSession } from "@/server/auth/require-parent-api-session";

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

    await requireParentApiSession(parsed.lead_id);

    const result = await loadStudentRecord(parsed.lead_id, parsed.student_name);
    return toStudentLoadResultDto(result);
  }, request);
}
