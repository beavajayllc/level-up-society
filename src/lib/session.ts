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
import {
  loadMobileSession,
  readBearerToken,
  saveMobileSession,
} from "@/lib/mobile-auth";

export interface SessionData {
  user?: WhopUserInfo;
  tokens?: WhopTokens;
  /** Membership state at the moment the session was created. */
  membership?: MembershipState;
  /** Epoch ms when the WHOP access token was issued. */
  obtainedAt?: number;
}

export interface RequestSession extends SessionData {
  /** A backing auth service is unavailable; protected routes must fail closed. */
  unavailable?: boolean;
  save(): Promise<void>;
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

/** Resolve the site's encrypted browser cookie or a revocable native-app token. */
export async function getRequestSession(request: Request): Promise<RequestSession> {
  const authorization = request.headers.get("authorization") ?? "";
  if (authorization.startsWith("Bearer ")) {
    const token = readBearerToken(request);
    if (!token) return { save: async () => undefined };

    try {
      const mobile = await loadMobileSession(token);
      if (!mobile) return { save: async () => undefined };

      const session: SessionData = {
        user: mobile.user,
        tokens: mobile.tokens,
        membership: mobile.membership,
        obtainedAt: mobile.obtainedAt,
      };
      return {
        ...session,
        save: () => saveMobileSession(token, session),
      };
    } catch (error) {
      console.error("[auth] mobile session lookup failed:", error);
      return { unavailable: true, save: async () => undefined };
    }
  }

  const session = await getSession();
  return {
    user: session.user,
    tokens: session.tokens,
    membership: session.membership,
    obtainedAt: session.obtainedAt,
    save: () => session.save(),
  };
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
