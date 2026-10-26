import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import type { SessionData } from "@/lib/session";

const mobileSessionPayloadSchema = z.object({
  user: z.object({
    sub: z.string(),
    name: z.string().optional(),
    preferred_username: z.string().optional(),
    picture: z.url().optional(),
    email: z.email().optional(),
    email_verified: z.boolean().optional(),
  }),
  tokens: z.object({
    access_token: z.string(),
    refresh_token: z.string(),
    id_token: z.string().optional(),
    scope: z.string().optional(),
    token_type: z.string(),
    expires_in: z.number(),
  }),
  membership: z.enum(["active", "trialing", "inactive", "unknown"]).optional(),
  obtainedAt: z.number(),
});

export type MobileSessionPayload = z.infer<typeof mobileSessionPayloadSchema>;

export class MobileAuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "MobileAuthError";
  }
}

const gatewayPayloadSchema = z.object({
  ok: z.literal(true).optional(),
  sessionPayload: z.string().optional(),
  active: z.boolean().optional(),
});

const AUTH_CODE_TTL_SECONDS = 5 * 60;
const MOBILE_SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

function encryptionKey(): Buffer {
  const secret = getEnv().SESSION_SECRET;
  return createHash("sha256")
    .update(`level-up-society/mobile-oauth-payload/v1\0${secret}`)
    .digest();
}

function encryptSessionPayload(payload: SessionData): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

function decryptSessionPayload(value: string): MobileSessionPayload {
  const [version, ivValue, tagValue, ciphertextValue, extra] = value.split(".");
  if (version !== "v1" || !ivValue || !tagValue || !ciphertextValue || extra) {
    throw new Error("The mobile session record has an unsupported format.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
  return mobileSessionPayloadSchema.parse(JSON.parse(plaintext));
}

async function digest(value: string): Promise<string> {
  return createHash("sha256").update(value).digest("base64url");
}

async function gatewayPost(path: string, payload: Record<string, unknown>): Promise<unknown> {
  const env = getEnv();
  if (!env.TELEGRAM_GATEWAY_URL || !env.TELEGRAM_GATEWAY_SECRET) {
    throw new MobileAuthError("Mobile sign-in storage is not configured.", 503);
  }

  let response: Response;
  try {
    response = await fetch(
      new URL(path.replace(/^\/+/, ""), `${env.TELEGRAM_GATEWAY_URL.replace(/\/+$/, "")}/`),
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.TELEGRAM_GATEWAY_SECRET}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );
  } catch {
    throw new MobileAuthError("Mobile sign-in storage could not be reached.", 503);
  }

  const responseBody: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    console.error(`[mobile auth] gateway ${path} responded ${response.status}`);
    throw new MobileAuthError(
      "Mobile sign-in storage could not complete the request.",
      path.endsWith("/exchange") && response.status === 401 ? 401 : 503,
    );
  }
  return responseBody;
}

export async function createMobileLoginCode(session: SessionData): Promise<string> {
  if (!session.user || !session.tokens) {
    throw new Error("A complete WHOP session is required for mobile sign-in.");
  }

  const code = randomBytes(32).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const result = await gatewayPost("v1/mobile-auth/codes", {
    codeHash: await digest(code),
    sessionPayload: encryptSessionPayload(session),
    createdAt: now,
    expiresAt: now + AUTH_CODE_TTL_SECONDS,
  });
  const parsed = gatewayPayloadSchema.safeParse(result);
  if (!parsed.success || parsed.data.ok !== true) {
    throw new Error("Mobile sign-in storage returned an unexpected response.");
  }
  return code;
}

export async function exchangeMobileLoginCode(
  code: string,
): Promise<{ sessionToken: string; session: MobileSessionPayload }> {
  if (!/^[A-Za-z0-9_-]{40,50}$/.test(code)) {
    throw new MobileAuthError("The sign-in code is invalid or expired.", 401);
  }

  const sessionToken = randomBytes(48).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const result = await gatewayPost("v1/mobile-auth/exchange", {
    codeHash: await digest(code),
    sessionHash: await digest(sessionToken),
    now,
    expiresAt: now + MOBILE_SESSION_TTL_SECONDS,
  });
  const parsed = gatewayPayloadSchema.safeParse(result);
  if (!parsed.success || parsed.data.ok !== true || !parsed.data.sessionPayload) {
    throw new MobileAuthError("The sign-in code is invalid or expired.", 401);
  }

  return {
    sessionToken,
    session: decryptSessionPayload(parsed.data.sessionPayload),
  };
}

export async function loadMobileSession(
  sessionToken: string,
): Promise<MobileSessionPayload | null> {
  if (!/^[A-Za-z0-9_-]{60,70}$/.test(sessionToken)) return null;

  const result = await gatewayPost("v1/mobile-auth/resolve", {
    sessionHash: await digest(sessionToken),
    now: Math.floor(Date.now() / 1000),
  });
  const parsed = gatewayPayloadSchema.safeParse(result);
  if (!parsed.success || !parsed.data.active || !parsed.data.sessionPayload) return null;
  return decryptSessionPayload(parsed.data.sessionPayload);
}

export async function saveMobileSession(
  sessionToken: string,
  session: SessionData,
): Promise<void> {
  const result = await gatewayPost("v1/mobile-auth/update", {
    sessionHash: await digest(sessionToken),
    sessionPayload: encryptSessionPayload(session),
    now: Math.floor(Date.now() / 1000),
  });
  const parsed = gatewayPayloadSchema.safeParse(result);
  if (!parsed.success || !parsed.data.active) {
    throw new MobileAuthError("The mobile session expired before it could be updated.", 401);
  }
}

export async function revokeMobileSession(sessionToken: string): Promise<void> {
  if (!/^[A-Za-z0-9_-]{60,70}$/.test(sessionToken)) return;
  await gatewayPost("v1/mobile-auth/revoke", {
    sessionHash: await digest(sessionToken),
    now: Math.floor(Date.now() / 1000),
  });
}

export function readBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  return /^[A-Za-z0-9_-]{60,70}$/.test(token) ? token : null;
}
