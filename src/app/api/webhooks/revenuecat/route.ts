import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getEnv } from "@/lib/env";

const eventSchema = z.object({
  event: z.object({
    type: z.string(),
    app_user_id: z.string().optional(),
    original_app_user_id: z.string().optional(),
    aliases: z.array(z.string()).optional(),
    entitlement_id: z.string().nullable().optional(),
    entitlement_ids: z.array(z.string()).nullable().optional(),
    transferred_from: z.array(z.string()).optional(),
    transferred_to: z.array(z.string()).optional(),
  }).passthrough(),
}).passthrough();

function matchesSecret(supplied: string | null, expected: string): boolean {
  if (!supplied) return false;
  const suppliedBytes = Buffer.from(supplied);
  const expectedBytes = Buffer.from(`Bearer ${expected}`);
  return suppliedBytes.length === expectedBytes.length &&
    timingSafeEqual(suppliedBytes, expectedBytes);
}

export async function POST(request: Request): Promise<NextResponse> {
  const env = getEnv();
  if (!env.REVENUECAT_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }
  if (!matchesSecret(request.headers.get("authorization"), env.REVENUECAT_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Invalid webhook authorization." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid RevenueCat event." }, { status: 400 });
  }

  const event = parsed.data.event;
  const eventEntitlements = event.entitlement_ids ??
    (event.entitlement_id ? [event.entitlement_id] : null);
  if (
    eventEntitlements &&
    !eventEntitlements.includes(env.REVENUECAT_ENTITLEMENT_ID)
  ) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const userIds = new Set([
    event.app_user_id,
    event.original_app_user_id,
    ...(event.aliases ?? []),
    ...(event.transferred_from ?? []),
    ...(event.transferred_to ?? []),
  ].filter((userId): userId is string =>
    typeof userId === "string" && userId.startsWith("user_"),
  ));

  if (userIds.size === 0) {
    return NextResponse.json({ received: true, ignored: true });
  }
  const gatewayUrl = env.TELEGRAM_GATEWAY_URL;
  const gatewaySecret = env.TELEGRAM_GATEWAY_SECRET;
  if (!gatewayUrl || !gatewaySecret) {
    return NextResponse.json({ error: "Telegram gateway is not configured." }, { status: 503 });
  }

  const results = await Promise.all(
    [...userIds].map(async (whopUserId) => {
      try {
        return await fetch(new URL("/v1/members/sync", gatewayUrl), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${gatewaySecret}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ whopUserId }),
          cache: "no-store",
          signal: AbortSignal.timeout(10_000),
        });
      } catch (error) {
        console.error("[revenuecat webhook] Telegram gateway request failed:", error);
        return null;
      }
    }),
  );

  if (results.some((response) => !response?.ok)) {
    const statuses = results.map((response) => response?.status ?? "unreachable");
    console.error("[revenuecat webhook] Telegram membership sync failed:", statuses);
    return NextResponse.json({ error: "Membership sync failed." }, { status: 503 });
  }

  return NextResponse.json({ received: true });
}
