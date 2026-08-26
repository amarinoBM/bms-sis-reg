"use client";

import { useState } from "react";
import { toast } from "sonner";

import { FormTextInput } from "@/app/reg/_components/form-fields";
import { SectionSavedActions } from "@/app/reg/_components/section-saved-actions";
import { getWizardStepLabel } from "@/modules/wizard/steps";
import { DocumentReviewPanel } from "@/app/reg/_components/document-review-panel";
import { ExternalLink } from "@/app/reg/_components/external-link";
import { Button } from "@/components/ui/button";
import {
  TOS_DOCUMENT_PREVIEW_URL,
  TOS_DOCUMENT_TEMPLATE_ID,
} from "@/config/document-templates";
import { REG_TOUCH_CLASS } from "@/lib/reg-ui";
import { postApi } from "@/lib/client-api";

import type { WizardStepId } from "@/modules/wizard/steps";

type TosStepProps = {
  leadId: string;
  objectId: string;
  studentName: string;
  signed: boolean;
  tosURL?: string | null;
  onSigned: () => Promise<void>;
  onGoToStep: (stepId: WizardStepId) => void;
};

export function TosStep({
  leadId,
  objectId,
  studentName,
  signed,
  tosURL,
  onSigned,
  onGoToStep,
}: TosStepProps) {
  const [parentSignature, setParentSignature] = useState("");
  const [hasReviewedDocument, setHasReviewedDocument] = useState(false);
  const [signing, setSigning] = useState(false);

  async function handleSign() {
    if (!hasReviewedDocument) {
      toast.error("Please read the terms and confirm before signing.");
      return;
    }

    if (!parentSignature.trim()) {
      toast.error("Enter your signature.");
      return;
    }

    setSigning(true);
    try {
      await postApi<{ tosURL: string }>("/api/tos/sign", {
        leadId,
        objectId,
        studentName,
        parentSignature: parentSignature.trim(),
      });
      toast.success("Terms of service signed");
      await onSigned();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign terms.");
    } finally {
      setSigning(false);
    }
  }

  if (signed) {
    return (
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-section font-semibold text-foreground">Terms of service</h2>
        <p className="mt-6 text-body text-foreground">
          {tosURL ? (
            <>
              Signed.{" "}
              <ExternalLink href={tosURL} className="text-primary underline">
                View signed terms
              </ExternalLink>
            </>
          ) : (
            <>
              Signed. If you need a copy, email{" "}
              <a href="mailto:help@brilliantmicroschool.org" className="text-primary underline">
                help@brilliantmicroschool.org
              </a>
              .
            </>
          )}
        </p>
        <SectionSavedActions
          message="Terms of service signed."
          onNext={() => onGoToStep("12")}
          nextLabel={`Next: ${getWizardStepLabel("12")}`}
        />
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-section font-semibold text-foreground">Terms of service</h2>
      <p className="mt-2 text-body text-muted-foreground">
        Read the terms of service for {studentName}, then sign as the enrolling parent or guardian.
      </p>

      <DocumentReviewPanel
        title="terms of service"
        templateFileId={TOS_DOCUMENT_TEMPLATE_ID}
        previewUrl={TOS_DOCUMENT_PREVIEW_URL}
        onReviewedChange={setHasReviewedDocument}
      />

      <div className="mt-6 space-y-4">
        <FormTextInput
          id="tos-parent-signature"
          label="Parent signature (type your full name)"
          value={parentSignature}
          onChange={setParentSignature}
        />
        <Button
          className={REG_TOUCH_CLASS}
          onClick={handleSign}
          disabled={signing || !hasReviewedDocument}
        >
          {signing ? "Signing…" : "Sign terms of service"}
        </Button>
      </div>
    </section>
  );
}
