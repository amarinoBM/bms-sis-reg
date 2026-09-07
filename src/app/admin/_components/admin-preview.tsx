"use client";

import { AdminRegistration } from "./admin-registration";
import type { AdminRegistrationResult } from "@/server/admin/registrations";
import type { WizardStepId } from "@/modules/wizard/steps";

export function AdminPreview({
  result,
  leadId,
  initialStepId,
}: {
  result: AdminRegistrationResult;
  leadId: string;
  initialStepId: WizardStepId;
}) {
  return (
    <AdminRegistration
      result={result}
      leadId={leadId}
      initialStepId={initialStepId}
      readOnly
      onSaved={async () => undefined}
      onUploaded={() => undefined}
      onFormStateChange={() => undefined}
      canNavigate={async () => true}
      busy={false}
    />
  );
}
