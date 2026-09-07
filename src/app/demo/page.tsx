import { notFound } from "next/navigation";

import { RegistrationShell } from "@/app/_components/registration-shell";
import { SisWorkspace } from "@/app/reg/sis/_components/sis-workspace";
import { isDemoModeEnabled } from "@/config/env";
import { createRegistrationDemo } from "@/modules/demo/registration-demo";

export const dynamic = "force-dynamic";

export default function DemoPage() {
  if (!isDemoModeEnabled()) {
    notFound();
  }

  const demo = createRegistrationDemo();

  return (
    <RegistrationShell>
      <SisWorkspace mode="demo" demo={demo} />
    </RegistrationShell>
  );
}
