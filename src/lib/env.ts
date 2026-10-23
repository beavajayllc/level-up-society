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
  WHOP_ACCOUNT_ID: z.string().startsWith("biz_"),
  /** Optional product / experience / account id used for the access check. */
  WHOP_ACCESS_RESOURCE_ID: z.string().min(1).optional(),
  /** WHOP checkout link used for the "Join" calls to action. */
  WHOP_CHECKOUT_URL: z.url().optional(),
  /** Same link, exposed to client components so the CTAs can use it. */
  NEXT_PUBLIC_WHOP_CHECKOUT_URL: z.url().optional(),
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
    WHOP_ACCOUNT_ID: process.env.WHOP_ACCOUNT_ID,
    WHOP_ACCESS_RESOURCE_ID: process.env.WHOP_ACCESS_RESOURCE_ID,
    WHOP_CHECKOUT_URL: process.env.WHOP_CHECKOUT_URL,
    NEXT_PUBLIC_WHOP_CHECKOUT_URL:
      process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL,
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
