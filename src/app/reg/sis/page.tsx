import { redirect } from "next/navigation";

import { RegistrationShell } from "@/app/_components/registration-shell";
import { SisWorkspace } from "@/app/reg/sis/_components/sis-workspace";
import { parseRegistrationLinkContext } from "@/modules/registration/registration-link";
import {
  normalizeStudentNameParam,
  requireParentSessionForLead,
} from "@/server/auth/require-parent-session";

type RegSisPageProps = {
  searchParams: Promise<{ lead_id?: string; student_name?: string; step?: string }>;
};

export default async function RegSisPage({ searchParams }: RegSisPageProps) {
  const params = await searchParams;
  const leadId = params.lead_id?.trim();

  if (!leadId) {
    redirect("/reg");
  }

  await requireParentSessionForLead(leadId);

  const linkContext = parseRegistrationLinkContext({
    studentName: params.student_name,
    step: params.step,
  });
  const studentName = normalizeStudentNameParam(linkContext.studentName);

  if (!studentName) {
    redirect(`/reg?lead_id=${encodeURIComponent(leadId)}&step=${encodeURIComponent(linkContext.stepId)}`);
  }

  return (
    <RegistrationShell>
      <SisWorkspace
        mode="live"
        leadId={leadId}
        initialStudentName={studentName}
        initialStepId={linkContext.stepId}
      />
    </RegistrationShell>
  );
}
