import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { revokeToken } from "@/lib/whop-oauth";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSession();

  if (session.tokens?.refresh_token) {
    try {
      await revokeToken(session.tokens.refresh_token);
    } catch (error) {
      console.error("[auth] revoke failed:", error);
    }
  }

  session.destroy();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
