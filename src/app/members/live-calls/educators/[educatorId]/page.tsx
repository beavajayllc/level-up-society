import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { AccessNotice } from "@/components/AccessNotice";
import { LiveCallsRoom } from "@/components/LiveCallsRoom";
import { educators } from "@/lib/call-schedule";
import { isAuthConfigured, isLusAuthConfigured } from "@/lib/env";
import { requireMember } from "@/lib/member-access";
import { getLiveCalls } from "@/lib/whop-livestream";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ educatorId: string }> }): Promise<Metadata> {
  const { educatorId } = await params;
  const educator = educators.find((item) => item.id === educatorId);
  return {
    title: educator ? `${educator.name} — Level Up Society` : "Coach — Level Up Society",
    robots: { index: false, follow: false },
  };
}

export default async function EducatorPage({ params, searchParams }: {
  params: Promise<{ educatorId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { educatorId } = await params;
  const educator = educators.find((item) => item.id === educatorId);
  if (!educator) notFound();

  const { error } = await searchParams;
  if (error) return <AccessNotice reason={error} />;
  if (!isAuthConfigured() || !isLusAuthConfigured()) return <AccessNotice reason="not_configured" />;

  const { lusUser } = await requireMember(`/members/live-calls/educators/${educator.id}`);
  const liveCalls = await getLiveCalls();
  return (
    <>
      <Nav memberArea />
      <LiveCallsRoom initial={liveCalls} memberName={lusUser.username || "member"} educator={educator} />
      <Footer />
    </>
  );
}
