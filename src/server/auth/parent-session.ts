import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

import { getServerEnv } from "@/config/env";

export type ParentSessionData = {
  leadId?: string;
  studentName?: string;
  isLoggedIn?: boolean;
};

export const PARENT_SESSION_COOKIE = "bms-sis-reg-parent";

function getSessionOptions(): SessionOptions {
  const { authSecret } = getServerEnv();

  return {
    password: authSecret,
    cookieName: PARENT_SESSION_COOKIE,
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    },
  };
}

export async function getParentSession() {
  return getIronSession<ParentSessionData>(await cookies(), getSessionOptions());
}

export async function setParentSession(data: ParentSessionData) {
  const session = await getParentSession();
  session.leadId = data.leadId;
  session.studentName = data.studentName;
  session.isLoggedIn = data.isLoggedIn ?? true;
  await session.save();
}

export async function clearParentSession() {
  const session = await getParentSession();
  session.destroy();
}
