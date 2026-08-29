"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { maskEmail } from "@/lib/mask-email";
import { REG_TOUCH_CLASS } from "@/lib/reg-ui";
import { cn } from "@/lib/utils";
import type { ParentEmailState } from "@/modules/students/parent-emails";

type ParentEmailRepairProps = {
  state: ParentEmailState;
  selectedEmail: string;
  disabled: boolean;
  onSelect: (email: string) => void;
};

export function ParentEmailRepair({
  state,
  selectedEmail,
  disabled,
  onSelect,
}: ParentEmailRepairProps) {
  if (state.status === "legacy_only" && state.legacyEmail) {
    return (
      <Alert className="border-primary/25 bg-primary/5">
        <AlertTitle>Email found in an older registration</AlertTitle>
        <AlertDescription>
          <p>
            We found {maskEmail(state.legacyEmail)} in an older record and filled it in below.
            {disabled
              ? " Choose Edit section, review it, and save to confirm it as the main parent email."
              : " Review it and save this section to confirm it as the main parent email."}
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  if (state.status !== "different" || !state.parentEmail || !state.legacyEmail) {
    return null;
  }

  const options = [state.parentEmail, state.legacyEmail];
  return (
    <Alert className="border-primary/25 bg-primary/5">
      <AlertTitle>Choose the main parent email</AlertTitle>
      <AlertDescription>
        <p>
          We found two parent email addresses. Choose the main address for registration updates.
          The other address will remain available for login codes.
        </p>
        <div role="radiogroup" aria-label="Main parent email" className="mt-3 grid gap-2 sm:grid-cols-2">
          {options.map((email) => (
            <label
              key={email.toLowerCase()}
              className={cn(
                REG_TOUCH_CLASS,
                "flex min-w-0 items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 text-label text-foreground",
                disabled ? "cursor-default opacity-75" : "cursor-pointer",
                "has-[:checked]:border-primary has-[:checked]:bg-primary/5",
              )}
            >
              <input
                type="radio"
                name="main-parent-email"
                value={email}
                checked={selectedEmail.trim().toLowerCase() === email.toLowerCase()}
                disabled={disabled}
                onChange={() => onSelect(email)}
                className="h-5 w-5 shrink-0 accent-primary"
              />
              <span className="min-w-0 break-all font-medium">{maskEmail(email)}</span>
            </label>
          ))}
        </div>
        {disabled ? <p className="mt-2">Choose Edit section to change the main address.</p> : null}
      </AlertDescription>
    </Alert>
  );
}
