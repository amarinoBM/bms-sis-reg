import { RegistrationShell } from "@/app/_components/registration-shell";

type RegSisPageProps = {
  searchParams: Promise<{ lead_id?: string; student_name?: string }>;
};

export default async function RegSisPage({ searchParams }: RegSisPageProps) {
  const params = await searchParams;
  const leadId = params.lead_id ?? "";
  const studentName = params.student_name ?? "";

  return (
    <RegistrationShell>
      <h1 className="text-title font-semibold text-foreground">Student Information</h1>
      <p className="mt-3 max-w-xl text-body text-muted-foreground">
        OTP verified for{" "}
        <span className="font-medium text-foreground">{studentName || "your student"}</span>.
        Phase 3 will load the full wizard here.
      </p>
      <p className="mt-2 text-label text-muted-foreground">lead_id: {leadId}</p>
    </RegistrationShell>
  );
}
