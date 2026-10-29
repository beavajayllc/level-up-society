import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { AccessNotice } from "@/components/AccessNotice";
import { LiveCallsRoom } from "@/components/LiveCallsRoom";
import { isAuthConfigured, isLusAuthConfigured } from "@/lib/env";
import { requireMember } from "@/lib/member-access";
import { getLiveCalls } from "@/lib/whop-livestream";

export const instant = false;

export const metadata: Metadata = {
  title: "Live room — Level Up Society",
  description: "The Level Up Society live room and live chat.",
  robots: { index: false, follow: false },
};

export default async function LiveRoomPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  if (error) return <AccessNotice reason={error} />;
  if (!isAuthConfigured() || !isLusAuthConfigured()) return <AccessNotice reason="not_configured" />;

  const { lusUser } = await requireMember("/members/live-calls/watch");
  const liveCalls = await getLiveCalls();

  return (
    <>
      <Nav memberArea />
      <LiveCallsRoom initial={liveCalls} memberName={lusUser.username || "member"} />
      <Footer />
    </>
  );
}
