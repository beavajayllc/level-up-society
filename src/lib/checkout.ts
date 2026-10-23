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

/**
 * The checkout URL when it is configured, otherwise an on-page anchor so the
 * site still works before WHOP is wired up.
 */
export function checkoutHref(fallback = "#memberships"): string {
  return WHOP_CHECKOUT_URL || fallback;
}

/** True when the site can hand a buyer off to WHOP checkout. */
export const isCheckoutConfigured = WHOP_CHECKOUT_URL.length > 0;
