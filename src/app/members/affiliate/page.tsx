import type { Metadata } from "next";
import { AccessNotice } from "@/components/AccessNotice";
import { AffiliateBackOffice } from "@/components/AffiliateBackOffice";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { isAuthConfigured, isLusAuthConfigured } from "@/lib/env";
import { requireMember } from "@/lib/member-access";
import { getAffiliateBackOfficeStats } from "@/lib/whop-affiliates";
import { PUBLIC_SITE_URL } from "@/lib/checkout";

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

  if (!isAuthConfigured() || !isLusAuthConfigured()) {
    return <AccessNotice reason="not_configured" />;
  }

  const { user } = await requireMember("/members/affiliate");
  const result = await getAffiliateBackOfficeStats(
    user.sub,
    user.preferred_username,
  );
  let referralLink: string | null = null;
  if (result.status === "ready" && user.preferred_username) {
    const referralUrl = new URL("/join", PUBLIC_SITE_URL);
    referralUrl.searchParams.set("a", user.preferred_username);
    referralLink = referralUrl.toString();
  }

  return (
    <>
      <Nav memberArea />
      <AffiliateBackOffice
        result={result}
        referralLink={referralLink}
      />
      <Footer />
    </>
  );
}
