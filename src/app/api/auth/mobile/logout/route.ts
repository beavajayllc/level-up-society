import { NextResponse } from "next/server";
import { readBearerToken, revokeMobileSession } from "@/lib/mobile-auth";

export async function POST(request: Request): Promise<NextResponse> {
  const token = readBearerToken(request);
  if (token) {
    await revokeMobileSession(token).catch((error: unknown) => {
      console.error("[auth] mobile session revocation failed:", error instanceof Error ? error.name : "unknown error");
    });
  }
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
