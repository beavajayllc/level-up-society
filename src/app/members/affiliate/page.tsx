import type { Metadata } from "next";
import { AccessNotice } from "@/components/AccessNotice";
import { AffiliateBackOffice } from "@/components/AffiliateBackOffice";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { isAuthConfigured } from "@/lib/env";
import { requireMember } from "@/lib/member-access";
import { getAffiliateBackOfficeStats } from "@/lib/whop-affiliates";

export const instant = false;

export const metadata: Metadata = {
  title: "Affiliate Back Office — Level Up Society",
  description: "Track your Level Up Society affiliate referrals and earnings.",
  robots: { index: false, follow: false },
};

export default async function AffiliateBackOfficePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  if (error) {
    return <AccessNotice reason={error} />;
  }

  if (!isAuthConfigured()) {
    return <AccessNotice reason="not_configured" />;
  }

  const { user } = await requireMember("/members/affiliate");
  const result = await getAffiliateBackOfficeStats(
    user.sub,
    user.preferred_username,
  );

  return (
    <>
      <Nav />
      <AffiliateBackOffice result={result} />
      <Footer />
    </>
  );
}
