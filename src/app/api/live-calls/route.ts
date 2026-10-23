import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { checkMembershipCached } from "@/lib/whop-access";
import { getLiveCalls } from "@/lib/whop-livestream";

/**
 * The members area polls this so a call that goes live shows up without the
 * member having to refresh the page.
 *
 * Member only: without a WHOP session and an active Level Up Pro membership
 * this returns a bare, empty state rather than any call details.
 */
export async function GET(): Promise<NextResponse> {
  const session = await getSession();
  const user = session.user;

  if (!user) {
    return NextResponse.json({ connected: false }, { status: 401 });
  }

  const membership = await checkMembershipCached(user.sub);
  if (membership !== "active" && membership !== "trialing") {
    return NextResponse.json({ connected: false }, { status: 403 });
  }

  const state = await getLiveCalls();
  return NextResponse.json(state, {
    headers: { "Cache-Control": "no-store" },
  });
}
