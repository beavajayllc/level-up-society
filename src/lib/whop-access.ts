import "server-only";

import { WhopClient, type Whop } from "@whop/sdk";
import { getEnv, whopSdkBaseUrl, type Env } from "@/lib/env";
import { checkRevenueCatAccess } from "@/lib/revenuecat-access";

/**
 * Membership access checks.
 *
 * `active`    - paid membership in good standing
 * `trialing`  - free trial in good standing
 * `inactive`  - no valid membership (canceled, expired, refunded, never bought)
 * `unknown`   - WHOP could not be reached or the check is not configured yet
 */
export type MembershipState = "active" | "trialing" | "inactive" | "unknown";

let cachedClient: WhopClient | null = null;

function getClient(): WhopClient {
  if (cachedClient) return cachedClient;

  const env = getEnv();
  cachedClient = new WhopClient({
    token: env.WHOP_API_KEY,
    baseUrl: whopSdkBaseUrl(env),
  });

  return cachedClient;
}

/**
 * The resources that grant Level Up Pro access.
 *
 * WHOP lets a seller publish a new version of a product and archive the old
 * one. A buyer keeps their access on the product they bought, but not on the
 * new one, so a single product id is not enough to describe "the people who
 * paid for Level Up Pro".
 *
 * The list is read from `WHOP_ACCESS_RESOURCE_ID`, which accepts one id or a
 * comma separated list of ids. With nothing configured the account itself is
 * the gate, which is the loosest option: any membership on the account opens
 * the area.
 */
function accessResourceIds(env: Env): string[] {
  const ids = new Set<string>();

  for (const id of env.WHOP_ACCESS_RESOURCE_ID?.split(",") ?? []) {
    const trimmed = id.trim();
    if (trimmed) ids.add(trimmed);
  }

  if (ids.size === 0) ids.add(env.WHOP_ACCOUNT_ID);

  return [...ids];
}

/**
 * The product the site sells today, taken from the first product id in the
 * access list. Used to recognise earlier versions of the same offer.
 */
function canonicalProductId(env: Env): string | null {
  return accessResourceIds(env).find((id) => id.startsWith("prod_")) ?? null;
}

const TITLE_CACHE_MS = 60 * 60 * 1000;
let canonicalTitleCache: { title: string | null; expires: number } | null = null;

/**
 * The title of the product the site sells today.
 *
 * Cached for an hour: the title changes when the offer is rebuilt, which
 * happens a handful of times a year at most.
 */
async function canonicalProductTitle(env: Env): Promise<string | null> {
  if (canonicalTitleCache && canonicalTitleCache.expires > Date.now()) {
    return canonicalTitleCache.title;
  }

  const productId = canonicalProductId(env);
  if (!productId) {
    canonicalTitleCache = { title: null, expires: Date.now() + TITLE_CACHE_MS };
    return null;
  }

  let title: string | null = null;

  try {
    const product = await getClient().products.retrieve({ id: productId });
    title = product.title ?? null;
  } catch (error) {
    console.error("[whop] canonical product lookup failed:", error);
  }

  canonicalTitleCache = { title, expires: Date.now() + TITLE_CACHE_MS };
  return title;
}

/**
 * True when a membership still grants access.
 *
 * WHOP's own rule: `active` and `trialing` memberships grant access,
 * `completed` one-time purchases keep access, `canceled` and `expired` do
 * not. A `completed` membership on a renewing plan means the paid period ran
 * out without a renewal, so it does not grant access; a `completed`
 * membership with no renewal price is a one-time purchase and does.
 */
function membershipGrantsAccess(membership: Whop.Membership): boolean {
  switch (membership.status) {
    case "active":
    case "trialing":
    case "past_due":
      return true;
    case "canceling":
      // Cancelling at the end of the period keeps access until then.
      return true;
    case "completed":
      return membership.renewal_price === null;
    default:
      return false;
  }
}

/**
 * A member who bought an earlier version of the offer.
 *
 * When the offer is rebuilt on WHOP the new product id becomes the gate, and
 * members of the previous product report no access to it even though they
 * paid. This recognises that case: a paid membership on any product in the
 * account that carries the same title as the product the site sells today
 * counts as access.
 *
 * The title has to match on purpose. A different product on the same account
 * (a course, a one-off workshop) must not hand out the membership area.
 */
async function hasOfferFamilyAccess(
  userId: string,
  env: Env,
): Promise<boolean> {
  const title = await canonicalProductTitle(env);
  if (!title) return false;

  const memberships: Whop.Membership[] = [];

  try {
    const page = await getClient().memberships.list({
      account_id: env.WHOP_ACCOUNT_ID,
      user_id: userId,
    });

    for await (const membership of page) {
      memberships.push(membership);
    }
  } catch (error) {
    console.error("[whop] membership list failed:", error);
    return false;
  }

  return memberships.some(
    (membership) =>
      membership.product?.title === title &&
      membershipGrantsAccess(membership),
  );
}

/**
 * Checks whether a WHOP user currently has access.
 *
 * Two passes. First WHOP's own access check against every configured
 * resource. Then, for members of an earlier version of the offer, the paid
 * membership itself.
 */
async function checkWhopMembership(
  userId: string,
): Promise<MembershipState> {
  const env = getEnv();
  const client = getClient();

  let accessError: unknown = null;

  for (const resourceId of accessResourceIds(env)) {
    try {
      const access = await client.users.checkAccess({
        id: userId,
        resource_id: resourceId,
      });

      if (
        access.has_access &&
        (access.access_level === "customer" ||
          access.access_level === "admin")
      ) {
        return "active";
      }
    } catch (error) {
      accessError = error;
    }
  }

  if (await hasOfferFamilyAccess(userId, env)) {
    return "active";
  }

  if (accessError) {
    console.error("[whop] membership check failed:", accessError);
    return "unknown";
  }

  return "inactive";
}

/**
 * Level Up Pro is one access tier across WHOP web checkout and native store
 * subscriptions. WHOP remains authoritative for web purchases; RevenueCat
 * can grant the same tier for verified App Store / Google Play purchases.
 */
export async function checkMembership(
  userId: string,
): Promise<MembershipState> {
  const whopState = await checkWhopMembership(userId);
  if (whopState === "active" || whopState === "trialing") return whopState;

  const storeState = await checkRevenueCatAccess(userId);
  if (storeState === "active") return "active";
  if (whopState === "unknown" || storeState === "unknown") return "unknown";
  return whopState;
}

/**
 * Detailed membership listing for a user. Used by the members area to show
 * what a member actually has access to.
 */
export async function listUserMemberships(userId: string) {
  const env = getEnv();
  const client = getClient();

  const page = await client.memberships.list({
    account_id: env.WHOP_ACCOUNT_ID,
    user_id: userId,
  });

  return page.data;
}

/**
 * A short in-memory cache so a burst of requests from one member does not
 * hammer the WHOP API. Cancelled memberships are reflected within 60s.
 */
const CACHE_TTL_MS = 60_000;
const accessCache = new Map<string, { state: MembershipState; expires: number }>();

export async function checkMembershipCached(
  userId: string,
): Promise<MembershipState> {
  const cached = accessCache.get(userId);
  if (cached && cached.expires > Date.now()) {
    return cached.state;
  }

  const state = await checkMembership(userId);
  accessCache.set(userId, { state, expires: Date.now() + CACHE_TTL_MS });
  return state;
}

/** Refreshes a member's state and replaces any previous cached result. */
export async function refreshMembershipCached(
  userId: string,
): Promise<MembershipState> {
  const state = await checkMembership(userId);
  accessCache.set(userId, { state, expires: Date.now() + CACHE_TTL_MS });
  return state;
}
