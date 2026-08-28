"use client";
import { useState } from "react";
import { StepNav } from "@/app/reg/sis/_components/step-nav";
import { StepForm, type AdminFormState, type AdminUploadResult } from "@/app/reg/sis/_components/step-form";
import { ExternalLink } from "@/app/reg/_components/external-link";
import { flattenFormValues, getStepFormDefinition } from "@/modules/wizard/step-schemas";
import { WIZARD_STEPS, type WizardStepId } from "@/modules/wizard/steps";
import type { AdminRegistrationResult } from "@/server/admin/registrations";
import { isStepDisabled } from "@/modules/wizard/progress";

export function AdminRegistration({ result, leadId, onSaved, onUploaded, onFormStateChange, canNavigate, busy }: {
  result: AdminRegistrationResult; leadId: string; onSaved: () => Promise<void>;
  onUploaded: (result: AdminUploadResult) => void;
  onFormStateChange: (state: AdminFormState) => void;
  canNavigate: () => boolean; busy: boolean;
}) {
  const [stepId, setStepId] = useState<WizardStepId>("1");
  const definition = getStepFormDefinition(stepId);
  const { student, studentInfo } = result;
  const signed = stepId === "12" ? student.honorCodeSigned === "Completed" || student.honorCodeSigned === true : student.ToSBool === true;
  const document = stepId === "12" ? student.honorCodeURL : student.ToSURL;
  function goToStep(next: WizardStepId) {
    if (next !== stepId && canNavigate()) setStepId(next);
  }
  return <div className="space-y-6">
    <div>
      <label htmlFor="admin-section" className="mb-2 block text-label font-medium">Jump to section</label>
      <select id="admin-section" value={stepId} disabled={busy} onChange={(e) => goToStep(e.target.value as WizardStepId)} className="min-h-11 w-full rounded-md border border-input bg-card px-3 text-body">
        {WIZARD_STEPS.map((step) => <option key={step.id} value={step.id}>{step.label}</option>)}
      </select>
    </div>
    <fieldset disabled={busy} className="min-w-0"><StepNav activeStepId={stepId} stepCompletion={studentInfo.stepCompletion} onStepSelect={goToStep} /></fieldset>
    <p className="text-label text-muted-foreground">Changes are saved as admin edits. Blank fields have not been answered. Signing and submission remain parent-only.</p>
    {definition && <StepForm key={stepId} definition={definition} leadId={leadId} objectId={studentInfo.objectId} studentName={studentInfo.studentName} stepId={stepId} initialValues={flattenFormValues(student)} disabled={isStepDisabled(stepId, student)} persistence={{ kind: "admin", version: result.adminVersion }} onSaved={onSaved} onAdminUploaded={onUploaded} onAdminStateChange={onFormStateChange} onGoToStep={goToStep} />}
    {(stepId === "12" || stepId === "13") && <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-section font-semibold">{stepId === "12" ? "Honor code" : "Terms of service"}</h2>
      <p className="mt-3 text-body">{signed ? "Signed by the family." : "Not signed yet."}</p>
      {typeof document === "string" && document.startsWith("/api/admin/document?") && <ExternalLink href={document} className="mt-4 inline-flex min-h-11 items-center text-primary underline">Open signed document</ExternalLink>}
    </section>}
    {stepId === "14" && <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-section font-semibold">Registration status</h2>
      <p className="mt-3 text-body">{student.is_complete_sis === true ? "Submitted by the family." : "Not submitted yet."}</p>
      <p className="mt-2 text-body text-muted-foreground">Only the family can submit this registration.</p>
    </section>}
  </div>;
}
