import { z } from "zod";
import { verifyAdminOtp } from "@/server/admin/otp";
import { createAdminSession } from "@/server/admin/session";
import { auditAdminAccess } from "@/server/admin/audit";
import { adminRoute } from "@/server/admin/route";
const schema = z.object({ email: z.string().trim().email().max(254), challengeId: z.string().uuid(), otp: z.string().regex(/^\d{6}$/) });
export async function POST(request: Request) {
  return adminRoute(request, async () => {
    const input = schema.parse(await request.json());
    const email = await verifyAdminOtp(input.email, input.challengeId, input.otp);
    await auditAdminAccess("login", email);
    const session = await createAdminSession(email);
    return { expiresAt: session.issuedAt + 8 * 60 * 60_000 };
  });
}
