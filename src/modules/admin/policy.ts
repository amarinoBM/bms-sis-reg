import { AppError } from "@/core/app-error";

export const ADMIN_IDLE_MS = 30 * 60_000;
export const ADMIN_MAX_MS = 8 * 60 * 60_000;
export const ADMIN_OTP_SECONDS = 300;
export const ADMIN_EMAIL = "am@brilliantmicroschool.org";
export type AdminEditActor = { role: "admin"; actorRef: string; operationId: string };

export function isAllowedAdmin(email: string): boolean {
  return email.trim().toLowerCase() === ADMIN_EMAIL;
}

export function isAdminSessionActive(
  session: { issuedAt: number; lastSeenAt: number },
  now = Date.now(),
): boolean {
  return Number.isFinite(session.issuedAt) && Number.isFinite(session.lastSeenAt) &&
    session.issuedAt <= now && session.lastSeenAt <= now &&
    now - session.issuedAt < ADMIN_MAX_MS && now - session.lastSeenAt < ADMIN_IDLE_MS;
}

export function normalizeAdminSearch(query: string): { text: string } | { leadId: string } {
  const value = query.trim();
  if (value.length < 2 || value.length > 500) {
    throw new AppError({ code: "INVALID_INPUT", message: "Enter at least 2 characters, or paste a registration link." });
  }
  let leadId: string | null = value.startsWith("lead_") ? value : null;
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      leadId = url.searchParams.get("lead_id") ?? new URLSearchParams(url.hash.slice(1)).get("lead_id");
    } catch { /* Rejected below. */ }
    if (!leadId) throw new AppError({ code: "INVALID_INPUT", message: "That link does not contain a lead ID." });
  }
  if (leadId) {
    if (!/^lead_[a-zA-Z0-9_-]{1,150}$/.test(leadId)) {
      throw new AppError({ code: "INVALID_INPUT", message: "That lead ID is not valid." });
    }
    return { leadId };
  }
  return { text: value.toLowerCase() };
}
