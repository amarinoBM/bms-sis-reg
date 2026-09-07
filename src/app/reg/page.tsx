import { RegistrationShell } from "@/app/_components/registration-shell";
import { OtpForm } from "@/app/reg/_components/otp-form";
import { parseRegistrationLinkContext } from "@/modules/registration/registration-link";
import { findParentEmailOptions } from "@/server/auth/parent-email-choice";

type RegPageProps = {
  searchParams: Promise<{ lead_id?: string; student_name?: string; step?: string }>;
};

export default async function RegPage({ searchParams }: RegPageProps) {
  const params = await searchParams;
  const leadId = params.lead_id?.trim();

  if (!leadId) {
    return (
      <RegistrationShell>
        <div className="rounded-lg border border-destructive/30 bg-card p-6">
          <h1 className="text-title font-semibold text-foreground">This link is incomplete</h1>
          <p className="mt-3 max-w-xl text-body text-muted-foreground">
            Open the full registration link from your Brilliant Microschools admissions email.
            If you do not have it, contact{" "}
            <a
              href="mailto:help@brilliantmicroschool.org?subject=Registration%20link%20help"
              className="text-primary underline"
            >
              help@brilliantmicroschool.org
            </a>
            .
          </p>
        </div>
      </RegistrationShell>
    );
  }

  const linkContext = parseRegistrationLinkContext({
    studentName: params.student_name,
    step: params.step,
  });
  const emailOptions = await findParentEmailOptions(leadId).catch(() => []);

  return (
    <RegistrationShell>
      <h1 className="text-title font-semibold text-foreground">Verify your email</h1>
      <p className="mt-3 max-w-xl text-body text-muted-foreground">
        We will send a one-time login code to the parent email we already have on file.
      </p>
      <OtpForm
        leadId={leadId}
        emailOptions={emailOptions}
        requestedStudentName={linkContext.studentName}
        requestedStepId={linkContext.stepId}
      />
    </RegistrationShell>
  );
}
