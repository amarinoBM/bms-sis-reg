"use client";

import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type FormValidationSummaryProps = {
  title?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
};

export function FormValidationSummary({
  title = "Could not save this section",
  message = "Fix the highlighted fields below, then try again.",
  fieldErrors,
}: FormValidationSummaryProps) {
  const errorEntries = fieldErrors ? Object.entries(fieldErrors) : [];

  return (
    <Alert variant="destructive">
      <AlertCircle className="size-4" aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{message}</p>
        {errorEntries.length > 1 ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-foreground">
            {errorEntries.map(([key, error]) => (
              <li key={key}>{error}</li>
            ))}
          </ul>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
