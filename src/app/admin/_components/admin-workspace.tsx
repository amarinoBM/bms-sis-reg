"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { ADMIN_IDLE_MS, ADMIN_MAX_MS } from "@/modules/admin/policy";
import { fetchApi, postApi } from "@/lib/client-api";
import type { AdminSearchItem, AdminSearchStatus, AdminRegistrationResult } from "@/server/admin/registrations";
import type { AdminFormState, AdminUploadResult } from "@/app/reg/sis/_components/step-form";
import { readTranscriptFiles } from "@/modules/wizard/transcript-fields";

type SearchPage = { results: AdminSearchItem[]; nextOffset: number | null; matchedFamily: boolean };
export function AdminWorkspace({ issuedAt, lastSeenAt }: { issuedAt: number; lastSeenAt: number }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"name" | "email">("name");
  const [searchStatus, setSearchStatus] = useState<AdminSearchStatus>("all");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<AdminSearchItem[]>([]);
  const [nextSearchOffset, setNextSearchOffset] = useState<number | null>(null);
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
    setSearchNote(clearResults ? "" : "Search stopped. You can search the next group when you are ready.");
    if (clearResults) { setResults([]); setNextSearchOffset(null); }
  }
  async function search(loadMore = false) {
    if (!await canNavigate()) return;
    const offset = loadMore ? nextSearchOffset : 0;
    if (offset === null) return;
    searchRequest.current?.abort();
    const controller = new AbortController();
    searchRequest.current = controller;
    const id = ++operation.current;
    currentTarget.current = null;
    setSearching(true); setMessage(""); setSearchNote(""); setSearched(false); setRecord(null); setTarget(null);
    if (!loadMore) { setResults([]); setNextSearchOffset(null); }
    const found = new Map<string, AdminSearchItem>((loadMore ? results : []).map((item) => [item.objectId, item]));
    try {
      // Search one bounded group at a time. Exact email matches return the whole
      // enrolled family and stop; broader searches continue only when requested.
      const timeout = window.setTimeout(() => controller.abort(), 30_000);
      let page: SearchPage;
      try {
        page = await fetchApi<SearchPage>("/api/admin/search", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, offset, mode: query.includes("@") ? "email" : searchMode, status: searchStatus }), signal: controller.signal,
        });
      } finally { window.clearTimeout(timeout); }
      if (id !== operation.current) return;
      for (const item of page.results) found.set(item.objectId, item);
      const nextResults = [...found.values()];
      setResults(nextResults); setNextSearchOffset(page.nextOffset); setSearched(page.nextOffset === null);
      if (page.matchedFamily) {
        const noun = searchStatus === "all" ? "enrolled student" : searchStatus === "submitted" ? "submitted registration" : "in-progress registration";
        setSearchNote(`Found ${page.results.length} ${noun}${page.results.length === 1 ? "" : "s"} in this family.`);
      } else if (page.nextOffset !== null) {
        setSearchNote(page.results.length ? "Matches were added below. Search the next group to continue." : "No matches in this group. Search the next group to continue.");
      }
    } catch (error) { if (id === operation.current) {
      handleError(error);
      if (active.current) setMessage("This search group could not be checked. Try again, or use a lead ID for a direct lookup.");
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
    setBusy(true); setMessage(""); if (!refresh) setRecord(null); setTarget(next);
    try {
      const result = await postApi<AdminRegistrationResult>("/api/admin/registration", next);
      if (active.current && currentTarget.current === next && id === operation.current) setRecord(result);
    } catch (error) { if (id === operation.current) handleError(error); if (refresh) throw error; }
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
      <Button variant="outline" className="min-h-11" disabled={formBusy} onClick={async () => { if (!await canNavigate()) return; currentTarget.current = null; operation.current++; setTarget(null); setRecord(null); setBusy(false); setMessage(""); if (!searched && results.length) setSearchNote("These are partial results. Search the next group to continue."); }}>Back to search</Button>
      {record && <div>
        <label htmlFor="admin-student" className="mb-2 block text-label font-medium">Student</label>
        <select id="admin-student" className="min-h-11 w-full rounded-md border border-input bg-card px-3 text-body" value={record.studentInfo.objectId} disabled={busy || formBusy} onChange={(e) => void open({ leadId: target.leadId, objectId: e.target.value })}>
          {record.enrolledStudents.map((s) => <option key={s.objectId} value={s.objectId}>{s.studentName}</option>)}
        </select>
      </div>}
      {record && <AdminRegistration key={record.studentInfo.objectId} result={record} leadId={target.leadId} onSaved={() => open(target, true)} onUploaded={(upload) => uploaded(target, upload)} onFormStateChange={updateFormState} canNavigate={canNavigate} busy={busy || formBusy} />}
    </> : <>
      <p className="text-body text-muted-foreground">Search enrolled students by name, family email, lead ID, or registration link.</p>
      <form className="grid gap-3 md:grid-cols-2 lg:grid-cols-[auto_auto_minmax(16rem,1fr)_auto] lg:items-end" onSubmit={(e) => { e.preventDefault(); void search(); }}>
        <div><label htmlFor="admin-search-mode" className="mb-2 block text-label font-medium">Search by</label>
          <select id="admin-search-mode" className="min-h-11 w-full rounded-md border border-input bg-card px-3 text-body" value={searchMode} onChange={(e) => { cancelSearch(true); setSearchMode(e.target.value as "name" | "email"); }}>
            <option value="name">Name or lead ID</option><option value="email">Parent email</option>
          </select>
        </div>
        <div><label htmlFor="admin-search-status" className="mb-2 block text-label font-medium">Registration status</label>
          <select id="admin-search-status" className="min-h-11 w-full rounded-md border border-input bg-card px-3 text-body" value={searchStatus} onChange={(e) => { cancelSearch(true); setSearchStatus(e.target.value as AdminSearchStatus); }}>
            <option value="all">All enrolled</option><option value="in_progress">In progress</option><option value="submitted">Submitted</option>
          </select>
        </div>
        <div className="min-w-0 flex-1"><FormTextInput id="admin-search" label="Search registrations" value={query} onChange={(value) => { cancelSearch(true); setQuery(value); }} required placeholder={searchMode === "email" ? "Parent email (full or partial)" : "Student name, lead_… or registration link"} /></div>
        <Button size="lg" className="min-h-11" type="submit" disabled={searching || query.trim().length < 2}>Search</Button>
      </form>
      {searching && <div className="flex flex-wrap items-center gap-3"><p role="status" className="text-body text-muted-foreground">{results.length ? "Searching the next group…" : "Searching enrolled students…"}</p><Button variant="outline" className="min-h-11" type="button" onClick={() => cancelSearch()}>Stop search</Button></div>}
      {!searching && searchNote && <p role="status" className="text-body text-muted-foreground">{searchNote}</p>}
      {!searching && message && <p role="alert" className="text-body text-destructive">{message}</p>}
      {results.length > 0 && <ul className="divide-y divide-border border-y border-border">
        {results.map((item) => <li key={item.objectId} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0"><p className="text-body font-semibold break-words">{item.studentName} {item.lastName}</p><p className="text-label text-muted-foreground break-all">{item.parentEmail || "No parent email recorded"}</p><p className="mt-1 text-label">{item.completed ? "Submitted" : "In progress"}</p></div>
          <Button variant="outline" className="min-h-11 shrink-0" onClick={() => void open(item)}>View registration<span className="sr-only"> for {item.studentName} {item.lastName}</span></Button>
        </li>)}
      </ul>}
      {!searching && nextSearchOffset !== null && <Button variant="outline" className="min-h-11" type="button" onClick={() => void search(true)}>Search next group</Button>}
      {searched && results.length === 0 && <p className="text-body">No eligible registrations match. Try another name, choose Parent email, or paste a lead ID or registration link.</p>}
    </>}
    {busy && <p role="status" className="text-body text-muted-foreground">{message || "Loading…"}</p>}
    {target && !busy && message && <p role="alert" className="text-body text-destructive">{message}</p>}
  </div>;
}
