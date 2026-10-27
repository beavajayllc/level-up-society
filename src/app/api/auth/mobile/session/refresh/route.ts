import { NextResponse } from "next/server";
import { readBearerToken } from "@/lib/mobile-auth";
import { getRequestSession } from "@/lib/session";
import { checkMembership } from "@/lib/whop-access";

export async function POST(request: Request): Promise<NextResponse> {
  if (!readBearerToken(request)) {
    return NextResponse.json({ error: "not_authorized" }, { status: 401 });
  }

  const session = await getRequestSession(request);
  if (session.unavailable) {
    return NextResponse.json({ error: "auth_unavailable" }, { status: 503 });
  }
  if (!session.user) {
    return NextResponse.json({ error: "not_authorized" }, { status: 401 });
  }

  const membership = await checkMembership(session.user.sub);
  if (membership === "unknown") {
    return NextResponse.json(
      { error: "membership_check_failed" },
      { status: 503 },
    );
  }

  session.membership = membership;
  await session.save();

  return NextResponse.json(
    { user: session.user, membership },
    { headers: { "Cache-Control": "no-store" } },
  );
}
