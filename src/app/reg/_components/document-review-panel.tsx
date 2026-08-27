"use client";

import { useState } from "react";

import { DocumentPreviewDialog } from "@/app/reg/_components/document-preview-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { buildDriveViewUrl } from "@/config/document-templates";

type DocumentReviewPanelProps = {
  title: string;
  templateFileId: string;
  previewUrl: string;
  onReviewedChange: (reviewed: boolean) => void;
};

export function DocumentReviewPanel({
  title,
  templateFileId,
  previewUrl,
  onReviewedChange,
}: DocumentReviewPanelProps) {
  const [reviewed, setReviewed] = useState(false);

  function handleReviewedChange(checked: boolean) {
    setReviewed(checked);
    onReviewedChange(checked);
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-md border border-border bg-muted/30 p-4 space-y-3">
        <p className="text-body text-foreground">
          Read the full {title} before signing. Open it here, then return to confirm and
          sign.
        </p>
        <DocumentPreviewDialog
          title={title}
          previewUrl={previewUrl}
          viewUrl={buildDriveViewUrl(templateFileId)}
          triggerLabel={`Read ${title}`}
          triggerVariant="button"
          description="Scroll through the document, then close this window to return to the form."
        />
      </div>
      <div className="flex items-start gap-2">
        <Checkbox
          id={`reviewed-${templateFileId}`}
          checked={reviewed}
          onCheckedChange={(checked) => handleReviewedChange(checked === true)}
        />
        <Label htmlFor={`reviewed-${templateFileId}`} className="text-body leading-snug">
          I have read the {title} and agree to sign on behalf of my student.
        </Label>
      </div>
    </div>
  );
}
