import "server-only";

import { z } from "zod";
import { getEnv, whopSdkBaseUrl } from "@/lib/env";

/**
 * WHOP live calls.
 *
 * WHOP is the source of truth for what is live. The `Livestreaming` app that
 * lives on the Level Up Pro product owns one experience, and every stream the
 * host starts in the WHOP dashboard lands in that experience. We read that
 * feed server side and render it in the members area.
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
  /** False when WHOP is not configured or could not be reached. */
  connected: boolean;
}

const EMPTY_STATE: LiveCallsState = {
  live: null,
  recordings: [],
  upcoming: [],
  roomUrl: null,
  productUrl: null,
  connected: false,
};

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
  experienceId: string,
): Promise<LivestreamFeed[]> {
  const env = getEnv();
  const url = new URL("/livestreams", whopSdkBaseUrl(env));
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
 * The current state of the live calls, ready to render.
 *
 * Never throws. If WHOP is down or not configured the members area still
 * renders, it just shows the "no calls yet" state.
 */
export async function getLiveCalls(): Promise<LiveCallsState> {
  let env: ReturnType<typeof getEnv>;
  try {
    env = getEnv();
  } catch {
    // WHOP is not configured yet. The members area still renders.
    return { ...EMPTY_STATE };
  }

  const roomUrl = env.WHOP_LIVESTREAM_ROOM_URL ?? null;
  const productUrl = env.WHOP_PRODUCT_URL ?? null;
  const experienceId = env.WHOP_LIVESTREAM_EXPERIENCE_ID;

  if (!experienceId) {
    return { ...EMPTY_STATE, roomUrl, productUrl };
  }

  if (cached && cached.expires > Date.now()) {
    return cached.state;
  }

  let streams: LivestreamFeed[];
  try {
    streams = await fetchLivestreams(experienceId);
  } catch (error) {
    console.error("[whop] livestream feed failed:", error);
    return { ...EMPTY_STATE, roomUrl, productUrl };
  }

  const live = streams.find(isLive) ?? null;

  const recordings = streams
    .filter((stream) => !isLive(stream) && hasRecording(stream))
    .sort((a, b) => {
      const left = a.pinned_at ?? a.ended_at ?? a.created_at;
      const right = b.pinned_at ?? b.ended_at ?? b.created_at;
      return right.localeCompare(left);
    })
    .slice(0, 6);

  const upcoming = streams
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
    connected: true,
  };

  cached = { state, expires: Date.now() + CACHE_TTL_MS };
  return state;
}
