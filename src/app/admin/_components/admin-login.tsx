"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormTextInput } from "@/app/reg/_components/form-fields";
import { postApi } from "@/lib/client-api";

export function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [resendAt, setResendAt] = useState(0);
  async function send() {
    if (Date.now() < resendAt) { setMessage("Please wait 30 seconds before requesting another code."); return; }
    setBusy(true); setMessage("");
    try {
      const result = await postApi<{ challengeId: string; cooldownSeconds: number }>("/api/admin/otp/send", { email });
      setChallengeId(result.challengeId); setOtp(""); setResendAt(Date.now() + result.cooldownSeconds * 1000);
      setMessage("If this address has admin access, a code is on its way. It expires in 5 minutes.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not send the code. Please try again."); }
    finally { setBusy(false); }
  }
  async function verify() {
    setBusy(true); setMessage("");
    try {
      await postApi("/api/admin/otp/verify", { email, otp, challengeId });
      router.replace("/admin"); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not verify the code. Please try again."); }
    finally { setBusy(false); }
  }
  return <div className="mt-4 max-w-lg">
    <p className="text-body text-muted-foreground">Use your approved BMS email to view and edit student registrations. This does not sign you in as a parent.</p>
    <form className="mt-8 space-y-6 rounded-lg border border-border bg-card p-6" onSubmit={(e) => { e.preventDefault(); void (challengeId ? verify() : send()); }}>
      <FormTextInput id="admin-email" label="Work email" type="email" autoComplete="email" required value={email} disabled={busy || !!challengeId} onChange={setEmail} />
      {challengeId && <FormTextInput id="admin-code" label="Login code" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} value={otp} onChange={(v) => setOtp(v.replace(/\D/g, "").slice(0, 6))} />}
      {message && <p role="status" className="text-body text-foreground">{message}</p>}
      <Button size="lg" className="min-h-11 w-full sm:w-auto" disabled={busy || (!!challengeId && otp.length !== 6)} type="submit">
        {busy ? "Please wait…" : challengeId ? "Sign in" : "Send login code"}
      </Button>
      {challengeId && <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" className="min-h-11" disabled={busy} onClick={() => void send()}>Resend code</Button>
        <Button type="button" variant="ghost" className="min-h-11" disabled={busy} onClick={() => { setChallengeId(""); setMessage(""); setOtp(""); }}>Use another email</Button>
      </div>}
    </form>
  </div>;
}
