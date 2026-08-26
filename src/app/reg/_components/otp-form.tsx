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

export function OtpForm({ leadId, maskedEmail }: OtpFormProps) {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [sendLabel, setSendLabel] = useState("Send login code");
  const [verifyDisabled, setVerifyDisabled] = useState(false);
  const cooldownIntervalRef = useRef<number | null>(null);
  const sendDisabled = sendLabel !== "Send login code" || !maskedEmail;

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

    setSendLabel("Sending login code…");

    try {
      const result = await postApi<SendResponse>("/api/otp/send", {
        leadId,
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

      <FormTextInput
        id="one-time-pin"
        label="Login code"
        value={otp}
        inputMode="numeric"
        placeholder="6-digit code from email"
        maxLength={6}
        required
        onChange={setOtp}
      />

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
