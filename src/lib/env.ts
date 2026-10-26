import { z } from "zod";

/**
 * Server-side configuration for WHOP auth.
 *
 * Everything is read lazily and validated on first use, so `next build` never
 * fails in an environment where these secrets only exist at runtime.
 */
const envSchema = z.object({
  WHOP_CLIENT_ID: z.string().startsWith("app_"),
  WHOP_CLIENT_SECRET: z.string().min(1),
  WHOP_API_KEY: z.string().min(1),
  /** WHOP company webhook signing secret, starts with ws_. */
  WHOP_WEBHOOK_SECRET: z.string().min(1).optional(),
  WHOP_ACCOUNT_ID: z.string().startsWith("biz_"),
  /**
   * Product / experience / account ids used for the access check.
   *
   * One id, or a comma separated list of ids. WHOP lets an offer be rebuilt
   * as a new product and the old one archived, so the list keeps members of
   * the previous version from being locked out.
   */
  WHOP_ACCESS_RESOURCE_ID: z.string().min(1).optional(),
  /** WHOP checkout link used for the "Join" calls to action. */
  WHOP_CHECKOUT_URL: z.url().optional(),
  /** Same link, exposed to client components so the CTAs can use it. */
  NEXT_PUBLIC_WHOP_CHECKOUT_URL: z.url().optional(),
  /** The WHOP livestreaming experience that powers the members-area calls. */
  WHOP_LIVESTREAM_EXPERIENCE_ID: z.string().startsWith("exp_").optional(),
  /** Cloudflare Stream account that hosts Level Up Society live video. */
  CLOUDFLARE_STREAM_ACCOUNT_ID: z
    .string()
    .regex(/^[a-f0-9]{32}$/i)
    .optional(),
  /** Public customer code used to build Stream Player embed URLs. */
  CLOUDFLARE_STREAM_CUSTOMER_CODE: z.string().regex(/^[a-z0-9-]+$/i).optional(),
  /** The persistent Cloudflare live input for weekly calls. */
  CLOUDFLARE_STREAM_LIVE_INPUT_ID: z
    .string()
    .regex(/^[a-f0-9]{32}$/i)
    .optional(),
  /** Server-only Cloudflare API token with Stream read/write access. */
  CLOUDFLARE_STREAM_API_TOKEN: z.string().min(1).optional(),
  /** Private Cloudflare Worker endpoint that handles Telegram + D1 state. */
  TELEGRAM_GATEWAY_URL: z.url().optional(),
  /** Shared server-only secret for the app-to-Worker calls. */
  TELEGRAM_GATEWAY_SECRET: z.string().min(32).optional(),
  /** RevenueCat v1 secret API key used only for server-side entitlement checks. */
  REVENUECAT_SECRET_API_KEY: z.string().min(1).optional(),
  /** Shared secret used to authenticate RevenueCat subscription webhooks. */
  REVENUECAT_WEBHOOK_SECRET: z.string().min(32).optional(),
  /** Shared entitlement identifier attached to the Apple and Google products. */
  REVENUECAT_ENTITLEMENT_ID: z.string().min(1).default("level_up_pro"),
  /** Explicit production switch enabled only after the bot token is installed. */
  TELEGRAM_GATEWAY_READY: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  WHOP_SANDBOX: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  SESSION_SECRET: z.string().min(32),
  NEXT_PUBLIC_APP_URL: z.url(),
});

export type Env = z.infer<typeof envSchema>;

export class EnvNotConfiguredError extends Error {
  readonly missing: string[];

  constructor(missing: string[]) {
    super(
      `Missing environment variables: ${missing.join(", ")}. ` +
        "See .env.example for the full list.",
    );
    this.name = "EnvNotConfiguredError";
    this.missing = missing;
  }
}

function readRawEnv(): Record<string, string | undefined> {
  return {
    WHOP_CLIENT_ID: process.env.WHOP_CLIENT_ID,
    WHOP_CLIENT_SECRET: process.env.WHOP_CLIENT_SECRET,
    WHOP_API_KEY: process.env.WHOP_API_KEY,
    WHOP_WEBHOOK_SECRET: process.env.WHOP_WEBHOOK_SECRET,
    WHOP_ACCOUNT_ID: process.env.WHOP_ACCOUNT_ID,
    WHOP_ACCESS_RESOURCE_ID: process.env.WHOP_ACCESS_RESOURCE_ID,
    WHOP_CHECKOUT_URL: process.env.WHOP_CHECKOUT_URL,
    NEXT_PUBLIC_WHOP_CHECKOUT_URL:
      process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL,
    WHOP_LIVESTREAM_EXPERIENCE_ID: process.env.WHOP_LIVESTREAM_EXPERIENCE_ID,
    CLOUDFLARE_STREAM_ACCOUNT_ID: process.env.CLOUDFLARE_STREAM_ACCOUNT_ID,
    CLOUDFLARE_STREAM_CUSTOMER_CODE:
      process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE,
    CLOUDFLARE_STREAM_LIVE_INPUT_ID:
      process.env.CLOUDFLARE_STREAM_LIVE_INPUT_ID,
    CLOUDFLARE_STREAM_API_TOKEN: process.env.CLOUDFLARE_STREAM_API_TOKEN,
    TELEGRAM_GATEWAY_URL: process.env.TELEGRAM_GATEWAY_URL,
    TELEGRAM_GATEWAY_SECRET: process.env.TELEGRAM_GATEWAY_SECRET,
    REVENUECAT_SECRET_API_KEY: process.env.REVENUECAT_SECRET_API_KEY,
    REVENUECAT_WEBHOOK_SECRET: process.env.REVENUECAT_WEBHOOK_SECRET,
    REVENUECAT_ENTITLEMENT_ID: process.env.REVENUECAT_ENTITLEMENT_ID,
    TELEGRAM_GATEWAY_READY: process.env.TELEGRAM_GATEWAY_READY,
    WHOP_SANDBOX: process.env.WHOP_SANDBOX,
    SESSION_SECRET: process.env.SESSION_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };
}

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;

  const parsed = envSchema.safeParse(readRawEnv());
  if (!parsed.success) {
    const missing = parsed.error.issues.map((issue) =>
      issue.path.join("."),
    );
    throw new EnvNotConfiguredError(missing);
  }

  cached = parsed.data;
  return cached;
}

/** True when WHOP auth is fully wired up. Used to render friendly setup states. */
export function isAuthConfigured(): boolean {
  return envSchema.safeParse(readRawEnv()).success;
}

/** True once the Telegram gateway has been deployed and privately linked. */
export function isTelegramGatewayConfigured(): boolean {
  const env = envSchema.safeParse(readRawEnv());
  return Boolean(
    env.success &&
      env.data.TELEGRAM_GATEWAY_URL &&
      env.data.TELEGRAM_GATEWAY_SECRET &&
      env.data.TELEGRAM_GATEWAY_READY,
  );
}

/**
 * WHOP API base URL for the OAuth endpoints (/oauth/authorize, /oauth/token,
 * /oauth/userinfo). Sandbox and production are separate environments.
 */
export function whopApiBaseUrl(env: Env = getEnv()): string {
  return env.WHOP_SANDBOX
    ? "https://sandbox-api.whop.com"
    : "https://api.whop.com";
}

/**
 * WHOP API base URL for the REST resources the SDK calls. The SDK appends its
 * own paths (users/{id}/access/{resource_id}), so this has to include the
 * versioned prefix or every request 404s.
 */
export function whopSdkBaseUrl(env: Env = getEnv()): string {
  return env.WHOP_SANDBOX
    ? "https://sandbox-api.whop.com/api/v1"
    : "https://api.whop.com/api/v1";
}
