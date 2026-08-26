import { RegistrationShell } from "@/app/_components/registration-shell";
import { OtpForm } from "@/app/reg/_components/otp-form";
import { maskEmail } from "@/lib/mask-email";
import { findSuggestedParentEmail } from "@/modules/students/repository";

type RegPageProps = {
  searchParams: Promise<{ lead_id?: string }>;
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

  const suggestedEmail = await findSuggestedParentEmail(leadId).catch(() => null);
  const maskedEmail = suggestedEmail ? maskEmail(suggestedEmail) : null;

  return (
    <RegistrationShell>
      <h1 className="text-title font-semibold text-foreground">Verify your email</h1>
      <p className="mt-3 max-w-xl text-body text-muted-foreground">
        We will send a one-time login code to the parent email we already have on file.
      </p>
      <OtpForm leadId={leadId} maskedEmail={maskedEmail} />
    </RegistrationShell>
  );
}
