import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { EnvNotConfiguredError, getAppUrl } from "@/lib/env";
import { getCanonicalMobileLoginRedirect } from "@/lib/auth-origin";
import { setPkceCookie } from "@/lib/pkce-cookie";
import {
  buildAuthorizeUrl,
  randomString,
  type PkceState,
} from "@/lib/whop-oauth";

const APP_CALLBACK = "levelupsociety://auth/complete";

function callbackError(error: string): NextResponse {
  const url = new URL(APP_CALLBACK);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function GET(request: Request): Promise<NextResponse> {
  let canonicalRedirect: URL | null;
  try {
    canonicalRedirect = getCanonicalMobileLoginRedirect(request.url, getAppUrl());
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof EnvNotConfiguredError) {
      console.error("[auth] app origin is not configured:", error.missing);
      return callbackError("not_configured");
    }
    console.error("[auth] mobile login origin is unavailable:", error instanceof Error ? error.name : "unknown error");
    return callbackError("login_unavailable");
  }

  if (canonicalRedirect) {
    return NextResponse.redirect(canonicalRedirect, {
      status: 307,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  const pkce: PkceState = {
    codeVerifier: randomString(32),
    state: randomString(16),
    nonce: randomString(16),
    mobile: true,
  };
  try {
    await setPkceCookie(pkce);
    return NextResponse.redirect(await buildAuthorizeUrl(pkce), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof EnvNotConfiguredError) {
      console.error("[auth] WHOP is not configured:", error.missing);
      return callbackError("not_configured");
    }
    console.error("[auth] mobile login could not start:", error instanceof Error ? error.name : "unknown error");
    return callbackError("login_unavailable");
  }
}
