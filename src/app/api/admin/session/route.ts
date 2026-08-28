import { requireAdminSession } from "@/server/admin/session";
import { adminRoute } from "@/server/admin/route";
export async function POST(request: Request) {
  return adminRoute(request, async () => {
    const session = await requireAdminSession();
    return { issuedAt: session.issuedAt, lastSeenAt: session.lastSeenAt };
  });
}
