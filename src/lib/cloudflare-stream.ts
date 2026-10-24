import "server-only";

import { z } from "zod";
import { getEnv, type Env } from "@/lib/env";

const liveInputVideosSchema = z.object({
  result: z.array(
    z.object({
      status: z.object({ state: z.string() }),
    }),
  ),
});

const tokenResponseSchema = z.object({
  success: z.literal(true),
  result: z.object({ token: z.string().min(1) }),
});

export type CloudflareStreamStatus =
  | "not_configured"
  | "offline"
  | "live"
  | "unavailable";

interface CloudflareStreamConfig {
  accountId: string;
  customerCode: string;
  liveInputId: string;
  apiToken: string;
}

function streamConfig(env: Env): CloudflareStreamConfig | null {
  const {
    CLOUDFLARE_STREAM_ACCOUNT_ID,
    CLOUDFLARE_STREAM_CUSTOMER_CODE,
    CLOUDFLARE_STREAM_LIVE_INPUT_ID,
    CLOUDFLARE_STREAM_API_TOKEN,
  } = env;

  if (
    !CLOUDFLARE_STREAM_ACCOUNT_ID ||
    !CLOUDFLARE_STREAM_CUSTOMER_CODE ||
    !CLOUDFLARE_STREAM_LIVE_INPUT_ID ||
    !CLOUDFLARE_STREAM_API_TOKEN
  ) {
    return null;
  }

  return {
    accountId: CLOUDFLARE_STREAM_ACCOUNT_ID,
    customerCode: CLOUDFLARE_STREAM_CUSTOMER_CODE,
    liveInputId: CLOUDFLARE_STREAM_LIVE_INPUT_ID,
    apiToken: CLOUDFLARE_STREAM_API_TOKEN,
  };
}

const STATUS_CACHE_MS = 10_000;
let cachedStatus: {
  status: CloudflareStreamStatus;
  expiresAt: number;
} | null = null;

async function getLiveStatus(
  config: CloudflareStreamConfig,
): Promise<CloudflareStreamStatus> {
  if (cachedStatus && cachedStatus.expiresAt > Date.now()) {
    return cachedStatus.status;
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/stream/live_inputs/${config.liveInputId}/videos`,
      {
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error("[cloudflare] Live input videos responded", response.status);
      cachedStatus = {
        status: "unavailable",
        expiresAt: Date.now() + STATUS_CACHE_MS,
      };
      return cachedStatus.status;
    }

    const parsed = liveInputVideosSchema.safeParse(await response.json());
    if (!parsed.success) {
      console.error("[cloudflare] Live input videos returned an unexpected shape");
      cachedStatus = {
        status: "unavailable",
        expiresAt: Date.now() + STATUS_CACHE_MS,
      };
      return cachedStatus.status;
    }

    cachedStatus = {
      status: parsed.data.result.some(
        (video) => video.status.state === "live-inprogress",
      )
        ? "live"
        : "offline",
      expiresAt: Date.now() + STATUS_CACHE_MS,
    };
    return cachedStatus.status;
  } catch (error) {
    console.error("[cloudflare] Live input videos request failed:", error);
    cachedStatus = {
      status: "unavailable",
      expiresAt: Date.now() + STATUS_CACHE_MS,
    };
    return cachedStatus.status;
  }
}

/** Current playback state for the dedicated Level Up Society live input. */
export async function getCloudflareStreamStatus(): Promise<CloudflareStreamStatus> {
  let env: Env;
  try {
    env = getEnv();
  } catch {
    return "not_configured";
  }

  const configuredValues = [
    env.CLOUDFLARE_STREAM_ACCOUNT_ID,
    env.CLOUDFLARE_STREAM_CUSTOMER_CODE,
    env.CLOUDFLARE_STREAM_LIVE_INPUT_ID,
    env.CLOUDFLARE_STREAM_API_TOKEN,
  ];
  if (configuredValues.every((value) => !value)) return "not_configured";

  const config = streamConfig(env);
  if (!config) {
    console.error("[cloudflare] Stream configuration is incomplete");
    return "unavailable";
  }

  return getLiveStatus(config);
}

/**
 * Create a short-lived player URL for an authorized member.
 * The caller must check WHOP membership before invoking this function.
 */
export async function createCloudflareManifestUrl(): Promise<string | null> {
  const env = getEnv();
  const config = streamConfig(env);
  if (!config || (await getLiveStatus(config)) !== "live") return null;

  const expiresAt = Math.floor(Date.now() / 1000) + 55 * 60;
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/stream/${config.liveInputId}/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ exp: expiresAt }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    console.error("[cloudflare] Stream token request responded", response.status);
    throw new Error("Cloudflare Stream could not issue a playback token");
  }

  const parsed = tokenResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    console.error(
      "[cloudflare] Stream token response returned an unexpected shape",
    );
    throw new Error("Cloudflare Stream returned an invalid playback token response");
  }

  return `https://customer-${config.customerCode}.cloudflarestream.com/${encodeURIComponent(parsed.data.result.token)}/manifest/video.m3u8?protocol=llhls`;
}
