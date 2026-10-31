export const AFFILIATE_HANDLE_PATTERN = /^[a-z0-9_]{3,24}$/;

export function normalizeAffiliateHandle(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const handle = value.trim().toLowerCase();
  return AFFILIATE_HANDLE_PATTERN.test(handle) ? handle : null;
}
