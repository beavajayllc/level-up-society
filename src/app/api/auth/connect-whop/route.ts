import { NextResponse } from "next/server";
import { EnvNotConfiguredError, isLusAuthConfigured } from "@/lib/env";
import { isSameOriginRequest } from "@/lib/lus-auth-validation";
import {
  getCurrentLusUser,
  hasLinkedWhopAccount,
} from "@/lib/lus-account";
import { setPkceCookie } from "@/lib/pkce-cookie";
import {
  buildAuthorizeUrl,
  randomString,
  sanitizeNextPath,
  type PkceState,
} from "@/lib/whop-oauth";

function redirectTo(request: Request, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, request.url), {
    status: 303,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "Request origin was not accepted." },
      { status: 403, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return redirectTo(request, "/connect-whop?error=invalid_request");
  }
  const nextValue = form.get("next");
  const next = sanitizeNextPath(typeof nextValue === "string" ? nextValue : null) ?? "/members";
  if (!isLusAuthConfigured()) {
    return redirectTo(request, "/connect-whop?error=not_configured");
  }

  let account;
  try {
    account = await getCurrentLusUser();
  } catch (error) {
    console.error("[auth] LUS identity check failed before Whop connection:", error instanceof Error ? error.message : "unknown error");
    return redirectTo(request, "/connect-whop?error=auth_unavailable");
  }
  if (!account) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `/connect-whop?next=${encodeURIComponent(next)}`);
    return NextResponse.redirect(loginUrl, {
      status: 303,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  try {
    if (await hasLinkedWhopAccount(account.id)) {
      return redirectTo(request, "/connect-whop?error=already_linked");
    }
  } catch (error) {
    console.error("[auth] Whop link status lookup failed:", error instanceof Error ? error.message : "unknown error");
    return redirectTo(request, "/connect-whop?error=auth_unavailable");
  }

  const pkce: PkceState = {
    codeVerifier: randomString(32),
    state: randomString(16),
    nonce: randomString(16),
    next,
    link: true,
    lusUserId: account.id,
  };

  try {
    await setPkceCookie(pkce);
    return NextResponse.redirect(await buildAuthorizeUrl(pkce), {
      status: 303,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    if (error instanceof EnvNotConfiguredError) {
      console.error("[auth] WHOP is not configured:", error.missing);
      return redirectTo(request, "/connect-whop?error=not_configured");
    }
    throw error;
  }
}
