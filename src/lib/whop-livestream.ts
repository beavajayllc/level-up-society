import "server-only";

import { z } from "zod";
import { getEnv, whopSdkBaseUrl, type Env } from "@/lib/env";

/**
 * WHOP live calls.
 *
 * WHOP is the source of truth for what is live. The `Livestreaming` app that
 * lives on the Level Up Pro product owns one experience, and every stream the
 * host starts in the WHOP dashboard lands in that experience. We read that
 * feed server side and render it in the members area.
 *
 * A WHOP community can carry more than one Livestreaming app, and the host
 * can start a call from any of the tabs they see in the sidebar. To make
 * sure a call never gets missed, we read every Livestreaming experience in
 * the community and merge their feeds.
 *
 * WHOP does not expose a playback URL for a live stream through its public
 * API, so the live player is WHOP's own room embedded on the page, and the
 * finished recording is played back here from WHOP's CDN.
 */

const livestreamSchema = z.object({
  id: z.string(),
  title: z.string().default("Untitled Livestream"),
  started_at: z.string().nullable().default(null),
  ended_at: z.string().nullable().default(null),
  scheduled_at: z.string().nullable().default(null),
  thumbnail_url: z.string().nullable().default(null),
  recording_url: z.string().nullable().default(null),
  recording_status: z
    .enum(["recording", "processing", "completed", "failed"])
    .nullable()
    .default(null),
  pinned_at: z.string().nullable().default(null),
  created_at: z.string().default(""),
});

const listResponseSchema = z.object({
  data: z.array(livestreamSchema).default([]),
});

const experienceSchema = z.object({
  id: z.string(),
  name: z.string().default(""),
  app: z.object({ id: z.string(), name: z.string() }).nullable().default(null),
});

const experienceListSchema = z.object({
  data: z.array(experienceSchema).default([]),
});

export type LivestreamFeed = z.infer<typeof livestreamSchema>;

export interface LiveCallsState {
  /** The stream that is on air right now, if any. */
  live: LivestreamFeed | null;
  /** Finished calls that have a recording we can play back here. */
  recordings: LivestreamFeed[];
  /** Streams that have been scheduled but have not started. */
  upcoming: LivestreamFeed[];
  /** WHOP's live room, embedded as the player when a call is live. */
  roomUrl: string | null;
  /** WHOP's Level Up Pro product page. */
  productUrl: string | null;
  /** The Livestreaming experiences we read, so the chat can find its channel. */
  experienceIds: string[];
  /** The Chat experiences in the community, candidates for a chat channel. */
  chatExperienceIds: string[];
  /** False when WHOP is not configured or could not be reached. */
  connected: boolean;
}

const EMPTY_STATE: LiveCallsState = {
  live: null,
  recordings: [],
  upcoming: [],
  roomUrl: null,
  productUrl: null,
  experienceIds: [],
  chatExperienceIds: [],
  connected: false,
};

/**
 * Build a WHOP API URL.
 *
 * `whopSdkBaseUrl` returns a base that already carries the `/api/v1`
 * prefix, so the path has to be joined relatively. An absolute path such as
 * `/livestreams` would drop the `/api/v1` segment and 404.
 */
function whopApiUrl(env: Env, path: string): URL {
  const base = whopSdkBaseUrl(env);
  return new URL(path.replace(/^\/+/, ""), `${base}/`);
}

/**
 * A stream is live once it has started and has not ended. WHOP keeps
 * `ended_at` null for the whole time a call is on air.
 */
function isLive(stream: LivestreamFeed): boolean {
  return Boolean(stream.started_at) && !stream.ended_at;
}

/** A finished call we can actually play back from WHOP's CDN. */
function hasRecording(stream: LivestreamFeed): boolean {
  return Boolean(stream.ended_at) && Boolean(stream.recording_url);
}

/**
 * A short cache so a page full of members does not turn into a WHOP API
 * stampede. Fifteen seconds is short enough that a call going live still
 * shows up almost immediately.
 */
const CACHE_TTL_MS = 15_000;

let cached: { state: LiveCallsState; expires: number } | null = null;

async function fetchLivestreams(
  env: Env,
  experienceId: string,
): Promise<LivestreamFeed[]> {
  const url = whopApiUrl(env, "livestreams");
  url.searchParams.set("experience_id", experienceId);
  url.searchParams.set("first", "25");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.WHOP_API_KEY}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`WHOP livestreams responded ${response.status}`);
  }

  const parsed = listResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error("WHOP livestreams returned an unexpected shape");
  }

  return parsed.data.data;
}

/**
 * Every Livestreaming experience in the community.
 *
 * WHOP lets a community carry several app instances of the same type, and
 * the host can start a call from whichever Livestreaming tab they open. We
 * collect them all so a call is never missed. The configured experience is
 * always included, even if discovery fails.
 */
async function resolveExperienceIds(
  env: Env,
): Promise<{ livestreaming: string[]; chat: string[] }> {
  const ids = new Set<string>();
  const chatIds = new Set<string>();
  const configured = env.WHOP_LIVESTREAM_EXPERIENCE_ID;
  if (configured) ids.add(configured);

  try {
    const url = whopApiUrl(env, "experiences");
    url.searchParams.set("company_id", env.WHOP_ACCOUNT_ID);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${env.WHOP_API_KEY}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`WHOP experiences responded ${response.status}`);
    }

    const parsed = experienceListSchema.safeParse(await response.json());
    if (!parsed.success) {
      throw new Error("WHOP experiences returned an unexpected shape");
    }

    for (const experience of parsed.data.data) {
      if (experience.app?.name === "Livestreaming") {
        ids.add(experience.id);
      }
      if (experience.app?.name === "Chat") {
        chatIds.add(experience.id);
      }
    }
  } catch (error) {
    console.error("[whop] livestream experience discovery failed:", error);
  }

  return { livestreaming: [...ids], chat: [...chatIds] };
}

/**
 * The current state of the live calls, ready to render.
 *
 * Never throws. If WHOP is down or not configured the members area still
 * renders, it just shows the "no calls yet" state.
 */
export async function getLiveCalls(): Promise<LiveCallsState> {
  let env: Env;
  try {
    env = getEnv();
  } catch {
    // WHOP is not configured yet. The members area still renders.
    return { ...EMPTY_STATE };
  }

  const roomUrl = env.WHOP_LIVESTREAM_ROOM_URL ?? null;
  const productUrl = env.WHOP_PRODUCT_URL ?? null;

  if (!env.WHOP_LIVESTREAM_EXPERIENCE_ID) {
    return { ...EMPTY_STATE, roomUrl, productUrl };
  }

  if (cached && cached.expires > Date.now()) {
    return cached.state;
  }

  const { livestreaming: experienceIds, chat: chatExperienceIds } =
    await resolveExperienceIds(env);

  const results = await Promise.allSettled(
    experienceIds.map((id) => fetchLivestreams(env, id)),
  );

  const streams: LivestreamFeed[] = [];
  let reachable = false;

  for (const result of results) {
    if (result.status === "fulfilled") {
      reachable = true;
      streams.push(...result.value);
    } else {
      console.error("[whop] livestream feed failed:", result.reason);
    }
  }

  if (!reachable) {
    return { ...EMPTY_STATE, roomUrl, productUrl, experienceIds, chatExperienceIds };
  }

  // The same call can be reported by more than one experience. Keep one.
  const unique = new Map(streams.map((stream) => [stream.id, stream]));
  const all = [...unique.values()];

  const live = all.find(isLive) ?? null;

  const recordings = all
    .filter((stream) => !isLive(stream) && hasRecording(stream))
    .sort((a, b) => {
      const left = a.pinned_at ?? a.ended_at ?? a.created_at;
      const right = b.pinned_at ?? b.ended_at ?? b.created_at;
      return right.localeCompare(left);
    })
    .slice(0, 6);

  const upcoming = all
    .filter(
      (stream) =>
        !isLive(stream) && !stream.started_at && Boolean(stream.scheduled_at),
    )
    .sort((a, b) => (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? ""))
    .slice(0, 3);

  const state: LiveCallsState = {
    live,
    recordings,
    upcoming,
    roomUrl,
    productUrl,
    experienceIds,
    chatExperienceIds,
    connected: true,
  };

  cached = { state, expires: Date.now() + CACHE_TTL_MS };
  return state;
}
