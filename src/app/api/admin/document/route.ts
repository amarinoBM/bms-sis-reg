import { z } from "zod";
import { AppError } from "@/core/app-error";
import { requireAdminSession } from "@/server/admin/session";
import { loadAdminStudent, adminDocumentUrl } from "@/server/admin/registrations";
import { auditAdminAccess } from "@/server/admin/audit";
import { adminRoute } from "@/server/admin/route";
const schema = z.object({ leadId: z.string().min(1).max(160), objectId: z.string().min(1).max(100), field: z.string().max(80), index: z.coerce.number().int().min(0).max(100).default(0) });
export async function GET(request: Request) {
  let location: string | null = null;
  const response = await adminRoute(request, async () => {
    const session = await requireAdminSession();
    const target = schema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const result = await loadAdminStudent(target.leadId, target.objectId);
    location = adminDocumentUrl(result.student, target.field, target.index);
    if (!location) throw new AppError({ code: "NOT_FOUND", message: "This document is not available." });
    await auditAdminAccess("document", session.email, target);
    return {};
  });
  return response.ok && location ? new Response(null, { status: 303, headers: {
    Location: location, "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer",
  } }) : response;
}
