import Link from "next/link";

import { RegistrationHeader } from "@/app/_components/registration-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <RegistrationHeader />

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-title font-semibold text-foreground">
          Parent registration workspace
        </h1>
        <p className="mt-3 max-w-xl text-body text-muted-foreground">
          Replacing the Clever SIS registration flow with a Next.js app on Vercel.
          Phase 0 scaffold is ready — OTP and wizard steps follow.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/reg" className={cn(buttonVariants({ size: "lg" }))}>
            Start registration (OTP)
          </Link>
        </div>

        <p className="mt-10 text-label text-muted-foreground">
          Preview on Vercel first; production target: reg.brilliantmicroschools.org
        </p>
      </main>
    </div>
  );
}
