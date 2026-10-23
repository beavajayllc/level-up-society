import "server-only";

import { WhopClient } from "@whop/sdk";
import { getEnv, whopSdkBaseUrl } from "@/lib/env";

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
 * Resolves the resource we gate on.
 *
 * A product id is the tightest gate (only that product unlocks the area).
 * An experience id covers every product inside that experience. The account id
 * is the loosest gate and unlocks on any active membership on the account.
 */
function accessResourceId(): string {
  const env = getEnv();
  return env.WHOP_ACCESS_RESOURCE_ID ?? env.WHOP_ACCOUNT_ID;
}

/**
 * Checks whether a WHOP user currently has access.
 *
 * Prefers `users.checkAccess` against the configured resource, and falls back
 * to listing the user's memberships when no resource id is configured.
 */
export async function checkMembership(
  userId: string,
): Promise<MembershipState> {
  try {
    const client = getClient();
    const resourceId = accessResourceId();

    const access = await client.users.checkAccess({
      id: userId,
      resource_id: resourceId,
    });

    if (!access.has_access) return "inactive";
    if (access.access_level === "customer") return "active";
    if (access.access_level === "admin") return "active";
    return "inactive";
  } catch (error) {
    console.error("[whop] membership check failed:", error);
    return "unknown";
  }
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
