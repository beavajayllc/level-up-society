import "server-only";

import {
  getIronSession,
  type IronSession,
  type SessionOptions,
} from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getEnv, isLusAuthConfigured } from "@/lib/env";
import { withSaveHandler } from "@/lib/session-state";
import type { MembershipState } from "@/lib/whop-access";
import type { WhopTokens, WhopUserInfo } from "@/lib/whop-oauth";
import {
  getCurrentLusUser,
  getLinkedWhopAccount,
  saveRefreshedWhopCredentials,
} from "@/lib/lus-account";
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
  /** Native bearer sessions preserve the mobile membership verification path. */
  mobile?: boolean;
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
    if (!token) return { mobile: true, save: async () => undefined };

    try {
      const mobile = await loadMobileSession(token);
      if (!mobile) return { mobile: true, save: async () => undefined };

      return withSaveHandler(
        {
          user: mobile.user,
          tokens: mobile.tokens,
          membership: mobile.membership,
          obtainedAt: mobile.obtainedAt,
          mobile: true,
        },
        (session) => saveMobileSession(token, session),
      );
    } catch (error) {
      console.error("[auth] mobile session lookup failed:", error instanceof Error ? error.name : "unknown error");
      return { mobile: true, unavailable: true, save: async () => undefined };
    }
  }

  if (!isLusAuthConfigured()) {
    return { unavailable: true, save: async () => undefined };
  }

  try {
    const lusUser = await getCurrentLusUser();
    if (!lusUser) return { save: async () => undefined };

    const linked = await getLinkedWhopAccount(lusUser.id);
    if (!linked) return { save: async () => undefined };

    return withSaveHandler(
      {
        user: linked.user,
        tokens: linked.tokens,
        obtainedAt: linked.obtainedAt,
        mobile: false,
      },
      async (session) => {
        if (session.user && session.tokens) {
          await saveRefreshedWhopCredentials(
            lusUser.id,
            session.user.sub,
            session.user,
            session.tokens,
            session.obtainedAt ?? Date.now(),
          );
        }
      },
    );
  } catch (error) {
    console.error("[auth] LUS session lookup failed:", error instanceof Error ? error.message : "unknown error");
    return { mobile: false, unavailable: true, save: async () => undefined };
  }
}

export async function getCurrentUser(): Promise<WhopUserInfo | null> {
  const lusUser = await getCurrentLusUser();
  if (!lusUser) return null;
  const linked = await getLinkedWhopAccount(lusUser.id);
  return linked?.user ?? null;
}

export async function requireUser(): Promise<WhopUserInfo> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
