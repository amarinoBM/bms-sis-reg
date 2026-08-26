"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { FormTextInput } from "@/app/reg/_components/form-fields";
import { OTP_RESEND_COOLDOWN_SECONDS } from "@/config/backendless";
import { buttonVariants } from "@/components/ui/button-variants";
import { REG_TOUCH_CLASS } from "@/lib/reg-ui";
import { cn } from "@/lib/utils";
import { postApi } from "@/lib/client-api";
import { messageFromRegApiError } from "@/lib/reg-api-errors";

type OtpFormProps = {
  leadId: string;
  maskedEmail?: string | null;
};

type SendResponse = { cooldownSeconds: number };
type VerifyResponse = {
  redirectUrl: string;
  studentName: string;
  students: { studentName: string; objectId: string }[];
};

function sanitizeOtp(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

export function OtpForm({ leadId, maskedEmail }: OtpFormProps) {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sendLabel, setSendLabel] = useState("Send login code");
  const [sendInFlight, setSendInFlight] = useState(false);
  const [verifyDisabled, setVerifyDisabled] = useState(false);
  const cooldownIntervalRef = useRef<number | null>(null);
  const sendDisabled = sendInFlight || sendLabel !== "Send login code" || !maskedEmail;

  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current !== null) {
        window.clearInterval(cooldownIntervalRef.current);
      }
    };
  }, []);

  async function handleSendOtp() {
    if (!maskedEmail) {
      toast.error("We do not have a parent email on file for this link.");
      return;
    }

    setSendInFlight(true);
    setSendLabel("Sending login code…");

    try {
      const result = await postApi<SendResponse>("/api/otp/send", {
        leadId,
      });

      setCodeSent(true);
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
      const message = messageFromRegApiError(error, "Could not send login code.");
      toast.error(message);
      setSendLabel("Send login code");
    } finally {
      setSendInFlight(false);
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
      const message = messageFromRegApiError(error, "Could not verify login code.");
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
      <div className="space-y-4">
        <p className="text-body text-foreground">
          We will send a login code to{" "}
          <span className="font-medium">{maskedEmail ?? "the parent email on file"}</span>.
        </p>
        {!maskedEmail ? (
          <p className="text-label text-muted-foreground">
            We could not find a parent email for this link. Contact{" "}
            <a href="mailto:help@brilliantmicroschool.org" className="text-primary underline">
              help@brilliantmicroschool.org
            </a>
            .
          </p>
        ) : null}

        <button
          type="button"
          className={cn(buttonVariants({ size: "lg" }), REG_TOUCH_CLASS, "w-full sm:w-auto")}
          disabled={sendDisabled}
          onClick={() => void handleSendOtp()}
        >
          {sendLabel}
        </button>
      </div>

      <div className="space-y-4 border-t border-border pt-6">
        {codeSent ? (
          <p className="text-label text-muted-foreground">
            Enter the 6-digit code from your email.
          </p>
        ) : (
          <p className="text-label text-muted-foreground">
            Send a login code first, then enter it below.
          </p>
        )}

        <FormTextInput
          id="one-time-pin"
          label="Login code"
          value={otp}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="6-digit code from email"
          maxLength={6}
          required
          disabled={sendInFlight}
          onChange={(value) => setOtp(sanitizeOtp(value))}
        />

        <button
          type="submit"
          className={cn(buttonVariants({ size: "lg" }), REG_TOUCH_CLASS, "w-full sm:w-auto")}
          disabled={verifyDisabled || sendInFlight || !otp.trim()}
        >
          Continue to Student Information
        </button>
      </div>
    </form>
  );
}
