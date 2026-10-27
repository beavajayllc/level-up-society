import { NextResponse, type NextRequest } from "next/server";
import { EnvNotConfiguredError } from "@/lib/env";
import { clearPkceCookie, readPkceCookie } from "@/lib/pkce-cookie";
import { checkMembership } from "@/lib/whop-access";
import { createMobileLoginCode } from "@/lib/mobile-auth";
import {
  getLinkedWhopAccount,
  getCurrentLusUser,
  saveLinkedWhopAccount,
  WhopAccountLinkError,
} from "@/lib/lus-account";
import {
  exchangeCodeForTokens,
  fetchUserInfo,
  readIdTokenNonce,
} from "@/lib/whop-oauth";

function redirectTo(request: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, request.url), {
    headers: { "Cache-Control": "private, no-store" },
  });
}

function redirectToMobile(error?: string, code?: string): NextResponse {
  const target = new URL("levelupsociety://auth/complete");
  if (error) target.searchParams.set("error", error);
  if (code) target.searchParams.set("code", code);
  return NextResponse.redirect(target, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const pkce = await readPkceCookie();
  const mobile = pkce?.mobile === true;
  const linking = pkce?.link === true;

  const fail = async (webError: string, mobileError = webError) => {
    await clearPkceCookie();
    if (mobile) return redirectToMobile(mobileError);
    if (linking) {
      return redirectTo(request, `/connect-whop?error=${encodeURIComponent(webError)}&next=${encodeURIComponent(pkce?.next ?? "/members")}`);
    }
    return redirectTo(request, `/login?error=${encodeURIComponent(webError)}`);
  };

  if (!pkce || !returnedState || pkce.state !== returnedState) {
    return fail("state_mismatch");
  }

  if (error) {
    console.error("[auth] WHOP returned an OAuth error:", error);
    return fail("oauth_denied");
  }

  if (!code) {
    return fail("missing_params");
  }

  if (!mobile && !linking) {
    return fail("lus_login_required");
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

    if (linking) {
      let lusUser;
      try {
        lusUser = await getCurrentLusUser();
      } catch (error) {
        console.error("[auth] LUS verification during Whop linking failed:", error instanceof Error ? error.name : "unknown error");
        return fail("auth_unavailable");
      }
      if (!lusUser || !pkce?.lusUserId || lusUser.id !== pkce.lusUserId) {
        return fail("account_changed");
      }

      let linkedAccount;
      try {
        linkedAccount = await getLinkedWhopAccount(lusUser.id);
      } catch (error) {
        console.error("[auth] existing Whop link check failed:", error instanceof Error ? error.name : "unknown error");
        return fail("auth_unavailable");
      }
      if (linkedAccount) {
        if (linkedAccount.user.sub !== user.sub) {
          throw new WhopAccountLinkError(
            "This Level Up Society account is already connected to a different Whop account.",
            "already_linked",
          );
        }
        await clearPkceCookie();
        return redirectTo(request, pkce.next ?? "/members");
      }

      try {
        await saveLinkedWhopAccount(lusUser.id, user, tokens, Date.now());
      } catch (error) {
        if (error instanceof WhopAccountLinkError) throw error;
        console.error("[auth] Whop link could not be saved:", error instanceof Error ? error.name : "unknown error");
        return fail("auth_unavailable");
      }
      await clearPkceCookie();
      return redirectTo(request, pkce.next ?? "/members");
    }

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

    return fail("lus_login_required");
  } catch (caught) {
    if (caught instanceof WhopAccountLinkError) {
      console.error("[auth] Whop account link conflict");
      return fail(caught.reason === "already_linked" ? "already_linked" : "link_conflict");
    }
    if (caught instanceof EnvNotConfiguredError) {
      console.error("[auth] WHOP is not configured:", caught.missing);
      return fail("not_configured");
    }
    console.error("[auth] callback failed:", caught instanceof Error ? caught.name : "unknown error");
    return fail("oauth_failed");
  }
}
