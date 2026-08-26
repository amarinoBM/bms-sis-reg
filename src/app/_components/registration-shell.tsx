import { RegistrationHeader } from "@/app/_components/registration-header";

export function RegistrationShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <RegistrationHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10 md:py-12">{children}</main>
    </div>
  );
}
