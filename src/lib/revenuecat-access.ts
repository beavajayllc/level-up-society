import "server-only";

import { z } from "zod";
import { getEnv } from "@/lib/env";

export type RevenueCatAccessState =
  | "active"
  | "inactive"
  | "unknown"
  | "not_configured";

const entitlementSchema = z.object({
  expires_date: z.string().nullable(),
  grace_period_expires_date: z.string().nullable(),
});

const subscriberSchema = z.object({
  subscriber: z.object({
    entitlements: z.record(z.string(), entitlementSchema),
  }),
});

function isInAccessPeriod(
  expiresDate: string | null,
  gracePeriodExpiresDate: string | null,
  now: number,
): boolean | null {
  if (expiresDate === null) return true;

  const expiration = Date.parse(expiresDate);
  if (!Number.isFinite(expiration)) return null;
  if (expiration > now) return true;

  if (gracePeriodExpiresDate === null) return false;
  const graceExpiration = Date.parse(gracePeriodExpiresDate);
  if (!Number.isFinite(graceExpiration)) return null;
  return graceExpiration > now;
}

/**
 * Verifies a store subscription through RevenueCat's server API. The user id
 * must be the signed-in WHOP subject, which is also the app's RevenueCat ID.
 */
export async function checkRevenueCatAccess(
  userId: string,
): Promise<RevenueCatAccessState> {
  const env = getEnv();
  if (!env.REVENUECAT_SECRET_API_KEY) return "not_configured";

  let response: Response;
  try {
    response = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${env.REVENUECAT_SECRET_API_KEY}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      },
    );
  } catch (error) {
    console.error("[revenuecat] entitlement lookup failed:", error);
    return "unknown";
  }

  if (response.status === 404) return "inactive";
  if (!response.ok) {
    console.error("[revenuecat] entitlement lookup returned:", response.status);
    return "unknown";
  }

  const parsed = subscriberSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) {
    console.error("[revenuecat] subscriber response was invalid");
    return "unknown";
  }

  const entitlement = parsed.data.subscriber.entitlements[
    env.REVENUECAT_ENTITLEMENT_ID
  ];
  if (!entitlement) return "inactive";

  const active = isInAccessPeriod(
    entitlement.expires_date,
    entitlement.grace_period_expires_date,
    Date.now(),
  );
  if (active === null) {
    console.error("[revenuecat] entitlement expiration was invalid");
    return "unknown";
  }

  return active ? "active" : "inactive";
}
