import { NextResponse } from "next/server";
import { EnvNotConfiguredError } from "@/lib/env";
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
  return NextResponse.redirect(url);
}

export async function GET(): Promise<NextResponse> {
  const pkce: PkceState = {
    codeVerifier: randomString(32),
    state: randomString(16),
    nonce: randomString(16),
    mobile: true,
  };
  await setPkceCookie(pkce);

  try {
    return NextResponse.redirect(await buildAuthorizeUrl(pkce));
  } catch (error) {
    if (error instanceof EnvNotConfiguredError) {
      console.error("[auth] WHOP is not configured:", error.missing);
      return callbackError("not_configured");
    }
    console.error("[auth] mobile login could not start:", error);
    return callbackError("login_unavailable");
  }
}
