import { z } from "zod";

import { runRoute } from "@/server/http/route-handler";
import { sendParentOtp } from "@/modules/otp/otp-service";

const bodySchema = z.object({
  leadId: z.string().min(1),
  emailChoiceToken: z.string().regex(/^[a-f0-9]{64}$/).optional(),
});

export async function POST(request: Request) {
  return runRoute(async () => {
    const json = await request.json();
    const parsed = bodySchema.parse(json);
    return sendParentOtp(parsed.leadId, parsed.emailChoiceToken);
  }, request);
}
