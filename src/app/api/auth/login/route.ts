import { NextResponse } from "next/server";
import { EnvNotConfiguredError } from "@/lib/env";
import { setPkceCookie } from "@/lib/pkce-cookie";
import {
  buildAuthorizeUrl,
  randomString,
  sanitizeNextPath,
  type PkceState,
} from "@/lib/whop-oauth";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const next = sanitizeNextPath(
      new URL(request.url).searchParams.get("next"),
    );

    const pkce: PkceState = {
      codeVerifier: randomString(32),
      state: randomString(16),
      nonce: randomString(16),
      ...(next ? { next } : {}),
    };

    await setPkceCookie(pkce);
    return NextResponse.redirect(await buildAuthorizeUrl(pkce));
  } catch (error) {
    if (error instanceof EnvNotConfiguredError) {
      console.error("[auth] WHOP is not configured:", error.missing);
      return NextResponse.redirect(
        new URL("/members?error=not_configured", request.url),
      );
    }
    throw error;
  }
}
