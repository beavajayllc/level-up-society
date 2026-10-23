import "server-only";

import {
  getIronSession,
  type IronSession,
  type SessionOptions,
} from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getEnv } from "@/lib/env";
import type { MembershipState } from "@/lib/whop-access";
import type { WhopTokens, WhopUserInfo } from "@/lib/whop-oauth";

export interface SessionData {
  user?: WhopUserInfo;
  tokens?: WhopTokens;
  /** Membership state at the moment the session was created. */
  membership?: MembershipState;
  /** Epoch ms when the WHOP access token was issued. */
  obtainedAt?: number;
}

export function sessionOptions(): SessionOptions {
  return {
    password: getEnv().SESSION_SECRET,
    cookieName: "whop_session",
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    },
  };
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const store = await cookies();
  return getIronSession<SessionData>(store, sessionOptions());
}

export async function getCurrentUser(): Promise<WhopUserInfo | null> {
  const session = await getSession();
  return session.user ?? null;
}

export async function requireUser(): Promise<WhopUserInfo> {
  const user = await getCurrentUser();
  if (!user) redirect("/api/auth/login");
  return user;
}
