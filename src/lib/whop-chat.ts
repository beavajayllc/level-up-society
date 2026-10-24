import "server-only";

import { z } from "zod";
import { getEnv, whopSdkBaseUrl, type Env } from "@/lib/env";
import { getLiveCalls } from "@/lib/whop-livestream";

/**
 * Live chat for the members-area call page.
 *
 * Requests use the signed-in member's Whop OAuth token so messages are posted
 * as that member. The caller must verify active Level Up Pro access first.
 */

const profilePictureSchema = z
  .object({ url: z.string().nullable().optional() })
  .nullable()
  .optional();

const messageUserSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  profile_picture_url: z.string().nullable().optional(),
  profile_picture: profilePictureSchema,
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
  connected: boolean;
  channelId: string | null;
  messages: ChatMessage[];
  requiresReauthorization: boolean;
  unavailable: boolean;
}

export interface PostChatMessageResult {
  message: ChatMessage | null;
  requiresReauthorization: boolean;
}

const EMPTY_CHAT: ChatState = {
  connected: false,
  channelId: null,
  messages: [],
  requiresReauthorization: false,
  unavailable: false,
};

/**
 * `whopSdkBaseUrl` already includes `/api/v1`; keep paths relative so the
 * versioned prefix is preserved.
 */
function whopApiUrl(env: Env, path: string): URL {
  return new URL(path.replace(/^\/+/, ""), `${whopSdkBaseUrl(env)}/`);
}

function toChatMessage(raw: z.infer<typeof messageSchema>): ChatMessage {
  const isSystem = raw.message_type === "system" || raw.message_type === "automated";
  return {
    id: raw.id,
    content: raw.content ?? "",
    createdAt: raw.created_at,
    author: raw.user?.name ?? raw.user?.username ?? "Member",
    authorId: raw.user?.id ?? null,
    avatarUrl:
      raw.user?.profile_picture?.url ?? raw.user?.profile_picture_url ?? null,
    isSystem,
  };
}

const CHANNEL_CACHE_MS = 30_000;
let cachedChannel: { id: string; expiresAt: number } | null = null;

/** Return a previously verified experience chat channel, when available. */
async function chatExperienceIds(): Promise<string[]> {
  if (cachedChannel && cachedChannel.expiresAt > Date.now()) {
    return [cachedChannel.id];
  }

  const state = await getLiveCalls();
  return state.chatExperienceIds;
}

/** Recent messages in the member-accessible chat channel. */
export async function getChatMessages(
  accessToken: string,
  limit = 40,
): Promise<ChatState> {
  let env: Env;
  try {
    env = getEnv();
  } catch {
    return { ...EMPTY_CHAT, unavailable: true };
  }

  const ids = await chatExperienceIds();
  let requiresReauthorization = false;

  for (const experienceId of ids) {
    const url = whopApiUrl(env, "messages");
    url.searchParams.set("channel_id", experienceId);
    url.searchParams.set("last", String(limit));
    url.searchParams.set("direction", "asc");

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (response.status === 401 || response.status === 403) {
        requiresReauthorization = true;
        continue;
      }
      if (!response.ok) {
        console.error(`[whop] chat messages responded ${response.status}`);
        continue;
      }

      const parsed = messagesResponseSchema.safeParse(await response.json());
      if (!parsed.success) {
        console.error("[whop] chat messages returned an unexpected shape");
        continue;
      }

      cachedChannel = {
        id: experienceId,
        expiresAt: Date.now() + CHANNEL_CACHE_MS,
      };
      return {
        connected: true,
        channelId: experienceId,
        messages: parsed.data.data.map(toChatMessage),
        requiresReauthorization: false,
        unavailable: false,
      };
    } catch (error) {
      console.error("[whop] chat messages failed:", error);
    }
  }

  return {
    ...EMPTY_CHAT,
    requiresReauthorization,
    unavailable: !requiresReauthorization,
  };
}

/** Post a message as the signed-in member. */
export async function postChatMessage(
  content: string,
  accessToken: string,
): Promise<PostChatMessageResult> {
  let env: Env;
  try {
    env = getEnv();
  } catch {
    return { message: null, requiresReauthorization: false };
  }

  const ids = await chatExperienceIds();
  let requiresReauthorization = false;

  for (const experienceId of ids) {
    try {
      const response = await fetch(whopApiUrl(env, "messages"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ channel_id: experienceId, content }),
        cache: "no-store",
      });

      if (response.status === 401 || response.status === 403) {
        requiresReauthorization = true;
        continue;
      }
      if (!response.ok) {
        console.error(`[whop] chat post responded ${response.status}`);
        continue;
      }

      const parsed = messageSchema.safeParse(await response.json());
      if (!parsed.success) {
        console.error("[whop] chat post returned an unexpected shape");
        return { message: null, requiresReauthorization: false };
      }

      cachedChannel = {
        id: experienceId,
        expiresAt: Date.now() + CHANNEL_CACHE_MS,
      };
      return {
        message: toChatMessage(parsed.data),
        requiresReauthorization: false,
      };
    } catch (error) {
      console.error("[whop] chat post failed:", error);
    }
  }

  return { message: null, requiresReauthorization };
}
