import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { AccessNotice } from "@/components/AccessNotice";
import { LiveCallsRoom } from "@/components/LiveCallsRoom";
import { isAuthConfigured, isLusAuthConfigured } from "@/lib/env";
import { requireMember } from "@/lib/member-access";
import { getLiveCalls } from "@/lib/whop-livestream";
import type { WhopUserInfo } from "@/lib/whop-oauth";

/**
 * The dedicated live calls page.
 *
 * Members land here from the "Live calls" card in the members area. It shows
 * the call that is on air right now and the live chat beside it. Nothing on
 * this page pretends a call is live when it is not, so a quiet week looks
 * quiet.
 */
export const instant = false;

export const metadata: Metadata = {
  title: "Live calls — Level Up Society",
  description: "The Level Up Society live room and live chat.",
  robots: { index: false, follow: false },
};

function displayName(user: WhopUserInfo): string {
  const raw = user.name ?? user.preferred_username ?? user.email ?? "member";
  return raw.split(" ")[0] ?? raw;
}

export default async function LiveCallsPage({
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

  const { lusUser } = await requireMember("/members/live-calls");
  const liveCalls = await getLiveCalls();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

  return (
    <>
      <Nav memberArea />
      <LiveCallsRoom initial={liveCalls} memberName={lusUser.username || "member"} today={today} />
      <Footer />
    </>
  );
}
