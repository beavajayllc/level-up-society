import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { checkMembership } from "@/lib/whop-access";

export const runtime = "nodejs";

const requestSchema = z.object({
  whopUserIds: z
    .array(z.string().startsWith("user_").max(100))
    .min(1)
    .max(100),
});

function hasGatewayAuth(request: Request, expected: string): boolean {
  const authorization = request.headers.get("authorization") ?? "";
  const prefix = "Bearer ";
  if (!authorization.startsWith(prefix)) return false;

  const provided = Buffer.from(authorization.slice(prefix.length));
  const secret = Buffer.from(expected);
  return provided.length === secret.length && timingSafeEqual(provided, secret);
}

export async function POST(request: Request) {
  const secret = getEnv().TELEGRAM_GATEWAY_SECRET;
  if (!secret || !hasGatewayAuth(request, secret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid WHOP user identifier." }, { status: 400 });
  }

  const memberships: Record<string, string> = {};
  for (let index = 0; index < parsed.data.whopUserIds.length; index += 5) {
    const batch = parsed.data.whopUserIds.slice(index, index + 5);
    const states = await Promise.all(
      batch.map(async (userId) => [userId, await checkMembership(userId)] as const),
    );
    for (const [userId, state] of states) memberships[userId] = state;
  }

  return NextResponse.json({ memberships });
}
