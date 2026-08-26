"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { OTP_RESEND_COOLDOWN_SECONDS } from "@/config/backendless";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { REG_TOUCH_CLASS } from "@/lib/reg-ui";
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

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function OtpForm({ leadId, suggestedEmail }: OtpFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(suggestedEmail ?? "");
  const [otp, setOtp] = useState("");
  const [sendLabel, setSendLabel] = useState("Send login code");
  const [verifyDisabled, setVerifyDisabled] = useState(false);
  const cooldownIntervalRef = useRef<number | null>(null);
  const sendDisabled = sendLabel !== "Send login code";

  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current !== null) {
        window.clearInterval(cooldownIntervalRef.current);
      }
    };
  }, []);

  async function handleSendOtp() {
    if (!isValidEmail(email)) {
      toast.error("Enter a valid email address.");
      return;
    }

    setSendLabel("Sending login code…");

    try {
      const result = await postApi<SendResponse>("/api/otp/send", {
        leadId,
        email: email.trim(),
      });

      toast.success("Login code sent — check your email within 2 minutes");

      let remaining = result.cooldownSeconds ?? OTP_RESEND_COOLDOWN_SECONDS;
      setSendLabel(`Resend in ${remaining} seconds`);

      if (cooldownIntervalRef.current !== null) {
        window.clearInterval(cooldownIntervalRef.current);
      }

      cooldownIntervalRef.current = window.setInterval(() => {
        remaining -= 1;
        if (remaining > 0) {
          setSendLabel(`Resend in ${remaining} seconds`);
        } else {
          if (cooldownIntervalRef.current !== null) {
            window.clearInterval(cooldownIntervalRef.current);
            cooldownIntervalRef.current = null;
          }
          setSendLabel("Send login code");
        }
      }, 1000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not send login code.";
      toast.error(message);
      setSendLabel("Send login code");
    }
  }

  async function handleVerifyOtp() {
    if (!otp.trim()) {
      toast.error("Enter the login code from your email.");
      return;
    }

    setVerifyDisabled(true);

    try {
      const result = await postApi<VerifyResponse>("/api/otp/verify", {
        leadId,
        otp: otp.trim(),
      });
      router.push(result.redirectUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not verify login code.";
      toast.error(message);
    } finally {
      setVerifyDisabled(false);
    }
  }

  return (
    <form
      className="mt-8 space-y-6 rounded-lg border border-border bg-card p-6"
      onSubmit={(event) => {
        event.preventDefault();
        void handleVerifyOtp();
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="parent-email">Parent email</Label>
        <Input
          id="parent-email"
          type="email"
          className={REG_TOUCH_CLASS}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </div>

      <button
        type="button"
        className={cn(buttonVariants({ size: "lg" }), REG_TOUCH_CLASS, "w-full sm:w-auto")}
        disabled={sendDisabled}
        onClick={() => void handleSendOtp()}
      >
        {sendLabel}
      </button>

      <div className="space-y-2">
        <Label htmlFor="one-time-pin">Login code</Label>
        <Input
          id="one-time-pin"
          inputMode="numeric"
          className={REG_TOUCH_CLASS}
          value={otp}
          onChange={(event) => setOtp(event.target.value)}
          placeholder="6-digit code from email"
          maxLength={6}
          required
        />
      </div>

      <button
        type="submit"
        className={cn(buttonVariants({ size: "lg" }), REG_TOUCH_CLASS, "w-full sm:w-auto")}
        disabled={verifyDisabled || !otp.trim()}
      >
        Continue to Student Information
      </button>
    </form>
  );
}
