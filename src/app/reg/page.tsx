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
          This page needs a registration link with a <code>lead_id</code>. If you
          received a link from Brilliant Microschools, open that link directly or
          contact help@brilliantmicroschool.org.
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

function RegistrationShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <p className="text-label font-medium uppercase tracking-label text-muted-foreground">
            BMS Student Registration
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">{children}</main>
    </div>
  );
}
