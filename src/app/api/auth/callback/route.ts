import { NextResponse, type NextRequest } from "next/server";
import { EnvNotConfiguredError } from "@/lib/env";
import { clearPkceCookie, readPkceCookie } from "@/lib/pkce-cookie";
import { getSession } from "@/lib/session";
import { checkMembership } from "@/lib/whop-access";
import { createMobileLoginCode } from "@/lib/mobile-auth";
import {
  exchangeCodeForTokens,
  fetchUserInfo,
  readIdTokenNonce,
} from "@/lib/whop-oauth";

function redirectTo(request: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, request.url));
}

function redirectToMobile(error?: string, code?: string): NextResponse {
  const target = new URL("levelupsociety://auth/complete");
  if (error) target.searchParams.set("error", error);
  if (code) target.searchParams.set("code", code);
  return NextResponse.redirect(target);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const pkce = await readPkceCookie();
  const mobile = pkce?.mobile === true;

  const fail = async (webError: string, mobileError = webError) => {
    await clearPkceCookie();
    return mobile
      ? redirectToMobile(mobileError)
      : redirectTo(request, `/members?error=${encodeURIComponent(webError)}`);
  };

  if (error) {
    console.error(
      "[auth] WHOP returned an error:",
      error,
      url.searchParams.get("error_description"),
    );
    return fail("oauth_denied");
  }

  if (!code || !returnedState) {
    return fail("missing_params");
  }

  if (!pkce || pkce.state !== returnedState) {
    return fail("state_mismatch");
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

    // Web sign-in still requires an active Level Up Pro subscription. Mobile
    // sign-in also admits authenticated WHOP accounts without a subscription
    // so they can purchase one through Apple's or Google's in-app flow.
    if (
      membership !== "active" &&
      membership !== "trialing" &&
      (!mobile || membership === "unknown")
    ) {
      console.error(
        `[auth] login blocked for user ${user.sub}: membership=${membership}`,
      );
      return fail(
        membership === "unknown" ? "check_failed" : "no_membership",
        membership === "unknown" ? "check_failed" : "no_membership",
      );
    }

    const sessionData = {
      user,
      tokens,
      membership,
      obtainedAt: Date.now(),
    };

    if (mobile) {
      const mobileCode = await createMobileLoginCode(sessionData);
      await clearPkceCookie();
      return redirectToMobile(undefined, mobileCode);
    }

    const session = await getSession();
    session.user = user;
    session.tokens = tokens;
    session.membership = membership;
    session.obtainedAt = sessionData.obtainedAt;
    await session.save();
    await clearPkceCookie();

    return redirectTo(request, pkce.next ?? "/members");
  } catch (caught) {
    if (caught instanceof EnvNotConfiguredError) {
      console.error("[auth] WHOP is not configured:", caught.missing);
      return fail("not_configured");
    }
    console.error("[auth] callback failed:", caught);
    return fail("oauth_failed");
  }
}
