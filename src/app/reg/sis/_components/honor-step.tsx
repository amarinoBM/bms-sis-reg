"use client";

import { useState } from "react";
import { toast } from "sonner";

import { FormTextInput } from "@/app/reg/_components/form-fields";
import { SectionSavedActions } from "@/app/reg/_components/section-saved-actions";
import { DocumentPreviewDialog } from "@/app/reg/_components/document-preview-dialog";
import { ExternalLink } from "@/app/reg/_components/external-link";
import { Button } from "@/components/ui/button";
import {
  HONOR_DOCUMENT_PREVIEW_URL,
  HONOR_DOCUMENT_TEMPLATE_ID,
  buildDriveViewUrl,
} from "@/config/document-templates";
import {
  HONOR_CODE_BODY,
  HONOR_CODE_SIGN_INSTRUCTION,
  HONOR_CODE_TITLE,
  HONOR_CODE_VIEW_LINK_LABEL,
  HONOR_CODE_VIEW_PREFIX,
  HONOR_PARENT_NAME_LABEL,
  HONOR_SIGN_BUTTON_LABEL,
  HONOR_STUDENT_NAME_LABEL,
  HONOR_VIEW_SIGNED_LABEL,
} from "@/modules/honor/honor-code-copy";
import { getNextStepId, getWizardStepLabel } from "@/modules/wizard/steps";
import { REG_TOUCH_CLASS } from "@/lib/reg-ui";
import { cn } from "@/lib/utils";
import { postApi } from "@/lib/client-api";

import type { WizardStepId } from "@/modules/wizard/steps";

type HonorStepProps = {
  leadId: string;
  objectId: string;
  studentName: string;
  parentName?: string;
  signed: boolean;
  honorCodeURL?: string | null;
  onSigned: () => Promise<void>;
  onGoToStep: (stepId: WizardStepId) => void;
};

export function HonorStep({
  leadId,
  objectId,
  studentName,
  parentName,
  signed,
  honorCodeURL,
  onSigned,
  onGoToStep,
}: HonorStepProps) {
  const [parentSignature, setParentSignature] = useState(parentName ?? "");
  const [studentSignatureOverride, setStudentSignatureOverride] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const studentSignature = studentSignatureOverride ?? studentName;
  const nextStepId = getNextStepId("13");
  const honorDocumentUrl = buildDriveViewUrl(HONOR_DOCUMENT_TEMPLATE_ID);

  async function handleSign() {
    const errors: Record<string, string> = {};
    if (!parentSignature.trim()) {
      errors.parentSignature = "Enter the parent full name.";
    }
    if (!studentSignature.trim()) {
      errors.studentSignature = "Enter the student full name.";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error("Enter both parent and student names.");
      return;
    }

    setFieldErrors({});
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

  function handleContinue() {
    if (!signed) {
      toast.error("Sign the honor code before continuing.");
      return;
    }

    if (nextStepId) {
      onGoToStep(nextStepId);
    }
  }

  if (signed) {
    return (
      <div className="space-y-4">
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-[#fae2d9] bg-[#fdf6f3]/70 px-6 py-5">
            <h2 className="text-section font-semibold text-[#32325d]">{HONOR_CODE_TITLE}</h2>
          </div>
          <div className="space-y-6 p-6">
            <p className="text-body leading-relaxed text-foreground">
              {honorCodeURL ? (
                <>
                  Signed.{" "}
                  <ExternalLink href={honorCodeURL} className="text-primary underline">
                    {HONOR_VIEW_SIGNED_LABEL}
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
              onNext={nextStepId ? () => onGoToStep(nextStepId) : undefined}
              nextLabel={
                nextStepId ? `Next: ${getWizardStepLabel(nextStepId)}` : "Next section"
              }
            />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-[#fae2d9] bg-[#fdf6f3]/70 px-6 py-5">
          <h2 className="text-section font-semibold text-[#32325d]">{HONOR_CODE_TITLE}</h2>
        </div>

        <div className="space-y-6 p-6">
          <p className="text-body leading-relaxed text-foreground">{HONOR_CODE_BODY}</p>

          <p className="text-body text-foreground">
            {HONOR_CODE_VIEW_PREFIX}{" "}
            <DocumentPreviewDialog
              title={HONOR_CODE_TITLE}
              previewUrl={HONOR_DOCUMENT_PREVIEW_URL}
              viewUrl={honorDocumentUrl}
              triggerLabel={HONOR_CODE_VIEW_LINK_LABEL}
            />
          </p>

          <p className="text-body text-foreground">{HONOR_CODE_SIGN_INSTRUCTION}</p>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormTextInput
              id="honor-parent-signature"
              label={HONOR_PARENT_NAME_LABEL}
              value={parentSignature}
              error={fieldErrors.parentSignature}
              onChange={(value) => {
                setParentSignature(value);
                if (fieldErrors.parentSignature) {
                  setFieldErrors((current) => {
                    const next = { ...current };
                    delete next.parentSignature;
                    return next;
                  });
                }
              }}
            />
            <FormTextInput
              id="honor-student-signature"
              label={HONOR_STUDENT_NAME_LABEL}
              value={studentSignature}
              error={fieldErrors.studentSignature}
              onChange={(value) => {
                setStudentSignatureOverride(value);
                if (fieldErrors.studentSignature) {
                  setFieldErrors((current) => {
                    const next = { ...current };
                    delete next.studentSignature;
                    return next;
                  });
                }
              }}
            />
          </div>

          <div className="flex justify-center">
            <Button
              className={cn(REG_TOUCH_CLASS, "bg-[#32325d] hover:bg-[#32325d]/90")}
              onClick={handleSign}
              disabled={signing || !parentSignature.trim() || !studentSignature.trim()}
              aria-busy={signing}
            >
              {signing ? "Signing…" : HONOR_SIGN_BUTTON_LABEL}
            </Button>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-border pt-6">
            <Button
              type="button"
              variant="outline"
              className={REG_TOUCH_CLASS}
              onClick={() => onGoToStep("12")}
            >
              Back
            </Button>
            <Button
              type="button"
              className={cn(REG_TOUCH_CLASS, "bg-[#f5713c] hover:bg-[#f5713c]/90")}
              onClick={handleContinue}
            >
              Continue
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
