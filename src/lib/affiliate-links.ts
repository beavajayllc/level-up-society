import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface AffiliateLinkHandle {
  handle: string;
  whopUsername: string;
}

export class AffiliateHandleTakenError extends Error {
  constructor() {
    super("That affiliate username is already taken.");
    this.name = "AffiliateHandleTakenError";
  }
}

export async function getAffiliateLinkHandle(
  lusUserId: string,
): Promise<AffiliateLinkHandle | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("affiliate_links")
    .select("handle, whop_username")
    .eq("lus_user_id", lusUserId)
    .maybeSingle();

  if (error) throw new Error("Affiliate link lookup failed.");
  if (!data) return null;

  return { handle: data.handle, whopUsername: data.whop_username };
}

export async function saveAffiliateLinkHandle(
  lusUserId: string,
  handle: string,
  whopUsername: string,
): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("affiliate_links").insert({
    lus_user_id: lusUserId,
    handle,
    whop_username: whopUsername,
    updated_at: new Date().toISOString(),
  });

  if (error?.code === "23505") {
    const { data, error: lookupError } = await admin
      .from("affiliate_links")
      .select("handle, whop_username")
      .eq("lus_user_id", lusUserId)
      .maybeSingle();
    if (
      !lookupError &&
      data?.handle === handle &&
      data.whop_username === whopUsername
    ) {
      return;
    }
    throw new AffiliateHandleTakenError();
  }
  if (error) throw new Error("Affiliate link could not be saved.");
}

export async function findAffiliateLinkHandle(
  handle: string,
): Promise<AffiliateLinkHandle | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("affiliate_links")
    .select("handle, whop_username")
    .eq("handle", handle)
    .maybeSingle();

  if (error) throw new Error("Affiliate referral lookup failed.");
  if (!data) return null;

  return { handle: data.handle, whopUsername: data.whop_username };
}
