import { NextResponse, type NextRequest } from "next/server";
import { EnvNotConfiguredError } from "@/lib/env";
import { clearPkceCookie, readPkceCookie } from "@/lib/pkce-cookie";
import { getSession } from "@/lib/session";
import { checkMembership } from "@/lib/whop-access";
import {
  exchangeCodeForTokens,
  fetchUserInfo,
  readIdTokenNonce,
} from "@/lib/whop-oauth";

function redirectTo(request: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    console.error(
      "[auth] WHOP returned an error:",
      error,
      url.searchParams.get("error_description"),
    );
    return redirectTo(request, "/members?error=oauth_denied");
  }

  if (!code || !returnedState) {
    return redirectTo(request, "/members?error=missing_params");
  }

  const pkce = await readPkceCookie();
  if (!pkce || pkce.state !== returnedState) {
    return redirectTo(request, "/members?error=state_mismatch");
  }

  try {
    const tokens = await exchangeCodeForTokens(code, pkce.codeVerifier);

    if (tokens.id_token) {
      const nonce = readIdTokenNonce(tokens.id_token);
      if (nonce !== pkce.nonce) {
        throw new Error("id_token nonce mismatch");
      }
    }

    const user = await fetchUserInfo(tokens.access_token);
    const membership = await checkMembership(user.sub);

    await clearPkceCookie();

    // No active membership means no session at all. An inactive member is
    // turned away here and can never reach the members area.
    if (membership !== "active" && membership !== "trialing") {
      console.error(
        `[auth] login blocked for user ${user.sub}: membership=${membership}`,
      );
      return redirectTo(
        request,
        membership === "unknown"
          ? "/members?error=check_failed"
          : "/members?error=no_membership",
      );
    }

    const session = await getSession();
    session.user = user;
    session.tokens = tokens;
    session.membership = membership;
    session.obtainedAt = Date.now();
    await session.save();

    return redirectTo(request, pkce.next ?? "/members");
  } catch (caught) {
    if (caught instanceof EnvNotConfiguredError) {
      console.error("[auth] WHOP is not configured:", caught.missing);
      return redirectTo(request, "/members?error=not_configured");
    }
    console.error("[auth] callback failed:", caught);
    return redirectTo(request, "/members?error=oauth_failed");
  }
}
