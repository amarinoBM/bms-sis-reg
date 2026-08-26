import { z } from "zod";

import { AppError } from "@/core/app-error";
import { runRoute } from "@/server/http/route-handler";
import { findSuggestedParentEmail } from "@/modules/students/repository";

const querySchema = z.object({
  lead_id: z.string().min(1),
});

export async function GET(request: Request) {
  return runRoute(async () => {
    const url = new URL(request.url);
    const leadId = url.searchParams.get("lead_id");

    if (!leadId) {
      throw new AppError({
        code: "INVALID_INPUT",
        message: "Registration link is missing lead_id.",
      });
    }

    const parsed = querySchema.parse({ lead_id: leadId });
    const suggestedEmail = await findSuggestedParentEmail(parsed.lead_id);

    return {
      leadId: parsed.lead_id,
      suggestedEmail,
    };
  });
}
