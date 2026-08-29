import { z } from "zod";
import { requireAdminSession } from "@/server/admin/session";
import { searchRegistrations } from "@/server/admin/registrations";
import { auditAdminAccess } from "@/server/admin/audit";
import { adminRoute } from "@/server/admin/route";
const schema = z.object({
  query: z.string().min(2).max(500),
  offset: z.number().int().min(0).max(100_000).default(0),
  scope: z.enum(["enrolled", "other"]).default("enrolled"),
});
export async function POST(request: Request) {
  return adminRoute(request, async () => {
    const session = await requireAdminSession();
    const input = schema.parse(await request.json());
    await auditAdminAccess("search", session.email);
    return searchRegistrations(input.query, input.offset, input.scope);
  });
}
