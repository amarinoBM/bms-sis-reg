"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { OTP_RESEND_COOLDOWN_SECONDS } from "@/config/backendless";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { postApi } from "@/lib/client-api";

type OtpFormProps = {
  leadId: string;
  suggestedEmail?: string | null;
};

type SendResponse = { cooldownSeconds: number };
type VerifyResponse = {
  redirectUrl: string;
  studentName: string;
  students: { studentName: string; objectId: string }[];
};

export function OtpForm({ leadId, suggestedEmail }: OtpFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(suggestedEmail ?? "");
  const [otp, setOtp] = useState("");
  const [sendLabel, setSendLabel] = useState("Send OTP");
  const [verifyDisabled, setVerifyDisabled] = useState(false);
  const sendDisabled = sendLabel !== "Send OTP";

  async function handleSendOtp() {
    setSendLabel("Sending login code…");

    try {
      const result = await postApi<SendResponse>("/api/otp/send", {
        leadId,
        email,
      });

      toast.success("Login code sent — check your email within 2 minutes");
      setSendLabel("Login code sent — check your email within 2 minutes");

      let remaining = result.cooldownSeconds ?? OTP_RESEND_COOLDOWN_SECONDS;
      const interval = window.setInterval(() => {
        remaining -= 1;
        if (remaining > 0) {
          setSendLabel(
            `Resend OTP in ${remaining} ${remaining === 1 ? "second" : "seconds"}`,
          );
        } else {
          window.clearInterval(interval);
          setSendLabel("Send OTP");
        }
      }, 1000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not send OTP.";
      toast.error(message);
      setSendLabel("Send OTP");
    }
  }

  async function handleVerifyOtp() {
    setVerifyDisabled(true);

    try {
      const result = await postApi<VerifyResponse>("/api/otp/verify", {
        leadId,
        otp,
      });
      router.push(result.redirectUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not verify OTP.";
      toast.error(message);
    } finally {
      setVerifyDisabled(false);
    }
  }

  return (
    <div className="mt-8 space-y-6 rounded-lg border border-border bg-card p-6">
      <div className="space-y-2">
        <Label htmlFor="parent-email">Parent email</Label>
        <Input
          id="parent-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>

      <button
        type="button"
        className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
        disabled={sendDisabled}
        onClick={handleSendOtp}
      >
        {sendLabel}
      </button>

      <div className="space-y-2">
        <Label htmlFor="one-time-pin">One-time pin</Label>
        <Input
          id="one-time-pin"
          inputMode="numeric"
          value={otp}
          onChange={(event) => setOtp(event.target.value)}
          placeholder="6-digit code"
          maxLength={6}
        />
      </div>

      <button
        type="button"
        className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
        disabled={verifyDisabled || !otp.trim()}
        onClick={handleVerifyOtp}
      >
        Continue to Student Information
      </button>
    </div>
  );
}
