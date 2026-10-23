import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { checkMembershipCached } from "@/lib/whop-access";
import { getChatMessages, postChatMessage } from "@/lib/whop-chat";
import type { WhopUserInfo } from "@/lib/whop-oauth";

/**
 * The live chat behind the live calls page.
 *
 * Member only: without a WHOP session and an active Level Up Pro membership
 * this returns a bare, empty chat rather than any message.
 */

function memberName(user: WhopUserInfo): string {
  const raw = user.name ?? user.preferred_username ?? user.email ?? "Member";
  return raw.split(" ")[0] ?? raw;
}

async function memberOrNull(): Promise<WhopUserInfo | null> {
  const session = await getSession();
  const user = session.user;
  if (!user) return null;

  const membership = await checkMembershipCached(user.sub);
  if (membership !== "active" && membership !== "trialing") return null;

  return user;
}

export async function GET(): Promise<NextResponse> {
  const user = await memberOrNull();
  if (!user) {
    return NextResponse.json({ connected: false, messages: [] }, { status: 401 });
  }

  const chat = await getChatMessages();
  return NextResponse.json(chat, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const user = await memberOrNull();
  if (!user) {
    return NextResponse.json({ error: "not_authorized" }, { status: 401 });
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

  const message = await postChatMessage(text, memberName(user));
  if (!message) {
    return NextResponse.json({ error: "chat_unavailable" }, { status: 503 });
  }

  return NextResponse.json({ message }, { status: 201 });
}
