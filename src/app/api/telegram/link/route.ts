import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { getSession } from "@/lib/session";
import { checkMembership } from "@/lib/whop-access";

export async function POST(request: Request) {
  const env = getEnv();
  const origin = request.headers.get("origin");

  if (origin && origin !== new URL(env.NEXT_PUBLIC_APP_URL).origin) {
    return NextResponse.json({ error: "Request origin was not accepted." }, { status: 403 });
  }

  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: "Sign in to your member account first." }, { status: 401 });
  }

  const membership = await checkMembership(session.user.sub);
  if (membership === "unknown") {
    return NextResponse.json({ error: "We couldn't verify your membership. Please try again." }, { status: 503 });
  }
  if (membership !== "active" && membership !== "trialing") {
    return NextResponse.json({ error: "An active Level Up Pro membership is required." }, { status: 403 });
  }

  if (!env.TELEGRAM_GATEWAY_URL || !env.TELEGRAM_GATEWAY_SECRET) {
    return NextResponse.json(
      { error: "Secure Telegram access is not configured yet." },
      { status: 503 },
    );
  }

  if (!env.TELEGRAM_GATEWAY_READY) {
    return NextResponse.json(
      { error: "Secure Telegram access is not ready yet." },
      { status: 503 },
    );
  }

  let response: Response;
  try {
    response = await fetch(
      new URL("/v1/link-requests", env.TELEGRAM_GATEWAY_URL),
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.TELEGRAM_GATEWAY_SECRET}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ whopUserId: session.user.sub }),
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );
  } catch (error) {
    console.error("[telegram] gateway request failed:", error);
    return NextResponse.json(
      { error: "The Telegram connection service could not be reached. Please try again." },
      { status: 502 },
    );
  }

  if (!response.ok) {
    console.error(`[telegram] gateway responded ${response.status}`);
    return NextResponse.json(
      { error: "We couldn't create your Telegram link. Please try again." },
      { status: response.status >= 500 ? 503 : response.status },
    );
  }

  const payload: unknown = await response.json().catch(() => null);
  let telegramUrl: URL | null = null;
  if (
    payload &&
    typeof payload === "object" &&
    "telegramUrl" in payload &&
    typeof payload.telegramUrl === "string"
  ) {
    try {
      telegramUrl = new URL(payload.telegramUrl);
    } catch {
      telegramUrl = null;
    }
  }

  if (
    !telegramUrl ||
    telegramUrl.protocol !== "https:" ||
    telegramUrl.hostname !== "t.me"
  ) {
    console.error("[telegram] gateway returned an unexpected response");
    return NextResponse.json(
      { error: "The Telegram service returned an unexpected response. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ telegramUrl: telegramUrl.toString() });
}
