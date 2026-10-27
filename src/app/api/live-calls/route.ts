import { NextResponse } from "next/server";
import { getRequestSession } from "@/lib/session";
import { checkSessionMembership } from "@/lib/whop-access";
import { getLiveCalls } from "@/lib/whop-livestream";

/**
 * The members area polls this so a call that goes live shows up without the
 * member having to refresh the page.
 *
 * Member only: without a WHOP session and an active Level Up Pro membership
 * this returns a bare, empty state rather than any call details.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const session = await getRequestSession(request);
  if (session.unavailable) {
    return NextResponse.json({ connected: false }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
  const user = session.user;

  if (!user) {
    return NextResponse.json({ connected: false }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
  }

  const membership = await checkSessionMembership(user.sub, session.mobile === true);
  if (membership === "unknown") {
    return NextResponse.json(
      { connected: false, error: "membership_check_failed" },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  if (membership !== "active" && membership !== "trialing") {
    return NextResponse.json(
      { connected: false },
      { status: 403, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const state = await getLiveCalls();
  return NextResponse.json(state, {
    headers: { "Cache-Control": "no-store" },
  });
}
