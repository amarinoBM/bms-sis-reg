import { z } from "zod";
import { requireAdminSession } from "@/server/admin/session";
import { loadAdminRegistration, toAdminRegistrationResult } from "@/server/admin/registrations";
import { auditAdminAccess } from "@/server/admin/audit";
import { adminRoute } from "@/server/admin/route";
const schema = z.object({ leadId: z.string().min(1).max(160), objectId: z.string().min(1).max(100) });
export async function POST(request: Request) {
  return adminRoute(request, async () => {
    const session = await requireAdminSession();
    const target = schema.parse(await request.json());
    const result = await loadAdminRegistration(target.leadId, target.objectId);
    await auditAdminAccess("view", session.email, target);
    return toAdminRegistrationResult(result, target.leadId);
  });
}
