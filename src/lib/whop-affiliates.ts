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
  | {
      status: "ready";
      affiliateEnrolled: boolean;
      stats: AffiliateBackOfficeStats;
    }
  | { status: "not-enrolled" }
  | { status: "unavailable" };

export interface InactiveAffiliateMember {
  displayName: string;
  inactiveSince: string | null;
  membershipStatus: "canceled" | "expired" | "completed";
}

export type InactiveAffiliateMembersResult =
  | { status: "ready"; members: InactiveAffiliateMember[] }
  | { status: "not-enrolled" }
  | { status: "unavailable"; reason: "product_not_configured" | "lookup_failed" };

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

/**
 * Lists only this affiliate's Level Up Pro referrals that no longer have
 * product access. This runs on demand from the back-office tab and returns
 * display names only; Whop email addresses never leave this server function.
 */
export async function getInactiveAffiliateMembers(
  userId: string,
  username: string | undefined,
): Promise<InactiveAffiliateMembersResult> {
  try {
    const env = getEnv();
    const normalizedUsername = username?.trim() ?? "";
    if (!normalizedUsername) return { status: "not-enrolled" };

    const ids = productIds();
    if (ids.length === 0) {
      return { status: "unavailable", reason: "product_not_configured" };
    }

    const affiliate = await findAffiliate(
      userId,
      normalizedUsername,
      env.WHOP_ACCOUNT_ID,
    );
    if (!affiliate) return { status: "not-enrolled" };

    const client = getClient();
    const referrals = new Map<
      string,
      {
        inactiveSince: string | null;
        membershipStatus: "canceled" | "expired" | "completed";
      }
    >();
    let membershipPage = await client.memberships.list({
      account_id: env.WHOP_ACCOUNT_ID,
      product_ids: ids,
      statuses: ["canceled", "expired", "completed"],
      first: 100,
    });

    while (true) {
      for (const membership of membershipPage.data) {
        if (
          (membership.status !== "canceled" &&
            membership.status !== "expired" &&
            membership.status !== "completed") ||
          (membership.status === "completed" &&
            membership.renewal_price === null) ||
          membership.affiliate?.user_id !== userId ||
          !membership.user_id
        ) {
          continue;
        }

        const inactiveSince =
          membership.current_period_end ??
          membership.canceled_at ??
          membership.updated_at;
        const previous = referrals.get(membership.user_id);
        if (
          !previous ||
          (inactiveSince &&
            (!previous.inactiveSince ||
              new Date(inactiveSince).getTime() >
                new Date(previous.inactiveSince).getTime()))
        ) {
          referrals.set(membership.user_id, {
            inactiveSince,
            membershipStatus: membership.status,
          });
        }
      }

      if (!membershipPage.hasNextPage()) break;
      membershipPage = await membershipPage.getNextPage();
    }

    const referralUserIds = [...referrals.keys()];
    const members: InactiveAffiliateMember[] = [];

    // Whop member filters accept a list of user ids. Chunk large affiliates'
    // lists so a long-running back-office request doesn't exceed URL limits.
    for (let offset = 0; offset < referralUserIds.length; offset += 50) {
      const userIds = referralUserIds.slice(offset, offset + 50);
      const [activePage, inactivePage] = await Promise.all([
        client.members.list({
          account_id: env.WHOP_ACCOUNT_ID,
          product_ids: ids,
          user_ids: userIds,
          membership_status: "active",
          first: 100,
        }),
        client.members.list({
          account_id: env.WHOP_ACCOUNT_ID,
          product_ids: ids,
          user_ids: userIds,
          membership_status: "inactive",
          first: 100,
        }),
      ]);

      const activeUserIds = new Set<string>();
      for await (const member of activePage) {
        if (member.user?.id) activeUserIds.add(member.user.id);
      }

      for await (const member of inactivePage) {
        const referredUserId = member.user?.id;
        if (!referredUserId || activeUserIds.has(referredUserId)) continue;

        const referral = referrals.get(referredUserId);
        if (!referral) continue;

        members.push({
          displayName: member.display_name,
          inactiveSince: referral.inactiveSince,
          membershipStatus: referral.membershipStatus,
        });
      }
    }

    return {
      status: "ready",
      members: members.sort((left, right) => {
        if (!left.inactiveSince) return 1;
        if (!right.inactiveSince) return -1;
        return (
          new Date(right.inactiveSince).getTime() -
          new Date(left.inactiveSince).getTime()
        );
      }),
    };
  } catch (error) {
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? error.status
        : undefined;
    console.error("[whop] inactive affiliate member lookup failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      status,
    });
    return { status: "unavailable", reason: "lookup_failed" };
  }
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
      affiliateEnrolled: affiliate !== null,
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
