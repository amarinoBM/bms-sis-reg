import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { AppError } from "@/core/app-error";
import { ADMIN_MAX_MS, isAdminSessionActive, isAllowedAdmin } from "@/modules/admin/policy";
import { adminConfig } from "./config";
import { readAdminValue, writeAdminValue, removeAdminValue } from "./store";

export const ADMIN_COOKIE = "bms-sis-reg-admin";
type AdminCookie = { id?: string };
export type AdminSession = { id: string; email: string; issuedAt: number; lastSeenAt: number };
async function cookieSession() {
  return getIronSession<AdminCookie>(await cookies(), {
    password: adminConfig().secret, cookieName: ADMIN_COOKIE, ttl: ADMIN_MAX_MS / 1000,
    cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/" },
  });
}
export async function createAdminSession(email: string) {
  if (!isAllowedAdmin(email)) throw new AppError({ code: "FORBIDDEN", message: "Admin access denied." });
  const cookie = await cookieSession();
  if (cookie.id) await removeAdminValue("session:" + cookie.id);
  const session: AdminSession = { id: randomUUID(), email, issuedAt: Date.now(), lastSeenAt: Date.now() };
  await writeAdminValue("session:" + session.id, session, ADMIN_MAX_MS / 1000);
  cookie.id = session.id;
  await cookie.save();
  return session;
}
export async function requireAdminSession(touch = true): Promise<AdminSession> {
  const cookie = await cookieSession();
  const session = cookie.id ? await readAdminValue<AdminSession>("session:" + cookie.id) : null;
  if (!session || session.id !== cookie.id || !isAllowedAdmin(session.email) || !isAdminSessionActive(session) ||
      await readAdminValue<boolean>("revoked:" + session.id)) {
    throw new AppError({ code: "UNAUTHENTICATED", message: "Your admin session expired. Sign in again." });
  }
  if (touch) {
    session.lastSeenAt = Date.now();
    await writeAdminValue("session:" + session.id, session, Math.max(1, Math.ceil((session.issuedAt + ADMIN_MAX_MS - Date.now()) / 1000)));
  }
  return session;
}
export async function destroyAdminSession() {
  const cookie = await cookieSession();
  if (cookie.id) {
    // A tombstone prevents an in-flight activity request from restoring a logged-out session.
    await writeAdminValue("revoked:" + cookie.id, true, ADMIN_MAX_MS / 1000);
    await removeAdminValue("session:" + cookie.id);
  }
  cookie.destroy();
}
