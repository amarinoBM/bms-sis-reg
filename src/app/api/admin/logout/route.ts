import { destroyAdminSession, requireAdminSession } from "@/server/admin/session";
import { auditAdminAccess } from "@/server/admin/audit";
import { adminRoute } from "@/server/admin/route";
export async function POST(request: Request) {
  return adminRoute(request, async () => {
    const session = await requireAdminSession(false).catch(() => null);
    await destroyAdminSession();
    if (session) await auditAdminAccess("logout", session.email);
    return { signedOut: true };
  });
}
