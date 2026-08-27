"use client";

import { useState } from "react";
import { toast } from "sonner";

import { FormTextInput } from "@/app/reg/_components/form-fields";
import { SectionSavedActions } from "@/app/reg/_components/section-saved-actions";
import { DocumentPreviewDialog } from "@/app/reg/_components/document-preview-dialog";
import { ExternalLink } from "@/app/reg/_components/external-link";
import { Button } from "@/components/ui/button";
import {
  TOS_DOCUMENT_PREVIEW_URL,
  TOS_DOCUMENT_TEMPLATE_ID,
  buildDriveViewUrl,
} from "@/config/document-templates";
import {
  TOS_COPPA_BODY,
  TOS_HIGHLIGHT_BULLETS,
  TOS_HIGHLIGHTS_HEADING,
  TOS_GUIDED_STUDY_BULLET,
  TOS_INTRO,
  TOS_PARENT_NAME_LABEL,
  TOS_PRIVACY_LINK_LABEL,
  TOS_PRIVACY_PREFIX,
  TOS_PRIVACY_URL,
  TOS_READ_FULL_LABEL,
  TOS_SIGN_BUTTON_LABEL,
  TOS_SIGN_INSTRUCTION,
  TOS_SUMMER_BULLET,
  TOS_SUMMER_HEADING,
  TOS_TITLE,
  TOS_VIEW_SIGNED_LABEL,
} from "@/modules/tos/tos-copy";
import { getWizardStepLabel } from "@/modules/wizard/steps";
import { REG_TOUCH_CLASS } from "@/lib/reg-ui";
import { cn } from "@/lib/utils";
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
  const [signing, setSigning] = useState(false);
  const tosDocumentUrl = buildDriveViewUrl(TOS_DOCUMENT_TEMPLATE_ID);
  const nextStepId: WizardStepId = "14";

  async function handleSign() {
    if (!parentSignature.trim()) {
      toast.error("Enter your name before signing.");
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
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-[#fae2d9] bg-[#fdf6f3]/70 px-6 py-5">
          <h2 className="text-section font-semibold text-[#32325d]">{TOS_TITLE}</h2>
        </div>
        <div className="space-y-6 p-6">
          <p className="text-body text-foreground">
            {tosURL ? (
              <>
                Signed.{" "}
                <ExternalLink href={tosURL} className="text-primary underline">
                  {TOS_VIEW_SIGNED_LABEL}
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
            onNext={() => onGoToStep(nextStepId)}
            nextLabel={`Next: ${getWizardStepLabel(nextStepId)}`}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-[#fae2d9] bg-[#fdf6f3]/70 px-6 py-5">
        <h2 className="text-section font-semibold text-[#32325d]">{TOS_TITLE}</h2>
      </div>

      <div className="space-y-6 p-6">
        <p className="text-body text-foreground">{TOS_INTRO}</p>

        <div className="space-y-3">
          <p className="text-body font-medium text-foreground">{TOS_HIGHLIGHTS_HEADING}</p>
          <ul className="list-disc space-y-3 pl-5 text-body leading-relaxed text-foreground">
            {TOS_HIGHLIGHT_BULLETS.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
            <li>{TOS_GUIDED_STUDY_BULLET}</li>
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-body font-medium text-foreground">{TOS_SUMMER_HEADING}</p>
          <ul className="list-disc space-y-2 pl-5 text-body leading-relaxed text-foreground">
            <li>{TOS_SUMMER_BULLET}</li>
          </ul>
        </div>

        <p className="text-body text-foreground">
          {TOS_PRIVACY_PREFIX}{" "}
          <ExternalLink href={TOS_PRIVACY_URL} className="font-semibold text-primary underline">
            {TOS_PRIVACY_LINK_LABEL}
          </ExternalLink>
          .
        </p>

        <p className="text-body leading-relaxed text-foreground">{TOS_COPPA_BODY}</p>

        <DocumentPreviewDialog
          title={TOS_TITLE}
          previewUrl={TOS_DOCUMENT_PREVIEW_URL}
          viewUrl={tosDocumentUrl}
          triggerLabel={TOS_READ_FULL_LABEL}
          triggerVariant="button"
          description="Scroll through the document, then close this window to return to the form."
        />

        <p className="text-body text-foreground">{TOS_SIGN_INSTRUCTION}</p>

        <FormTextInput
          id="tos-parent-signature"
          label={TOS_PARENT_NAME_LABEL}
          value={parentSignature}
          onChange={setParentSignature}
        />

        <div className="flex justify-center">
          <Button
            className={cn(REG_TOUCH_CLASS, "bg-[#32325d] hover:bg-[#32325d]/90")}
            onClick={handleSign}
            disabled={signing || !parentSignature.trim()}
            aria-busy={signing}
          >
            {signing ? "Signing…" : TOS_SIGN_BUTTON_LABEL}
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
        </div>
      </div>
    </section>
  );
}
