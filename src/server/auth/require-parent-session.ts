import { redirect } from "next/navigation";

import { normalizeStudentName } from "@/modules/students/student-row-selection";
import { getParentSession } from "@/server/auth/parent-session";

export async function requireParentSessionForLead(leadId: string): Promise<void> {
  const session = await getParentSession();

  if (!session.isLoggedIn || session.leadId !== leadId) {
    redirect(`/reg?lead_id=${encodeURIComponent(leadId)}`);
  }
}

export function normalizeStudentNameParam(studentName?: string): string | undefined {
  if (!studentName) {
    return undefined;
  }

  const normalized = normalizeStudentName(studentName);
  return normalized.length > 0 ? normalized : undefined;
}
