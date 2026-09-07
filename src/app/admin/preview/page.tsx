import { redirect } from "next/navigation";

import { RegistrationShell } from "@/app/_components/registration-shell";
import { AdminPreview } from "@/app/admin/_components/admin-preview";
import { parseRegistrationLinkContext } from "@/modules/registration/registration-link";
import { loadAdminRegistration, resolveAdminPreviewTarget, toAdminRegistrationResult } from "@/server/admin/registrations";
import { requireAdminSession } from "@/server/admin/session";

type AdminPreviewPageProps = {
  searchParams: Promise<{ lead_id?: string; student_name?: string; step?: string }>;
};

export default async function AdminPreviewPage({ searchParams }: AdminPreviewPageProps) {
  const session = await requireAdminSession(false).catch(() => null);
  if (!session) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const leadId = params.lead_id?.trim();
  const linkContext = parseRegistrationLinkContext({
    studentName: params.student_name,
    step: params.step,
  });

  if (!leadId || !linkContext.studentName) {
    return <PreviewError />;
  }

  try {
    const target = await resolveAdminPreviewTarget(leadId, linkContext.studentName);
    const result = await loadAdminRegistration(leadId, target.objectId);
    return (
      <RegistrationShell>
        <p className="text-label font-medium text-foreground">Admin · Read-only preview</p>
        <h1 className="mt-2 text-title font-semibold text-foreground">Student information</h1>
        <p className="mt-3 max-w-2xl text-body text-muted-foreground">
          This preview follows the family link for {result.studentInfo.studentName}. Nothing can be changed from this page.
        </p>
        <a href="/admin" className="mt-4 inline-flex text-body text-primary underline">Back to admin</a>
        <div className="mt-8">
          <AdminPreview result={toAdminRegistrationResult(result, leadId)} leadId={leadId} initialStepId={linkContext.stepId} />
        </div>
      </RegistrationShell>
    );
  } catch {
    return <PreviewError />;
  }
}

function PreviewError() {
  return (
    <RegistrationShell>
      <h1 className="text-title font-semibold text-foreground">Preview link not found</h1>
      <p className="mt-3 max-w-xl text-body text-muted-foreground">
        Check the student link and try again from the admin area.
      </p>
      <a href="/admin" className="mt-4 inline-flex text-body text-primary underline">Back to admin</a>
    </RegistrationShell>
  );
}
