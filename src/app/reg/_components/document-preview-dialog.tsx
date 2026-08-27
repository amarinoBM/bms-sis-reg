"use client";

import { ExternalLink } from "@/app/reg/_components/external-link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { REG_TOUCH_CLASS } from "@/lib/reg-ui";
import { cn } from "@/lib/utils";

type DocumentPreviewDialogProps = {
  title: string;
  previewUrl: string;
  viewUrl?: string;
  triggerLabel: string;
  triggerClassName?: string;
  triggerVariant?: "link" | "button";
  description?: string;
};

export function DocumentPreviewDialog({
  title,
  previewUrl,
  viewUrl,
  triggerLabel,
  triggerClassName,
  triggerVariant = "link",
  description,
}: DocumentPreviewDialogProps) {
  const openUrl = viewUrl ?? previewUrl;

  return (
    <Dialog>
      <DialogTrigger
        render={
          triggerVariant === "button" ? (
            <Button variant="outline" className={cn(REG_TOUCH_CLASS, triggerClassName)} />
          ) : (
            <button
              type="button"
              className={cn("text-primary underline", triggerClassName)}
            />
          )
        }
      >
        {triggerLabel}
      </DialogTrigger>
      <DialogContent
        className="flex max-h-[min(90vh,960px)] w-[min(96vw,56rem)] max-w-none flex-col gap-4 p-0 sm:max-w-none"
        showCloseButton
      >
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="text-section">{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-hidden px-6">
          <iframe
            src={previewUrl}
            title={title}
            className="h-[min(68vh,720px)] w-full rounded-md border border-border bg-background"
            allow="autoplay"
          />
        </div>
        <DialogFooter className="border-t border-border bg-muted/30 px-6 py-4 sm:justify-between">
          <ExternalLink
            href={openUrl}
            className="text-sm text-primary underline"
            showNewWindowHint={false}
          >
            Open in new tab
          </ExternalLink>
          <p className="text-label text-muted-foreground sm:text-right">
            Close this window to return to the form.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
