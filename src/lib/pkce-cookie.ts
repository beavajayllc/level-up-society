import { cookies } from "next/headers";
import { getEnv } from "@/lib/env";
import { openPkceState, sealPkceState } from "@/lib/pkce-state";
import type { PkceStatePayload } from "@/lib/pkce-state";

const PKCE_COOKIE = "whop_pkce";

export async function setPkceCookie(pkce: PkceStatePayload): Promise<void> {
  const store = await cookies();
  store.set(PKCE_COOKIE, sealPkceState(pkce, getEnv().SESSION_SECRET), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
}

export async function readPkceCookie(): Promise<PkceStatePayload | null> {
  const store = await cookies();
  const value = store.get(PKCE_COOKIE)?.value;
  if (!value) return null;

  try {
    return openPkceState(value, getEnv().SESSION_SECRET);
  } catch {
    return null;
  }
}

export async function clearPkceCookie(): Promise<void> {
  const store = await cookies();
  store.delete(PKCE_COOKIE);
}
