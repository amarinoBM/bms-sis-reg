"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  formatMissingFieldsMessage,
  validateSubmitReadiness,
} from "@/modules/wizard/submit-validation";
import { postApi } from "@/lib/client-api";

type SubmitStepProps = {
  leadId: string;
  objectId: string;
  studentName: string;
  student: Record<string, unknown>;
  completed: boolean;
  onSubmitted: () => Promise<void>;
};

export function SubmitStep({
  leadId,
  objectId,
  studentName,
  student,
  completed,
  onSubmitted,
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
      await postApi<{ success: boolean }>("/api/sis/complete", {
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
        Submit the completed registration for {studentName}. This starts downstream
        account setup in Backendless.
      </p>

      {!readiness.ready && !completed && (
        <div className="mt-4 rounded-md border border-border bg-muted/40 p-4">
          <p className="text-label font-medium text-foreground">Still needed</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-body text-muted-foreground">
            {readiness.missingLabels.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
      )}

      {completed ? (
        <p className="mt-6 text-body text-foreground">
          Registration has been submitted. Our team will follow up if anything else is needed.
        </p>
      ) : (
        <div className="mt-6">
          <Button onClick={handleSubmit} disabled={submitting || !readiness.ready}>
            {submitting ? "Submitting…" : "Submit registration"}
          </Button>
        </div>
      )}
    </section>
  );
}
