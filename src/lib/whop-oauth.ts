import { z } from "zod";
import { getEnv, whopApiBaseUrl } from "@/lib/env";

/**
 * WHOP OAuth 2.1 + PKCE helpers.
 *
 * Every step runs server-side, so WHOP tokens never reach the browser.
 * Website account linking and native-app sign-in both use hosted Whop OAuth.
 * Mobile keeps its existing Whop OAuth callback flow.
 */

const tokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  id_token: z.string().optional(),
  scope: z.string().optional(),
  token_type: z.string(),
  expires_in: z.number(),
});

const userInfoSchema = z.object({
  sub: z.string(),
  name: z.string().optional(),
  preferred_username: z.string().optional(),
  picture: z.url().optional(),
  email: z.email().optional(),
  email_verified: z.boolean().optional(),
});

export type WhopTokens = z.infer<typeof tokenResponseSchema>;
export type WhopUserInfo = z.infer<typeof userInfoSchema>;

export interface PkceState {
  codeVerifier: string;
  state: string;
  nonce: string;
  /** Relative path to return to after a successful login. */
  next?: string;
  /** Return the verified web OAuth session to the native app using a one-time code. */
  mobile?: boolean;
  /** Associate this verified Whop identity with an already signed-in LUS account. */
  link?: boolean;
  lusUserId?: string;
  /** Server-sealed issue time used to reject stale OAuth correlation cookies. */
  issuedAt?: number;
}

/**
 * Only same-site relative paths are allowed, so a crafted `next` can never
 * redirect a member to another origin.
 */
export function sanitizeNextPath(value: string | null): string | undefined {
  if (!value) return undefined;
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return undefined;
  }
  try {
    const parsed = new URL(value, "https://level-up-society.invalid");
    return parsed.origin === "https://level-up-society.invalid"
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : undefined;
  } catch {
    return undefined;
  }
}

function base64url(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function randomString(length: number): string {
  return base64url(crypto.getRandomValues(new Uint8Array(length)));
}

export async function sha256Challenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64url(new Uint8Array(digest));
}

export function callbackUrl(): string {
  return `${getEnv().NEXT_PUBLIC_APP_URL}/api/auth/callback`;
}

export async function buildAuthorizeUrl(pkce: PkceState): Promise<string> {
  const env = getEnv();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: env.WHOP_CLIENT_ID,
    redirect_uri: callbackUrl(),
    scope: [
      "openid",
      "profile",
      "email",
      "chat:read",
      "chat:message:create",
    ].join(" "),
    state: pkce.state,
    nonce: pkce.nonce,
    code_challenge: await sha256Challenge(pkce.codeVerifier),
    code_challenge_method: "S256",
  });

  return `${whopApiBaseUrl(env)}/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
): Promise<WhopTokens> {
  const env = getEnv();
  const response = await fetch(`${whopApiBaseUrl(env)}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: callbackUrl(),
      client_id: env.WHOP_CLIENT_ID,
      client_secret: env.WHOP_CLIENT_SECRET,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    throw new Error(`Whop token exchange failed (${response.status}).`);
  }

  return tokenResponseSchema.parse(await response.json());
}

export async function refreshTokens(
  refreshToken: string,
): Promise<WhopTokens> {
  const env = getEnv();
  const response = await fetch(`${whopApiBaseUrl(env)}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: env.WHOP_CLIENT_ID,
      client_secret: env.WHOP_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    throw new Error(`Whop token refresh failed (${response.status}).`);
  }

  return tokenResponseSchema.parse(await response.json());
}

export async function fetchUserInfo(
  accessToken: string,
): Promise<WhopUserInfo> {
  const env = getEnv();
  const response = await fetch(`${whopApiBaseUrl(env)}/oauth/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Userinfo failed (${response.status})`);
  }

  return userInfoSchema.parse(await response.json());
}

export async function revokeToken(refreshToken: string): Promise<void> {
  const env = getEnv();
  await fetch(`${whopApiBaseUrl(env)}/oauth/revoke`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: refreshToken,
      client_id: env.WHOP_CLIENT_ID,
      client_secret: env.WHOP_CLIENT_SECRET,
    }),
  });
}

/** Reads the nonce WHOP echoed back in the id_token. */
export function readIdTokenNonce(idToken: string): string | null {
  try {
    const payload = JSON.parse(
      Buffer.from(idToken.split(".")[1], "base64url").toString(),
    ) as { nonce?: unknown };
    return typeof payload.nonce === "string" ? payload.nonce : null;
  } catch {
    return null;
  }
}
