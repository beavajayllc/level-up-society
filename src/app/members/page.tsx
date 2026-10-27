import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { AccessNotice } from "@/components/AccessNotice";
import { MembersArea } from "@/components/MembersArea";
import { isAuthConfigured, isLusAuthConfigured } from "@/lib/env";
import { requireMember } from "@/lib/member-access";
import { getSubscriptionCancellationOptions } from "@/lib/whop-access";

/**
 * The members area reads the WHOP session cookie on every request, so it can
 * never be prerendered into a static shell. Opting out of instant navigation
 * lets this route block on the server, which is the correct behaviour for a
 * per-user authenticated page.
 */
export const instant = false;

export const metadata: Metadata = {
  title: "Members — Level Up Society",
  description: "The Level Up Society members area.",
  robots: { index: false, follow: false },
};

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  if (error) {
    return <AccessNotice reason={error} />;
  }

  // Never throw a 500 at a signed-out visitor when WHOP is not wired up yet.
  if (!isAuthConfigured() || !isLusAuthConfigured()) {
    return <AccessNotice reason="not_configured" />;
  }

  const { user, lusUser } = await requireMember();
  const subscriptions = await getSubscriptionCancellationOptions(user.sub);

  return (
    <>
      <Nav />
      <MembersArea user={user} lusUsername={lusUser.username} lusEmail={lusUser.email} subscriptions={subscriptions} />
      <Footer />
    </>
  );
}
