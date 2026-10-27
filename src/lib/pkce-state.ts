import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const pkceSchema = z.object({
  codeVerifier: z.string().min(32),
  state: z.string().min(16),
  nonce: z.string().min(16),
  next: z.string().optional(),
  mobile: z.boolean().optional(),
  link: z.boolean().optional(),
  lusUserId: z.string().uuid().optional(),
  issuedAt: z.number().int().positive(),
});

const PKCE_TTL_MS = 10 * 60 * 1000;

export interface PkceStatePayload {
  codeVerifier: string;
  state: string;
  nonce: string;
  next?: string;
  mobile?: boolean;
  link?: boolean;
  lusUserId?: string;
  issuedAt?: number;
}

function signature(payload: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(payload).digest();
}

export function sealPkceState(
  pkce: PkceStatePayload,
  secret: string,
  now = Date.now(),
): string {
  const payload = Buffer.from(
    JSON.stringify({ ...pkce, issuedAt: now }),
    "utf8",
  ).toString("base64url");
  return `${payload}.${signature(payload, secret).toString("base64url")}`;
}

export function openPkceState(
  value: string,
  secret: string,
  now = Date.now(),
): PkceStatePayload | null {
  try {
    const [payload, signatureValue, extra] = value.split(".");
    if (!payload || !signatureValue || extra) return null;

    const expected = signature(payload, secret);
    const provided = Buffer.from(signatureValue, "base64url");
    if (
      provided.length !== expected.length ||
      !timingSafeEqual(provided, expected)
    ) {
      return null;
    }

    const parsed = pkceSchema.parse(
      JSON.parse(Buffer.from(payload, "base64url").toString("utf8")),
    );
    const age = now - parsed.issuedAt;
    if (age < -60_000 || age > PKCE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}
