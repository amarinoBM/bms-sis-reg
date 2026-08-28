"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormTextInput } from "@/app/reg/_components/form-fields";
import { AdminRegistration } from "./admin-registration";
import { ADMIN_IDLE_MS, ADMIN_MAX_MS } from "@/modules/admin/policy";
import { postApi } from "@/lib/client-api";
import type { AdminSearchItem, AdminRegistrationResult } from "@/server/admin/registrations";
import type { AdminFormState, AdminUploadResult } from "@/app/reg/sis/_components/step-form";
import { readTranscriptFiles } from "@/modules/wizard/transcript-fields";

type SearchPage = { results: AdminSearchItem[]; nextOffset: number | null };
export function AdminWorkspace({ issuedAt, lastSeenAt }: { issuedAt: number; lastSeenAt: number }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminSearchItem[]>([]);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState<{ leadId: string; objectId: string } | null>(null);
  const [record, setRecord] = useState<AdminRegistrationResult | null>(null);
  const [expired, setExpired] = useState(false);
  const lastActivity = useRef(lastSeenAt);
  const lastTouch = useRef(lastSeenAt);
  const operation = useRef(0);
  const active = useRef(true);
  const currentTarget = useRef(target);
  const formState = useRef<AdminFormState>({ dirty: false, busy: false });
  const [formBusy, setFormBusy] = useState(false);
  const updateFormState = useCallback((next: AdminFormState) => {
    if (!active.current) return;
    formState.current = next;
    setFormBusy(next.busy);
  }, []);
  const canNavigate = useCallback(() => {
    if (!active.current || formState.current.busy) return false;
    if (formState.current.dirty && !window.confirm("Discard unsaved answers? Uploaded files have already been saved.")) return false;
    formState.current = { dirty: false, busy: false };
    return true;
  }, []);

  useEffect(() => {
    active.current = true;
    let alive = true;
    let touching = false;
    function expire() {
      if (!alive) return;
      active.current = false; currentTarget.current = null; operation.current++;
      setExpired(true); setRecord(null); setResults([]);
      router.replace("/admin/login");
    }
    async function activity(event: Event) {
      if (!event.isTrusted || document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastActivity.current >= ADMIN_IDLE_MS || now - issuedAt >= ADMIN_MAX_MS) { expire(); return; }
      lastActivity.current = now;
      if (touching || now - lastTouch.current < 60_000) return;
      touching = true;
      try {
        await postApi("/api/admin/session", {});
        lastTouch.current = Date.now();
      } catch { expire(); }
      finally { touching = false; }
    }
    function check() {
      if (Date.now() - lastActivity.current >= ADMIN_IDLE_MS || Date.now() - issuedAt >= ADMIN_MAX_MS) expire();
    }
    function beforeUnload(event: BeforeUnloadEvent) {
      if (active.current && (formState.current.dirty || formState.current.busy)) {
        event.preventDefault(); event.returnValue = "";
      }
    }
    // Real interaction, not a background heartbeat, extends the idle deadline.
    window.addEventListener("pointerdown", activity, { passive: true });
    window.addEventListener("keydown", activity, { passive: true });
    window.addEventListener("scroll", activity, { passive: true });
    window.addEventListener("pageshow", check);
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("visibilitychange", check);
    const timer = window.setInterval(check, 10_000);
    return () => {
      alive = false; active.current = false; operation.current += 1; window.clearInterval(timer);
      window.removeEventListener("pointerdown", activity);
      window.removeEventListener("keydown", activity);
      window.removeEventListener("scroll", activity);
      window.removeEventListener("pageshow", check); document.removeEventListener("visibilitychange", check);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [issuedAt, router]);

  function handleError(error: unknown) {
    const value = error as { code?: string; message?: string };
    if (value.code === "UNAUTHENTICATED" || value.code === "FORBIDDEN") {
      active.current = false; currentTarget.current = null; operation.current++; setExpired(true); setRecord(null); setResults([]); router.replace("/admin/login");
    } else setMessage(value.message ?? "Could not load registrations. Please try again.");
  }
  async function search() {
    if (!canNavigate()) return;
    const id = ++operation.current;
    currentTarget.current = null;
    setBusy(true); setMessage(""); setResults([]); setSearched(false); setRecord(null); setTarget(null);
    const found = new Map<string, AdminSearchItem>();
    try {
      let offset: number | null = 0;
      do {
        const page: SearchPage = await postApi("/api/admin/search", { query, offset });
        if (id !== operation.current) return;
        for (const item of page.results) found.set(item.objectId, item);
        setResults([...found.values()]);
        offset = page.nextOffset;
        if (offset !== null) setMessage("Searching remaining registrations…");
      } while (offset !== null);
      setMessage(""); setSearched(true);
    } catch (error) { if (id === operation.current) { handleError(error); setMessage("Search could not finish. Any results shown may be incomplete. Please try again."); } }
    finally { if (id === operation.current) setBusy(false); }
  }
  async function open(next: { leadId: string; objectId: string }, refresh = false) {
    if (refresh) {
      if (!active.current || currentTarget.current !== next) return;
    } else {
      if (!canNavigate()) return;
      currentTarget.current = next;
    }
    const id = ++operation.current;
    setBusy(true); setMessage(""); if (!refresh) setRecord(null); setTarget(next);
    try {
      const result = await postApi<AdminRegistrationResult>("/api/admin/registration", next);
      if (active.current && currentTarget.current === next && id === operation.current) setRecord(result);
    } catch (error) { if (id === operation.current) handleError(error); if (refresh) throw error; }
    finally { if (id === operation.current) setBusy(false); }
  }
  async function signOut() {
    if (active.current && !canNavigate()) return;
    active.current = false; currentTarget.current = null; operation.current++; setRecord(null); setResults([]); setExpired(true);
    try { await postApi("/api/admin/logout", {}); router.replace("/admin/login"); router.refresh(); }
    catch { setMessage("Sign-out could not be confirmed. Try again before leaving this device."); }
  }
  function uploaded(expected: { leadId: string; objectId: string }, upload: AdminUploadResult) {
    if (!active.current || currentTarget.current !== expected) return;
    setRecord((current) => {
      if (!current || current.studentInfo.objectId !== expected.objectId) return current;
      const value = upload.fieldKey === "transcriptFiles" ? [...readTranscriptFiles(current.student.transcriptFiles), upload.url] : upload.url;
      return { ...current, adminVersion: upload.adminVersion, student: { ...current.student, [upload.fieldKey]: value } };
    });
  }
  if (expired) return <div><p role="status">{message || "Signing out…"}</p><Button onClick={() => void signOut()}>Sign out</Button></div>;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <p className="text-label font-medium text-foreground">Admin · View and edit</p>
      <Button variant="outline" className="min-h-11" disabled={formBusy} onClick={() => void signOut()}>Sign out</Button>
    </div>
    <h1 className="text-title font-semibold">{target ? record?.studentInfo.studentName ?? "Student registration" : "Find a registration"}</h1>
    {target ? <>
      <Button variant="outline" className="min-h-11" disabled={formBusy} onClick={() => { if (!canNavigate()) return; currentTarget.current = null; operation.current++; setTarget(null); setRecord(null); setBusy(false); setMessage(""); }}>Back to search</Button>
      {record && <div>
        <label htmlFor="admin-student" className="mb-2 block text-label font-medium">Student</label>
        <select id="admin-student" className="min-h-11 w-full rounded-md border border-input bg-card px-3 text-body" value={record.studentInfo.objectId} disabled={busy || formBusy} onChange={(e) => void open({ leadId: target.leadId, objectId: e.target.value })}>
          {record.enrolledStudents.map((s) => <option key={s.objectId} value={s.objectId}>{s.studentName}</option>)}
        </select>
      </div>}
      {record && <AdminRegistration key={record.studentInfo.objectId} result={record} leadId={target.leadId} onSaved={() => open(target, true)} onUploaded={(upload) => uploaded(target, upload)} onFormStateChange={updateFormState} canNavigate={canNavigate} busy={busy || formBusy} />}
    </> : <>
      <p className="text-body text-muted-foreground">Find an eligible student’s saved form by name, parent email, lead ID, or registration link.</p>
      <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(e) => { e.preventDefault(); void search(); }}>
        <div className="min-w-0 flex-1"><FormTextInput id="admin-search" label="Search registrations" value={query} onChange={setQuery} required placeholder="Student name, parent email, or registration link" /></div>
        <Button size="lg" className="min-h-11" type="submit" disabled={busy || query.trim().length < 2}>Search</Button>
      </form>
      {results.length > 0 && <ul className="divide-y divide-border border-y border-border">
        {results.map((item) => <li key={item.objectId} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0"><p className="text-body font-semibold break-words">{item.studentName} {item.lastName}</p><p className="text-label text-muted-foreground break-all">{item.parentEmail || "No parent email recorded"}</p><p className="mt-1 text-label">{item.completed ? "Submitted" : "In progress"}</p></div>
          <Button variant="outline" className="min-h-11 shrink-0" disabled={busy} onClick={() => void open(item)}>View registration<span className="sr-only"> for {item.studentName} {item.lastName}</span></Button>
        </li>)}
      </ul>}
      {searched && results.length === 0 && <p className="text-body">No eligible registrations match. Try another name, parent email, or paste the registration link.</p>}
    </>}
    {busy && <p role="status" className="text-body text-muted-foreground">{message || "Loading…"}</p>}
    {!busy && message && <p role="alert" className="text-body text-destructive">{message}</p>}
  </div>;
}
