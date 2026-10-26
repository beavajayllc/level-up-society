import "server-only";

import { WhopClient, type Whop } from "@whop/sdk";
import { getEnv, whopSdkBaseUrl } from "@/lib/env";

export interface AffiliateBackOfficeStats {
  referrals: number;
  activeReferrals: number | null;
  commissionEarnedUsd: string | null;
  revenueGeneratedUsd: string | null;
  monthlyRecurringRevenueUsd: string | null;
  retentionRate: string | null;
  retentionRateNinetyDays: string | null;
  product: {
    referrals: number;
    rewardsUsd: string;
  } | null;
}

export type AffiliateBackOfficeResult =
  | { status: "ready"; stats: AffiliateBackOfficeStats }
  | { status: "not-enrolled" }
  | { status: "unavailable" };

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

/** Enroll a verified Level Up Society member as an affiliate on our Whop account. */
export async function createMemberAffiliate(userId: string): Promise<void> {
  const env = getEnv();
  await getClient().affiliates.create({
    account_id: env.WHOP_ACCOUNT_ID,
    user_identifier: userId,
  });
}

function productIds(): string[] {
  return [
    ...new Set(
      (getEnv().WHOP_ACCESS_RESOURCE_ID ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id.startsWith("prod_")),
    ),
  ];
}

async function findAffiliate(
  userId: string,
  username: string,
  accountId: string,
): Promise<Whop.AffiliateListItem | null> {
  const client = getClient();
  let page = await client.affiliates.list({
    account_id: accountId,
    query: username,
    first: 100,
  });

  while (true) {
    const affiliate = page.data.find((item) => item.user.id === userId);
    if (affiliate) return affiliate;
    if (!page.hasNextPage()) return null;
    page = await page.getNextPage();
  }
}

async function getProductStats(
  userId: string,
  username: string,
  accountId: string,
  ids: string[],
): Promise<AffiliateBackOfficeStats["product"]> {
  if (ids.length === 0) return null;

  const client = getClient();
  let page = await client.productAffiliates.list({
    account_id: accountId,
    product_ids: ids,
    query: username,
    first: 100,
  });
  const enrollments: Whop.ProductAffiliate[] = [];

  while (true) {
    enrollments.push(...page.data.filter((item) => item.user.id === userId));
    if (!page.hasNextPage()) break;
    page = await page.getNextPage();
  }

  if (enrollments.length === 0) return null;

  const rewards = enrollments.reduce(
    (total, enrollment) =>
      total + Number(enrollment.total_reward_amount_usd.amount),
    0,
  );

  return {
    referrals: enrollments.reduce(
      (total, enrollment) => total + enrollment.referred_users_count,
      0,
    ),
    rewardsUsd: new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(rewards),
  };
}

/**
 * Reads only the signed-in member's own affiliate record from Whop. The API
 * key stays server-side, and results are matched back to the immutable user
 * id from the verified Whop session.
 */
export async function getAffiliateBackOfficeStats(
  userId: string,
  username: string | undefined,
): Promise<AffiliateBackOfficeResult> {
  try {
    const env = getEnv();
    const normalizedUsername = username?.trim() ?? "";

    if (!normalizedUsername) return { status: "unavailable" };

    const ids = productIds();
    const [affiliate, product] = await Promise.all([
      findAffiliate(userId, normalizedUsername, env.WHOP_ACCOUNT_ID),
      getProductStats(userId, normalizedUsername, env.WHOP_ACCOUNT_ID, ids),
    ]);

    if (!affiliate && !product) return { status: "not-enrolled" };

    return {
      status: "ready",
      stats: {
        referrals: affiliate?.total_referrals_count ?? product?.referrals ?? 0,
        activeReferrals: affiliate?.active_members_count ?? null,
        commissionEarnedUsd: affiliate?.total_referral_earnings_usd ?? null,
        revenueGeneratedUsd: affiliate?.total_revenue_usd ?? null,
        monthlyRecurringRevenueUsd:
          affiliate?.monthly_recurring_revenue_usd ?? null,
        retentionRate: affiliate?.customer_retention_rate ?? null,
        retentionRateNinetyDays:
          affiliate?.customer_retention_rate_ninety_days ?? null,
        product,
      },
    };
  } catch (error) {
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? error.status
        : undefined;
    console.error("[whop] affiliate back office lookup failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      status,
    });
    return { status: "unavailable" };
  }
}
