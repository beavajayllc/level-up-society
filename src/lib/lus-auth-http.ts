import { NextResponse } from "next/server";

export function authJson(
  body: unknown,
  init?: ResponseInit,
): NextResponse {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "private, no-store");
  headers.set("Vary", "Cookie");
  return NextResponse.json(body, { ...init, headers });
}
