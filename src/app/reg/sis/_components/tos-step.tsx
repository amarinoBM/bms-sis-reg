"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApiResponse } from "@/server/http/api-envelope";

type TosStepProps = {
  leadId: string;
  objectId: string;
  studentName: string;
  chargebeeId: string | null;
  signed: boolean;
  tosURL?: string | null;
  onSigned: () => Promise<void>;
};

export function TosStep({
  leadId,
  objectId,
  studentName,
  chargebeeId,
  signed,
  tosURL,
  onSigned,
}: TosStepProps) {
  const [parentSignature, setParentSignature] = useState("");
  const [signing, setSigning] = useState(false);

  async function handleSign() {
    if (!parentSignature.trim()) {
      toast.error("Enter your signature.");
      return;
    }

    setSigning(true);
    try {
      const response = await fetch("/api/tos/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          objectId,
          studentName,
          parentSignature: parentSignature.trim(),
        }),
      });
      const body = (await response.json()) as ApiResponse<{ tosURL: string }>;
      if (!body.success) {
        throw new Error(body.error.message);
      }
      toast.success("Terms of service signed");
      await onSigned();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign terms.");
    } finally {
      setSigning(false);
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-section font-semibold text-foreground">Terms of service</h2>
      <p className="mt-2 text-body text-muted-foreground">
        Sign the terms of service for {studentName}.
      </p>
      {chargebeeId && (
        <p className="mt-2 text-label text-muted-foreground">Billing id: {chargebeeId}</p>
      )}

      {signed && tosURL ? (
        <p className="mt-6 text-body">
          Signed.{" "}
          <a href={tosURL} className="text-primary underline" target="_blank" rel="noreferrer">
            View signed terms
          </a>
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tos-parent-signature">Parent signature</Label>
            <Input
              id="tos-parent-signature"
              value={parentSignature}
              onChange={(event) => setParentSignature(event.target.value)}
            />
          </div>
          <Button onClick={handleSign} disabled={signing}>
            {signing ? "Signing…" : "Sign terms of service"}
          </Button>
        </div>
      )}
    </section>
  );
}
