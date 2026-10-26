/**
 * Where the "Join" calls to action send people.
 *
 * WHOP is the merchant of record: the buyer checks out on WHOP's hosted page
 * and WHOP creates the Level Up Pro membership. Our site never touches card
 * details. The redirect after checkout lands the buyer back on /members,
 * where they sign in with WHOP OAuth.
 *
 * `NEXT_PUBLIC_` because the header, hero and pricing card are client
 * components. Next inlines the value at build time.
 */
export const WHOP_CHECKOUT_URL =
  process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL ?? "";

/** Public domain members should share in their affiliate links. */
export const PUBLIC_SITE_URL = "https://www.level-up-society.com";

/**
 * The checkout URL when it is configured, otherwise an on-page anchor so the
 * site still works before WHOP is wired up.
 */
export function checkoutHref(fallback = "#memberships"): string {
  return WHOP_CHECKOUT_URL || fallback;
}

/** Extract the plan ID from the configured hosted checkout URL for the embed. */
export function whopCheckoutPlanId(): string | null {
  if (!WHOP_CHECKOUT_URL) return null;

  try {
    const pathname = new URL(WHOP_CHECKOUT_URL).pathname;
    return pathname.match(/^\/checkout\/(plan_[A-Za-z0-9_-]+)\/?$/)?.[1] ?? null;
  } catch {
    return null;
  }
}

/** True when the site can hand a buyer off to WHOP checkout. */
export const isCheckoutConfigured = WHOP_CHECKOUT_URL.length > 0;
