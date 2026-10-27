import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,24}$/, "Choose 3–24 letters, numbers, or underscores.");

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

export const passwordSchema = z.string().min(12).max(128);

/** Require browser mutations to come from the configured site origin. */
export function isSameOriginRequest(
  request: Request,
  appUrl = process.env.NEXT_PUBLIC_APP_URL,
): boolean {
  if (!appUrl) return false;

  let expectedOrigin: string;
  let requestOrigin: string;
  try {
    expectedOrigin = new URL(appUrl).origin;
    requestOrigin = new URL(request.url).origin;
  } catch {
    return false;
  }

  const originHeader = request.headers.get("origin");
  const refererHeader = request.headers.get("referer");
  const source = originHeader ?? refererHeader;
  if (!source || source === "null") return false;

  try {
    const sourceOrigin = new URL(source).origin;
    return sourceOrigin === expectedOrigin || sourceOrigin === requestOrigin;
  } catch {
    return false;
  }
}

export function safeNextPath(value: unknown, fallback = "/members"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;

  try {
    const parsed = new URL(value, "https://level-up-society.invalid");
    if (parsed.origin !== "https://level-up-society.invalid") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
