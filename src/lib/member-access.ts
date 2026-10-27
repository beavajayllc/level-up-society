import "server-only";

import { redirect } from "next/navigation";
import { getCurrentLusUser, getLinkedWhopAccount, type LusUser } from "@/lib/lus-account";
import { checkWhopMembership, type MembershipState } from "@/lib/whop-access";
import type { WhopUserInfo } from "@/lib/whop-oauth";
import { isAuthConfigured, isLusAuthConfigured } from "@/lib/env";

export interface MemberAccess {
  user: WhopUserInfo;
  lusUser: LusUser;
  membership: MembershipState;
}

/**
 * The gate for every members-only route.
 *
 * Two independent checks:
 *  1. A LUS account must be signed in and linked to a verified WHOP account.
 *  2. WHOP must report an active (or trialing) membership right now.
 *
 * Check 2 runs on every page load, so a membership that lapses or is refunded
 * is cut off immediately rather than at the next login.
 */
export async function requireMember(
  nextPath = "/members",
): Promise<MemberAccess> {
  if (!isLusAuthConfigured() || !isAuthConfigured()) {
    redirect("/members?error=not_configured");
  }

  let lusUser: LusUser | null;
  try {
    lusUser = await getCurrentLusUser();
  } catch (error) {
    console.error("[auth] LUS account verification failed:", error instanceof Error ? error.message : "unknown error");
    redirect("/members?error=auth_check_failed");
  }

  if (!lusUser) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  let linked;
  try {
    linked = await getLinkedWhopAccount(lusUser.id);
  } catch (error) {
    console.error("[auth] Whop account lookup failed:", error instanceof Error ? error.message : "unknown error");
    redirect("/members?error=auth_check_failed");
  }
  if (!linked) {
    redirect(`/connect-whop?next=${encodeURIComponent(nextPath)}`);
  }

  const user = linked.user;

  let membership: MembershipState;
  try {
    membership = await checkWhopMembership(user.sub);
  } catch (error) {
    console.error("[auth] Whop membership check failed:", error instanceof Error ? error.message : "unknown error");
    redirect("/members?error=check_failed");
  }

  if (membership === "unknown") {
    // WHOP could not answer. Do not tell the member their membership is gone
    // when the truth is that we could not check.
    redirect("/members?error=check_failed");
  }

  if (membership !== "active" && membership !== "trialing") {
    redirect("/join?error=no_membership");
  }

  return { user, lusUser, membership };
}
