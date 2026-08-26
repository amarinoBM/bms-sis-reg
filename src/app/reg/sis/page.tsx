import { redirect } from "next/navigation";

import { RegistrationShell } from "@/app/_components/registration-shell";
import { SisWorkspace } from "@/app/reg/sis/_components/sis-workspace";
import {
  normalizeStudentNameParam,
  requireParentSessionForLead,
} from "@/server/auth/require-parent-session";

type RegSisPageProps = {
  searchParams: Promise<{ lead_id?: string; student_name?: string }>;
};

export default async function RegSisPage({ searchParams }: RegSisPageProps) {
  const params = await searchParams;
  const leadId = params.lead_id?.trim();

  if (!leadId) {
    redirect("/reg");
  }

  await requireParentSessionForLead(leadId);

  const studentName = normalizeStudentNameParam(params.student_name);

  if (!studentName) {
    redirect(`/reg?lead_id=${encodeURIComponent(leadId)}`);
  }

  return (
    <RegistrationShell>
      <SisWorkspace leadId={leadId} initialStudentName={studentName} />
    </RegistrationShell>
  );
}
