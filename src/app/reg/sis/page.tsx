type RegSisPageProps = {
  searchParams: Promise<{ lead_id?: string; student_name?: string }>;
};

export default async function RegSisPage({ searchParams }: RegSisPageProps) {
  const params = await searchParams;
  const leadId = params.lead_id ?? "";
  const studentName = params.student_name ?? "";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <p className="text-label font-medium uppercase tracking-label text-muted-foreground">
            BMS Student Registration
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-title font-semibold text-foreground">Student Information</h1>
        <p className="mt-3 max-w-xl text-body text-muted-foreground">
          OTP verified for{" "}
          <span className="font-medium text-foreground">{studentName || "your student"}</span>.
          Phase 3 will load the full wizard here.
        </p>
        <p className="mt-2 text-label text-muted-foreground">lead_id: {leadId}</p>
      </main>
    </div>
  );
}
