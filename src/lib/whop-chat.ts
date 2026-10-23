import "server-only";

import { z } from "zod";
import { getEnv, whopSdkBaseUrl, type Env } from "@/lib/env";
import { getLiveCalls, type LivestreamFeed } from "@/lib/whop-livestream";

/**
 * WHOP chat.
 *
 * The live call chat lives on WHOP. WHOP does not publish a "list the live
 * chat channel" endpoint, so we resolve the channel by probing the ids that
 * WHOP can use for it and keeping the first one WHOP accepts. A channel only
 * exists while a call is on air, so the resolution is cached for a short
 * window and re-run whenever a call goes live.
 *
 * Every function here is defensive: if WHOP is unreachable, misconfigured,
 * or the channel cannot be found, the chat degrades to "open the live room"
 * instead of breaking the page.
 */

const messageUserSchema = z.object({
  id: z.string(),
  name: z.string().nullable().default(null),
  username: z.string().nullable().default(null),
  profile_picture_url: z.string().nullable().default(null),
});

const messageSchema = z.object({
  id: z.string(),
  content: z.string().nullable().default(null),
  created_at: z.string().default(""),
  message_type: z.string().nullable().default(null),
  user: messageUserSchema.nullable().default(null),
});

const messagesResponseSchema = z.object({
  data: z.array(messageSchema).default([]),
});

export interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  author: string;
  authorId: string | null;
  avatarUrl: string | null;
  isSystem: boolean;
}

export interface ChatState {
  /** True when WHOP answered and we have a chat channel to talk in. */
  connected: boolean;
  /** The WHOP channel id the messages live in. */
  channelId: string | null;
  /** Newest first. */
  messages: ChatMessage[];
}

const EMPTY_CHAT: ChatState = { connected: false, channelId: null, messages: [] };

/**
 * Build a WHOP API URL.
 *
 * `whopSdkBaseUrl` already carries the `/api/v1` prefix, so the path has to
 * be joined relatively. An absolute path would drop the prefix and 404.
 */
function whopApiUrl(env: Env, path: string): URL {
  const base = whopSdkBaseUrl(env);
  return new URL(path.replace(/^\/+/, ""), `${base}/`);
}

function toChatMessage(raw: z.infer<typeof messageSchema>): ChatMessage {
  const isSystem = raw.message_type === "system" || raw.message_type === "automated";
  return {
    id: raw.id,
    content: raw.content ?? "",
    createdAt: raw.created_at,
    author: raw.user?.name ?? raw.user?.username ?? "Member",
    authorId: raw.user?.id ?? null,
    avatarUrl: raw.user?.profile_picture_url ?? null,
    isSystem,
  };
}

/**
 * Every id WHOP could plausibly use for the chat behind a livestream.
 *
 * WHOP names chat channels `feed_…` and livestreams `lfeed_…`, and the
 * livestream id is built from the same opaque token. A live call only has a
 * chat channel while it is on air, so this list is probed against WHOP and
 * the first id WHOP accepts wins.
 */
function candidateChannelIds(
  stream: LivestreamFeed | null,
  experienceIds: string[],
): string[] {
  const ids = new Set<string>();

  if (stream) {
    const raw = stream.id.replace(/^lfeed_/, "");
    ids.add(`feed_${raw}`);
    ids.add(`feed_${stream.id}`);
    ids.add(stream.id);
  }

  for (const experienceId of experienceIds) {
    const raw = experienceId.replace(/^exp_/, "");
    ids.add(`feed_${raw}`);
    ids.add(experienceId);
  }

  return [...ids];
}

/** How long a resolved channel id is trusted before we look again. */
const CHANNEL_CACHE_MS = 30_000;

let cachedChannel: { id: string | null; expires: number } | null = null;

/**
 * Find the chat channel for the current live call.
 *
 * Returns null when nothing is live or WHOP does not accept any candidate.
 */
export async function resolveChatChannel(): Promise<string | null> {
  if (cachedChannel && cachedChannel.expires > Date.now()) {
    return cachedChannel.id;
  }

  let env: Env;
  try {
    env = getEnv();
  } catch {
    cachedChannel = { id: null, expires: Date.now() + CHANNEL_CACHE_MS };
    return null;
  }

  const state = await getLiveCalls();
  const stream = state.live;
  const experienceIds = [
    ...(state.experienceIds ?? []),
    ...(state.chatExperienceIds ?? []),
  ];

  if (!stream) {
    cachedChannel = { id: null, expires: Date.now() + CHANNEL_CACHE_MS };
    return null;
  }

  for (const candidate of candidateChannelIds(stream, experienceIds)) {
    if (await channelResponds(env, candidate)) {
      cachedChannel = { id: candidate, expires: Date.now() + CHANNEL_CACHE_MS };
      return candidate;
    }
  }

  cachedChannel = { id: null, expires: Date.now() + CHANNEL_CACHE_MS };
  return null;
}

/** True when WHOP lets us read this channel. */
async function channelResponds(env: Env, channelId: string): Promise<boolean> {
  const url = whopApiUrl(env, "messages");
  url.searchParams.set("channel_id", channelId);
  url.searchParams.set("first", "1");

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${env.WHOP_API_KEY}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** The recent messages in the live chat. */
export async function getChatMessages(limit = 40): Promise<ChatState> {
  const channelId = await resolveChatChannel();
  if (!channelId) return { ...EMPTY_CHAT };

  let env: Env;
  try {
    env = getEnv();
  } catch {
    return { ...EMPTY_CHAT };
  }

  const url = whopApiUrl(env, "messages");
  url.searchParams.set("channel_id", channelId);
  url.searchParams.set("first", String(limit));
  url.searchParams.set("direction", "asc");

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${env.WHOP_API_KEY}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`[whop] chat messages responded ${response.status}`);
      return { ...EMPTY_CHAT, channelId };
    }

    const parsed = messagesResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      console.error("[whop] chat messages returned an unexpected shape");
      return { ...EMPTY_CHAT, channelId };
    }

    const messages = parsed.data.data.map(toChatMessage);
    return { connected: true, channelId, messages };
  } catch (error) {
    console.error("[whop] chat messages failed:", error);
    return { ...EMPTY_CHAT, channelId };
  }
}

/**
 * Post a message into the live chat.
 *
 * WHOP stamps the message with the API key's own account, so the member's
 * name is carried in the text by the caller and shown on our side.
 */
export async function postChatMessage(
  content: string,
  authorName: string,
): Promise<ChatMessage | null> {
  const channelId = await resolveChatChannel();
  if (!channelId) return null;

  let env: Env;
  try {
    env = getEnv();
  } catch {
    return null;
  }

  const url = whopApiUrl(env, "messages");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WHOP_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        channel_id: channelId,
        content: `**${authorName}**: ${content}`,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`[whop] chat post responded ${response.status}`);
      return null;
    }

    const parsed = messageSchema.safeParse(await response.json());
    if (!parsed.success) {
      console.error("[whop] chat post returned an unexpected shape");
      return null;
    }

    return toChatMessage(parsed.data);
  } catch (error) {
    console.error("[whop] chat post failed:", error);
    return null;
  }
}
