import { NextResponse } from "next/server";
import { z } from "zod";
import { checkMembership } from "@/lib/whop-access";
import {
  exchangeMobileLoginCode,
  MobileAuthError,
  revokeMobileSession,
} from "@/lib/mobile-auth";

const requestSchema = z.object({ code: z.string().min(40).max(50) });

export async function POST(request: Request): Promise<NextResponse> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_code" }, { status: 400 });
  }

  try {
    const result = await exchangeMobileLoginCode(parsed.data.code);
    const membership = await checkMembership(result.session.user.sub);
    if (membership === "unknown") {
      await revokeMobileSession(result.sessionToken).catch(() => undefined);
      return NextResponse.json(
        { error: "membership_check_failed" },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        sessionToken: result.sessionToken,
        user: result.session.user,
        membership,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[auth] mobile code exchange failed:", error instanceof Error ? error.name : "unknown error");
    return NextResponse.json(
      { error: error instanceof MobileAuthError && error.status === 401 ? "invalid_code" : "auth_unavailable" },
      { status: error instanceof MobileAuthError ? error.status : 503 },
    );
  }
}
