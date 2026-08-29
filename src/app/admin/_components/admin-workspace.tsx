"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FormTextInput } from "@/app/reg/_components/form-fields";
import { AdminRegistration } from "./admin-registration";
import { ADMIN_IDLE_MS, ADMIN_MAX_MS, isValidAdminSearchQuery } from "@/modules/admin/policy";
import { fetchApi, postApi } from "@/lib/client-api";
import type { AdminSearchItem, AdminSearchScope, AdminRegistrationResult } from "@/server/admin/registrations";
import type { AdminFormState, AdminUploadResult } from "@/app/reg/sis/_components/step-form";
import { readTranscriptFiles } from "@/modules/wizard/transcript-fields";

type SearchPage = { results: AdminSearchItem[]; nextOffset: number | null; scope: AdminSearchScope };
function groupSearchResults(items: AdminSearchItem[]): Record<string, AdminSearchItem[]> {
  return items.reduce<Record<string, AdminSearchItem[]>>((groups, item) => {
    (groups[item.leadId] ??= []).push(item);
    return groups;
  }, {});
}
function searchItemStatus(item: AdminSearchItem): string {
  if (item.enrolled) return item.completed ? "Submitted" : "In progress";
  if (item.completed) return "Not currently enrolled · Submitted";
  return `Not currently enrolled · ${item.savedSections} section${item.savedSections === 1 ? "" : "s"} saved`;
}
export function AdminWorkspace({ issuedAt, lastSeenAt }: { issuedAt: number; lastSeenAt: number }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchScope, setSearchScope] = useState<AdminSearchScope>("enrolled");
  const [results, setResults] = useState<AdminSearchItem[]>([]);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [searchNote, setSearchNote] = useState("");
  const [target, setTarget] = useState<{ leadId: string; objectId: string } | null>(null);
  const [record, setRecord] = useState<AdminRegistrationResult | null>(null);
  const [expired, setExpired] = useState(false);
  const lastActivity = useRef(lastSeenAt);
  const lastTouch = useRef(lastSeenAt);
  const operation = useRef(0);
  const searchRequest = useRef<AbortController | null>(null);
  const active = useRef(true);
  const currentTarget = useRef(target);
  const formState = useRef<AdminFormState>({ dirty: false, busy: false });
  const pendingNavigation = useRef<((allowed: boolean) => void) | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const updateFormState = useCallback((next: AdminFormState) => {
    if (!active.current) return;
    formState.current = next;
    setFormBusy(next.busy);
  }, []);
  const canNavigate = useCallback(async () => {
    if (!active.current || formState.current.busy) return false;
    if (formState.current.dirty) {
      return new Promise<boolean>((resolve) => {
        pendingNavigation.current = resolve;
        setDiscardDialogOpen(true);
      });
    }
    formState.current = { dirty: false, busy: false };
    return true;
  }, []);

  function finishDiscardDialog(allowed: boolean) {
    const resolve = pendingNavigation.current;
    pendingNavigation.current = null;
    setDiscardDialogOpen(false);
    if (allowed) formState.current = { dirty: false, busy: false };
    resolve?.(allowed);
  }

  function handleDiscardDialogOpenChange(open: boolean) {
    setDiscardDialogOpen(open);
    if (!open && pendingNavigation.current) finishDiscardDialog(false);
  }

  useEffect(() => {
    active.current = true;
    let alive = true;
    let touching = false;
    function expire() {
      if (!alive) return;
      active.current = false; currentTarget.current = null; operation.current++;
      searchRequest.current?.abort();
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
    function guardLinkNavigation(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      ) return;
      const link = event.target.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.hasAttribute("download")) return;
      if (!formState.current.dirty && !formState.current.busy) return;
      event.preventDefault();
      void canNavigate().then((allowed) => {
        if (allowed) window.location.assign(link.href);
      });
    }
    // Real interaction, not a background heartbeat, extends the idle deadline.
    window.addEventListener("pointerdown", activity, { passive: true });
    window.addEventListener("keydown", activity, { passive: true });
    window.addEventListener("scroll", activity, { passive: true });
    window.addEventListener("pageshow", check);
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", guardLinkNavigation, true);
    document.addEventListener("visibilitychange", check);
    const timer = window.setInterval(check, 10_000);
    return () => {
      alive = false; active.current = false; operation.current += 1; window.clearInterval(timer);
      pendingNavigation.current?.(false); pendingNavigation.current = null;
      searchRequest.current?.abort();
      window.removeEventListener("pointerdown", activity);
      window.removeEventListener("keydown", activity);
      window.removeEventListener("scroll", activity);
      window.removeEventListener("pageshow", check); document.removeEventListener("visibilitychange", check);
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", guardLinkNavigation, true);
    };
  }, [canNavigate, issuedAt, router]);

  function handleError(error: unknown) {
    const value = error as { code?: string; message?: string };
    if (value.code === "UNAUTHENTICATED" || value.code === "FORBIDDEN") {
      searchRequest.current?.abort();
      active.current = false; currentTarget.current = null; operation.current++; setExpired(true); setRecord(null); setResults([]); router.replace("/admin/login");
    } else setMessage(value.message ?? "Could not load registrations. Please try again.");
  }
  function cancelSearch(clearResults = false) {
    if (!clearResults && !searchRequest.current) return;
    searchRequest.current?.abort(); searchRequest.current = null;
    operation.current++; setSearching(false); setSearched(false);
    setMessage("");
    setSearchNote(clearResults ? "" : "Search stopped.");
    if (clearResults) setResults([]);
  }
  async function search() {
    if (!await canNavigate()) return;
    searchRequest.current?.abort();
    const controller = new AbortController();
    searchRequest.current = controller;
    const id = ++operation.current;
    currentTarget.current = null;
    setSearching(true); setSearchScope("enrolled"); setMessage(""); setSearchNote("");
    setSearched(false); setRecord(null); setTarget(null); setResults([]);
    const found = new Map<string, AdminSearchItem>();
    try {
      async function searchAllPages(scope: AdminSearchScope) {
        setSearchScope(scope);
        let offset: number | null = 0;
        do {
          const timeout = window.setTimeout(() => controller.abort(), 30_000);
          let page: SearchPage;
          try {
            page = await fetchApi<SearchPage>("/api/admin/search", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ query, offset, scope }), signal: controller.signal,
            });
          } finally { window.clearTimeout(timeout); }
          if (id !== operation.current) return false;
          for (const item of page.results) found.set(item.objectId, item);
          setResults([...found.values()]);
          offset = page.nextOffset;
        } while (offset !== null);
        return true;
      }

      const enrolledFinished = await searchAllPages("enrolled");
      if (!enrolledFinished || id !== operation.current) return;
      if (found.size === 0) {
        const otherFinished = await searchAllPages("other");
        if (!otherFinished || id !== operation.current) return;
      }
      setSearched(true);
      setSearchNote("");
    } catch (error) { if (id === operation.current) {
      handleError(error);
      if (active.current) setMessage("The registration search could not finish. Check the email or lead ID and try again.");
    } }
    finally { if (id === operation.current) { setSearching(false); searchRequest.current = null; } }
  }
  async function open(next: { leadId: string; objectId: string }, refresh = false) {
    if (refresh) {
      if (!active.current || currentTarget.current !== next) return;
    } else {
      if (!await canNavigate()) return;
      currentTarget.current = next;
    }
    cancelSearch();
    const id = ++operation.current;
    setBusy(true); setMessage(""); setTarget(next);
    try {
      const result = await postApi<AdminRegistrationResult>("/api/admin/registration", next);
      if (active.current && currentTarget.current === next && id === operation.current) setRecord(result);
    } catch (error) {
      if (id === operation.current) {
        handleError(error);
        if (!refresh) setRecord(null);
      }
      if (refresh) throw error;
    }
    finally { if (id === operation.current) setBusy(false); }
  }
  async function signOut() {
    if (active.current && !await canNavigate()) return;
    searchRequest.current?.abort();
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
  const resultGroups = groupSearchResults(results);
  const showFamilyLead = Object.keys(resultGroups).length > 1;
  if (expired) return <div><p role="status">{message || "Signing out…"}</p><Button onClick={() => void signOut()}>Sign out</Button></div>;
  return <div className="space-y-6">
    <AlertDialog open={discardDialogOpen} onOpenChange={handleDiscardDialogOpenChange}>
      <AlertDialogContent size="default" className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Discard unsaved answers?</AlertDialogTitle>
          <AlertDialogDescription>
            Any answers you changed in this section will be lost. Uploaded files have already been saved.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep editing</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => finishDiscardDialog(true)}>
            Discard answers
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <p className="text-label font-medium text-foreground">Admin · View and edit</p>
      <Button variant="outline" className="min-h-11" disabled={formBusy} onClick={() => void signOut()}>Sign out</Button>
    </div>
    <h1 className="text-title font-semibold">{target ? record?.studentInfo.studentName ?? "Student registration" : "Find a registration"}</h1>
    {target ? <>
      <Button variant="outline" className="min-h-11" disabled={formBusy} onClick={async () => { if (!await canNavigate()) return; currentTarget.current = null; operation.current++; setTarget(null); setRecord(null); setBusy(false); setMessage(""); if (!searched && results.length) setSearchNote("Search stopped before every registration was checked."); }}>Back to search</Button>
      {record && <div>
        <label htmlFor="admin-student" className="mb-2 block text-label font-medium">Student</label>
        <select id="admin-student" className="min-h-11 w-full rounded-md border border-input bg-card px-3 text-body" value={record.studentInfo.objectId} disabled={busy || formBusy} onChange={(e) => void open({ leadId: target.leadId, objectId: e.target.value })}>
          {record.enrolledStudents.map((s) => <option key={s.objectId} value={s.objectId}>{s.studentName}</option>)}
        </select>
      </div>}
      {record && <AdminRegistration key={record.studentInfo.objectId} result={record} leadId={target.leadId} onSaved={() => open(target, true)} onUploaded={(upload) => uploaded(target, upload)} onFormStateChange={updateFormState} canNavigate={canNavigate} busy={busy || formBusy} />}
    </> : <>
      <p className="text-body text-muted-foreground">Enter a full parent email, lead ID, or registration link.</p>
      <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(e) => { e.preventDefault(); void search(); }}>
        <div className="min-w-0 flex-1"><FormTextInput id="admin-search" label="Search registrations" value={query} onChange={(value) => { cancelSearch(true); setQuery(value); }} required placeholder="parent@example.com, lead_… or registration link" /></div>
        <Button size="lg" className="min-h-11" type="submit" disabled={searching || !isValidAdminSearchQuery(query)}>Search</Button>
      </form>
      {searching && <div className="flex items-center gap-2">
        <p role="status" className="text-body text-muted-foreground">
          {searchScope === "enrolled" ? "Searching enrolled students…" : "No enrolled registration found. Checking other saved registrations…"}
        </p>
        <Button variant="ghost" size="icon" type="button" aria-label="Stop search" onClick={() => cancelSearch()}><X aria-hidden="true" /></Button>
      </div>}
      {!searching && searchNote && <p role="status" className="text-body text-muted-foreground">{searchNote}</p>}
      {!searching && message && <p role="alert" className="text-body text-destructive">{message}</p>}
      {results.length > 0 && <div className="space-y-5">
        {Object.entries(resultGroups).map(([leadId, items]) => {
          const conflict = items.find((item) => item.alternateParentEmail);
          return <section key={leadId} className="border-y border-border">
            {showFamilyLead && <p className="pt-4 text-label text-muted-foreground">Family · {leadId}</p>}
            {conflict && <p className="pt-3 text-label text-destructive">Two parent emails are saved: {conflict.parentEmail} and {conflict.alternateParentEmail}. The parent must confirm the main email in Parent contact.</p>}
            <ul className="divide-y divide-border">
              {items.map((item) => <li key={item.objectId} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0"><p className="text-body font-semibold break-words">{item.studentName} {item.lastName}</p><p className="text-label text-muted-foreground break-all">{item.parentEmail || "No parent email recorded"}</p><p className="mt-1 text-label">{searchItemStatus(item)}</p></div>
                <Button variant="outline" className="min-h-11 shrink-0" onClick={() => void open(item)}>View registration<span className="sr-only"> for {item.studentName} {item.lastName}</span></Button>
              </li>)}
            </ul>
          </section>;
        })}
      </div>}
      {searched && results.length === 0 && <p className="text-body">No saved registration matches this email or lead ID.</p>}
    </>}
    {busy && <p role="status" className="text-body text-muted-foreground">{message || "Loading…"}</p>}
    {target && !busy && message && <p role="alert" className="text-body text-destructive">{message}</p>}
  </div>;
}
