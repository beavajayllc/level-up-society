import "server-only";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { checkMembershipCached, type MembershipState } from "@/lib/whop-access";
import type { WhopUserInfo } from "@/lib/whop-oauth";

export interface MemberAccess {
  user: WhopUserInfo;
  membership: MembershipState;
}

/**
 * The gate for every members-only route.
 *
 * Two independent checks:
 *  1. A WHOP session must exist (the member signed in with WHOP).
 *  2. WHOP must report an active (or trialing) membership right now.
 *
 * Check 2 runs on every page load, so a membership that lapses or is refunded
 * is cut off immediately rather than at the next login.
 */
export async function requireMember(): Promise<MemberAccess> {
  const session = await getSession();
  const user = session.user;

  if (!user) {
    redirect("/api/auth/login?next=%2Fmembers");
  }

  const membership = await checkMembershipCached(user.sub);

  if (membership !== "active" && membership !== "trialing") {
    redirect("/members?error=no_membership");
  }

  return { user, membership };
}
