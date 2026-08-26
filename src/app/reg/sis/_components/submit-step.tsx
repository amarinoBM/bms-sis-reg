"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { WIZARD_STEPS, type WizardStepId } from "@/modules/wizard/steps";
import {
  formatMissingFieldsMessage,
  validateSubmitReadiness,
} from "@/modules/wizard/submit-validation";
import { REG_TOUCH_CLASS } from "@/lib/reg-ui";
import { postApi } from "@/lib/client-api";

type SubmitStepProps = {
  leadId: string;
  objectId: string;
  studentName: string;
  student: Record<string, unknown>;
  completed: boolean;
  onSubmitted: () => Promise<void>;
  onGoToStep: (stepId: WizardStepId) => void;
};

function stepLabel(stepId: WizardStepId): string {
  return WIZARD_STEPS.find((step) => step.id === stepId)?.label ?? stepId;
}

export function SubmitStep({
  leadId,
  objectId,
  studentName,
  student,
  completed,
  onSubmitted,
  onGoToStep,
}: SubmitStepProps) {
  const [submitting, setSubmitting] = useState(false);
  const readiness = validateSubmitReadiness(student);

  async function handleSubmit() {
    if (!readiness.ready) {
      toast.error(formatMissingFieldsMessage(readiness.missingLabels));
      return;
    }

    setSubmitting(true);
    try {
      await postApi<{ submitted: boolean }>("/api/sis/complete", {
        leadId,
        objectId,
        studentName,
      });
      toast.success("Registration submitted");
      await onSubmitted();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-section font-semibold text-foreground">Submit registration</h2>
      <p className="mt-2 text-body text-muted-foreground">
        Submit the completed registration for {studentName}. We will set up your student&apos;s
        school email and notify your teacher.
      </p>

      {!readiness.ready && !completed && (
        <div className="mt-4 rounded-md border border-border bg-muted/40 p-4">
          <p className="text-label font-medium text-foreground">Still needed</p>
          <ul className="mt-2 space-y-2 text-body text-muted-foreground">
            {readiness.missingItems.map((item) => (
              <li key={item.key} className="flex flex-wrap items-center gap-2">
                <span>{item.label}</span>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto min-h-0 px-0 text-primary"
                  onClick={() => onGoToStep(item.stepId)}
                >
                  Go to {stepLabel(item.stepId)}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {completed ? (
        <div className="mt-6 space-y-2 text-body text-foreground">
          <p>Registration has been submitted. Thank you!</p>
          <p className="text-muted-foreground">
            We will email you your student&apos;s Brilliant Microschools account details within
            one business day. Your teacher will also receive a notification.
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <Button
            className={REG_TOUCH_CLASS}
            onClick={handleSubmit}
            disabled={submitting || !readiness.ready}
          >
            {submitting ? "Submitting…" : "Submit registration"}
          </Button>
        </div>
      )}
    </section>
  );
}
