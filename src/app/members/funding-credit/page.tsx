import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AccessNotice } from "@/components/AccessNotice";
import { Footer } from "@/components/Footer";
import { FundingCreditQuestionnaire } from "@/components/FundingCreditQuestionnaire";
import { Nav } from "@/components/Nav";
import { Reveal } from "@/components/Reveal";
import { Glow, SectionLabel } from "@/components/ui";
import { isAuthConfigured } from "@/lib/env";
import { requireMember } from "@/lib/member-access";

export const instant = false;

export const metadata: Metadata = {
  title: "Funding & Credit Desk — Level Up Society",
  description: "Find the right next step for your credit and funding goals.",
  robots: { index: false, follow: false },
};

export default async function FundingCreditPage({
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

  await requireMember("/members/funding-credit");

  return (
    <>
      <Nav />
      <main className="relative flex-1 overflow-hidden bg-ink">
        <Glow className="right-[-10%] top-[-8%] h-[520px] w-[520px]" opacity={0.08} />
        <Glow className="-left-[12%] bottom-[-16%] h-[460px] w-[460px]" opacity={0.05} />

        <div className="container-x relative py-16 lg:py-20">
          <Link
            href="/members"
            className="inline-flex items-center gap-2 text-[13px] text-silver/45 transition-colors duration-300 hover:text-chrome"
          >
            <ArrowLeft size={14} />
            Back to the members area
          </Link>

          <Reveal>
            <SectionLabel index="10" title="Funding & credit desk" tone="light" />
            <div className="mt-6 max-w-2xl">
              <h1 className="text-[clamp(2rem,4vw,3.2rem)] font-semibold leading-[1.04] tracking-[-0.04em] text-silver">
                Find your next step
              </h1>
              <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-silver/55">
                Answer a few quick questions so you can see which credit or funding support may fit where you are right now.
              </p>
            </div>
          </Reveal>

          <FundingCreditQuestionnaire />
        </div>
      </main>
      <Footer />
    </>
  );
}
