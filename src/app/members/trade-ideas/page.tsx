import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight, Download, MessageCircle } from "lucide-react";
import Link from "next/link";
import { AccessNotice } from "@/components/AccessNotice";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { Reveal } from "@/components/Reveal";
import { Glow, SectionLabel } from "@/components/ui";
import { isAuthConfigured } from "@/lib/env";
import { requireMember } from "@/lib/member-access";

export const instant = false;

export const metadata: Metadata = {
  title: "Join the Trade Ideas Chat — Level Up Society",
  description: "Get set up on Telegram and join the Level Up Society Trade Ideas chat.",
  robots: { index: false, follow: false },
};

export default async function TradeIdeasPage({
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

  await requireMember("/members/trade-ideas");

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
            <SectionLabel index="09" title="Trade ideas chat" tone="light" />
            <div className="mt-6 max-w-2xl">
              <h1 className="text-[clamp(2rem,4vw,3.2rem)] font-semibold leading-[1.04] tracking-[-0.04em] text-silver">
                Get ready for the trade ideas chat
              </h1>
              <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-silver/55">
                Download Telegram now. We’re finishing the secure connection between the chat and active Level Up Pro memberships.
              </p>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            <Reveal delay={0.08}>
              <section className="flex h-full flex-col rounded-card border border-silver/10 bg-silver/[0.035] p-7 sm:p-9">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-chrome">
                    Step 1
                  </span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-silver/10 bg-ink text-chrome">
                    <Download size={19} />
                  </span>
                </div>
                <h2 className="mt-7 text-[24px] font-semibold tracking-[-0.03em] text-silver">
                  Download Telegram
                </h2>
                <p className="mt-3 flex-1 text-[15px] leading-relaxed text-silver/55">
                  Install Telegram on your phone or computer. If you already have it, you can go straight to Step 2.
                </p>
                <a
                  href="https://telegram.org/dl/"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-7 inline-flex h-12 w-fit items-center gap-2 rounded-pill bg-[linear-gradient(180deg,#ffffff_0%,#e7ecf3_46%,#c2cad5_100%)] px-6 text-sm font-medium text-ink transition hover:brightness-[1.06]"
                >
                  Download Telegram
                  <ArrowUpRight size={15} />
                </a>
              </section>
            </Reveal>

            <Reveal delay={0.16}>
              <section className="flex h-full flex-col rounded-card border border-silver/10 bg-silver/[0.035] p-7 sm:p-9">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-chrome">
                    Step 2
                  </span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-silver/10 bg-ink text-chrome">
                    <MessageCircle size={19} />
                  </span>
                </div>
                <h2 className="mt-7 text-[24px] font-semibold tracking-[-0.03em] text-silver">
                  Secure member access is coming soon
                </h2>
                <p className="mt-3 flex-1 text-[15px] leading-relaxed text-silver/55">
                  We’re finishing the connection between your Level Up Pro membership and the Telegram group. We’ll add the join link here once active subscriptions can be verified and expired memberships can be removed automatically.
                </p>
                <span className="mt-7 inline-flex h-12 w-fit items-center rounded-pill border border-silver/15 px-6 text-sm font-medium text-silver/50">
                  Access setup in progress
                </span>
              </section>
            </Reveal>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
