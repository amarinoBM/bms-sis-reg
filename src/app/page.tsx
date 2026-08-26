import { RegistrationHeader } from "@/app/_components/registration-header";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <RegistrationHeader />

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-title font-semibold text-foreground">
          Student registration
        </h1>
        <p className="mt-3 max-w-xl text-body text-muted-foreground">
          Open the registration link from your Brilliant Microschools admissions
          email to continue. If you need a new link, contact{" "}
          <a href="mailto:help@brilliantmicroschool.org" className="text-primary underline">
            help@brilliantmicroschool.org
          </a>
          .
        </p>
      </main>
    </div>
  );
}
