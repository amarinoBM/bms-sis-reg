import { z } from "zod";

import { runRoute } from "@/server/http/route-handler";
import { verifyParentOtp } from "@/modules/otp/otp-service";
import { setParentSession } from "@/server/auth/parent-session";

const bodySchema = z.object({
  leadId: z.string().min(1),
  otp: z.string().min(1),
  studentName: z.string().optional(),
});

export async function POST(request: Request) {
  return runRoute(async () => {
    const json = await request.json();
    const parsed = bodySchema.parse(json);
    const result = await verifyParentOtp(parsed.leadId, parsed.otp, parsed.studentName);

    await setParentSession({
      leadId: parsed.leadId,
      studentName: result.studentName,
      isLoggedIn: true,
    });

    return result;
  }, request);
}
