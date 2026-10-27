import { NextResponse } from "next/server";
import { sanitizeNextPath } from "@/lib/whop-oauth";

export async function GET(request: Request): Promise<NextResponse> {
  const next = sanitizeNextPath(new URL(request.url).searchParams.get("next")) ?? "/members";
  const target = new URL("/login", request.url);
  target.searchParams.set("next", next);
  return NextResponse.redirect(target, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
