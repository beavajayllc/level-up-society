import { unwrapWebhook } from "@whop/sdk/helpers";
import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";

type WhopWebhookEvent = {
  id?: string;
  type?: string;
  data?: Record<string, unknown>;
};

const membershipEvents = new Set([
  "membership.activated",
  "membership.deactivated",
  "membership.updated",
  "membership.cancel_at_period_end_changed",
]);

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function whopUserId(event: WhopWebhookEvent): string | null {
  const data = record(event.data);
  const user = record(data?.user);
  const membership = record(data?.membership);
  const membershipUser = record(membership?.user);
  const candidates = [
    data?.user_id,
    user?.id,
    membership?.user_id,
    membershipUser?.id,
  ];

  return candidates.find(
    (candidate): candidate is string =>
      typeof candidate === "string" && candidate.startsWith("user_"),
  ) ?? null;
}

export async function POST(request: Request) {
  const env = getEnv();
  if (!env.WHOP_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  const body = await request.text();
  let event: WhopWebhookEvent;
  try {
    event = unwrapWebhook<WhopWebhookEvent>(body, {
      headers: Object.fromEntries(request.headers),
      key: env.WHOP_WEBHOOK_SECRET,
    });
  } catch {
    console.warn("[whop webhook] signature verification failed");
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  if (!event.type || !membershipEvents.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  const userId = whopUserId(event);
  if (!userId) {
    console.error(`[whop webhook] ${event.type} did not include a WHOP user id`);
    return NextResponse.json({ error: "Membership event is missing its user." }, { status: 400 });
  }

  if (!env.TELEGRAM_GATEWAY_URL || !env.TELEGRAM_GATEWAY_SECRET) {
    return NextResponse.json({ error: "Telegram gateway is not configured." }, { status: 503 });
  }

  let response: Response;
  try {
    response = await fetch(
      new URL("/v1/members/sync", env.TELEGRAM_GATEWAY_URL),
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.TELEGRAM_GATEWAY_SECRET}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ whopUserId: userId }),
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );
  } catch (error) {
    console.error("[whop webhook] Telegram gateway request failed:", error);
    return NextResponse.json({ error: "Membership sync service could not be reached." }, { status: 502 });
  }

  if (!response.ok) {
    console.error(`[whop webhook] Telegram gateway responded ${response.status}`);
    return NextResponse.json({ error: "Membership sync failed." }, { status: 503 });
  }

  return NextResponse.json({ received: true });
}
