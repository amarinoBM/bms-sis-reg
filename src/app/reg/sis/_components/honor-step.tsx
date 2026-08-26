"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { postApi } from "@/lib/client-api";

type HonorStepProps = {
  leadId: string;
  objectId: string;
  studentName: string;
  signed: boolean;
  honorCodeURL?: string | null;
  onSigned: () => Promise<void>;
};

export function HonorStep({
  leadId,
  objectId,
  studentName,
  signed,
  honorCodeURL,
  onSigned,
}: HonorStepProps) {
  const [parentSignature, setParentSignature] = useState("");
  const [studentSignatureOverride, setStudentSignatureOverride] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const studentSignature = studentSignatureOverride ?? studentName;

  async function handleSign() {
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

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-section font-semibold text-foreground">Honor code</h2>
      <p className="mt-2 text-body text-muted-foreground">
        Review and sign the honor code for {studentName}.
      </p>

      {signed && honorCodeURL ? (
        <p className="mt-6 text-body">
          Signed.{" "}
          <a href={honorCodeURL} className="text-primary underline" target="_blank" rel="noreferrer">
            View signed honor code
          </a>
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="honor-parent-signature">Parent signature</Label>
            <Input
              id="honor-parent-signature"
              value={parentSignature}
              onChange={(event) => setParentSignature(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="honor-student-signature">Student signature</Label>
            <Input
              id="honor-student-signature"
              value={studentSignature}
              onChange={(event) => setStudentSignatureOverride(event.target.value)}
            />
          </div>
          <Button onClick={handleSign} disabled={signing}>
            {signing ? "Signing…" : "Sign honor code"}
          </Button>
        </div>
      )}
    </section>
  );
}
