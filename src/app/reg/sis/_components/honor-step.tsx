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
  HONOR_DOCUMENT_PREVIEW_URL,
  HONOR_DOCUMENT_TEMPLATE_ID,
} from "@/config/document-templates";
import { REG_TOUCH_CLASS } from "@/lib/reg-ui";
import { postApi } from "@/lib/client-api";

import type { WizardStepId } from "@/modules/wizard/steps";

type HonorStepProps = {
  leadId: string;
  objectId: string;
  studentName: string;
  signed: boolean;
  honorCodeURL?: string | null;
  onSigned: () => Promise<void>;
  onGoToStep: (stepId: WizardStepId) => void;
};

export function HonorStep({
  leadId,
  objectId,
  studentName,
  signed,
  honorCodeURL,
  onSigned,
  onGoToStep,
}: HonorStepProps) {
  const [parentSignature, setParentSignature] = useState("");
  const [studentSignatureOverride, setStudentSignatureOverride] = useState<string | null>(null);
  const [hasReviewedDocument, setHasReviewedDocument] = useState(false);
  const [signing, setSigning] = useState(false);
  const studentSignature = studentSignatureOverride ?? studentName;

  async function handleSign() {
    if (!hasReviewedDocument) {
      toast.error("Please read the honor code and confirm before signing.");
      return;
    }

    if (!parentSignature.trim() || !studentSignature.trim()) {
      toast.error("Enter both parent and student signatures.");
      return;
    }

    setSigning(true);
    try {
      await postApi<{ honorCodeURL: string }>("/api/honor/sign", {
        leadId,
        objectId,
        studentName,
        parentSignature: parentSignature.trim(),
        studentSignature: studentSignature.trim(),
      });
      toast.success("Honor code signed");
      await onSigned();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign honor code.");
    } finally {
      setSigning(false);
    }
  }

  if (signed) {
    return (
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-section font-semibold text-foreground">Honor code</h2>
        <p className="mt-6 text-body text-foreground">
          {honorCodeURL ? (
            <>
              Signed.{" "}
              <ExternalLink href={honorCodeURL} className="text-primary underline">
                View signed honor code
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
          message="Honor code signed."
          onNext={() => onGoToStep("11")}
          nextLabel={`Next: ${getWizardStepLabel("11")}`}
        />
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-section font-semibold text-foreground">Honor code</h2>
      <p className="mt-2 text-body text-muted-foreground">
        Read the honor code below, then sign on behalf of yourself and {studentName}.
      </p>

      <DocumentReviewPanel
        title="honor code"
        templateFileId={HONOR_DOCUMENT_TEMPLATE_ID}
        previewUrl={HONOR_DOCUMENT_PREVIEW_URL}
        onReviewedChange={setHasReviewedDocument}
      />

      <div className="mt-6 space-y-4">
        <FormTextInput
          id="honor-parent-signature"
          label="Parent signature (type your full name)"
          value={parentSignature}
          onChange={setParentSignature}
        />
        <FormTextInput
          id="honor-student-signature"
          label={`Student signature (type ${studentName}'s full name)`}
          value={studentSignature}
          onChange={setStudentSignatureOverride}
        />
        <Button
          className={REG_TOUCH_CLASS}
          onClick={handleSign}
          disabled={
            signing ||
            !hasReviewedDocument ||
            !parentSignature.trim() ||
            !studentSignature.trim()
          }
          aria-busy={signing}
        >
          {signing ? "Signing…" : "Sign honor code"}
        </Button>
      </div>
    </section>
  );
}
