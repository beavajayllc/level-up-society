import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { checkMembershipCached } from "@/lib/whop-access";
import { getChatMessages, postChatMessage } from "@/lib/whop-chat";
import { refreshTokens } from "@/lib/whop-oauth";
import type { WhopUserInfo } from "@/lib/whop-oauth";

/**
 * The live chat behind the live calls page.
 *
 * Member only: without a WHOP session and an active Level Up Pro membership
 * this returns a bare, empty chat rather than any message.
 */

interface LiveChatMember {
  user: WhopUserInfo;
  accessToken: string | null;
}

async function memberOrNull(): Promise<LiveChatMember | null> {
  const session = await getSession();
  const user = session.user;
  if (!user) return null;

  const membership = await checkMembershipCached(user.sub);
  if (membership !== "active" && membership !== "trialing") return null;

  if (!session.tokens) return { user, accessToken: null };

  const tokenExpiresAt =
    (session.obtainedAt ?? 0) + session.tokens.expires_in * 1000;
  if (tokenExpiresAt <= Date.now() + 60_000) {
    try {
      session.tokens = await refreshTokens(session.tokens.refresh_token);
      session.obtainedAt = Date.now();
      await session.save();
    } catch {
      console.error("[auth] Whop chat token refresh failed");
      return { user, accessToken: null };
    }
  }

  return { user, accessToken: session.tokens.access_token };
}

export async function GET(): Promise<NextResponse> {
  const member = await memberOrNull();
  if (!member) {
    return NextResponse.json(
      {
        connected: false,
        channelId: null,
        messages: [],
        requiresReauthorization: false,
        unavailable: true,
      },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!member.accessToken) {
    return NextResponse.json(
      {
        connected: false,
        channelId: null,
        messages: [],
        requiresReauthorization: true,
        unavailable: false,
      },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const chat = await getChatMessages(member.accessToken);
  return NextResponse.json(chat, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const member = await memberOrNull();
  if (!member) {
    return NextResponse.json({ error: "not_authorized" }, { status: 401 });
  }
  if (!member.accessToken) {
    return NextResponse.json({ error: "chat_auth_required" }, { status: 401 });
  }

  let body: { content?: unknown };
  try {
    const parsed: unknown = await request.json();
    body =
      typeof parsed === "object" && parsed !== null
        ? (parsed as { content?: unknown })
        : {};
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const text = typeof body.content === "string" ? body.content.trim() : "";

  if (!text) {
    return NextResponse.json({ error: "empty_message" }, { status: 400 });
  }

  if (text.length > 500) {
    return NextResponse.json({ error: "message_too_long" }, { status: 400 });
  }

  const result = await postChatMessage(text, member.accessToken);
  if (result.requiresReauthorization) {
    return NextResponse.json({ error: "chat_auth_required" }, { status: 403 });
  }
  if (!result.message) {
    return NextResponse.json({ error: "chat_unavailable" }, { status: 503 });
  }

  return NextResponse.json({ message: result.message }, { status: 201 });
}
