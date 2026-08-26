"use client";

import { useState } from "react";

import { ExternalLink } from "@/app/reg/_components/external-link";
import { buttonVariants } from "@/components/ui/button-variants";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { buildDriveViewUrl } from "@/config/document-templates";
import { REG_TOUCH_CLASS } from "@/lib/reg-ui";
import { cn } from "@/lib/utils";

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
          Read the full {title} before signing. Open it in a new tab, then return here to
          confirm and sign.
        </p>
        <ExternalLink
          href={buildDriveViewUrl(templateFileId)}
          className={cn(buttonVariants({ variant: "outline" }), REG_TOUCH_CLASS)}
        >
          Read {title}
        </ExternalLink>
        <p className="text-label text-muted-foreground">
          <ExternalLink href={previewUrl} className="text-primary underline">
            Alternate preview link
          </ExternalLink>
        </p>
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
