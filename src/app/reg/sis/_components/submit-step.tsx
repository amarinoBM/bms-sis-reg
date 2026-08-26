"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ApiResponse } from "@/server/http/api-envelope";

type SubmitStepProps = {
  leadId: string;
  objectId: string;
  studentName: string;
  completed: boolean;
  onSubmitted: () => Promise<void>;
};

export function SubmitStep({
  leadId,
  objectId,
  studentName,
  completed,
  onSubmitted,
}: SubmitStepProps) {
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const response = await fetch("/api/sis/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          objectId,
          studentName,
        }),
      });
      const body = (await response.json()) as ApiResponse<{ success: boolean }>;
      if (!body.success) {
        throw new Error(body.error.message);
      }
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

      {completed ? (
        <p className="mt-6 text-body text-foreground">
          Registration has been submitted. Our team will follow up if anything else is needed.
        </p>
      ) : (
        <div className="mt-6">
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit registration"}
          </Button>
        </div>
      )}
    </section>
  );
}
