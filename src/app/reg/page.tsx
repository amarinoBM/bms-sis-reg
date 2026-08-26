import { RegistrationShell } from "@/app/_components/registration-shell";
import { OtpForm } from "@/app/reg/_components/otp-form";
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
        <h1 className="text-title font-semibold text-foreground">Invalid registration link</h1>
        <p className="mt-3 max-w-xl text-body text-muted-foreground">
          This page needs a valid registration link from Brilliant Microschools. Open the link
          from your admissions email, or contact{" "}
          <a href="mailto:help@brilliantmicroschool.org" className="text-primary underline">
            help@brilliantmicroschool.org
          </a>
          .
        </p>
      </RegistrationShell>
    );
  }

  const suggestedEmail = await findSuggestedParentEmail(leadId).catch(() => null);

  return (
    <RegistrationShell>
      <h1 className="text-title font-semibold text-foreground">Verify your email</h1>
      <p className="mt-3 max-w-xl text-body text-muted-foreground">
        Enter the email address we have on file, then use the one-time pin we send
        to open the Student Information form.
      </p>
      <OtpForm leadId={leadId} suggestedEmail={suggestedEmail} />
    </RegistrationShell>
  );
}
