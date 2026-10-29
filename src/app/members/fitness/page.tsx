import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarDays, HeartPulse } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { Reveal } from "@/components/Reveal";
import { Glow, SectionLabel } from "@/components/ui";
import { requireMember } from "@/lib/member-access";

export const instant = false;

export const metadata: Metadata = {
  title: "Fitness — Level Up Society",
  description: "Fitness calls and the Level Up Society member calendar.",
  robots: { index: false, follow: false },
};

export default async function FitnessPage() {
  await requireMember("/members/fitness");

  return (
    <>
      <Nav memberArea />
      <main className="relative flex-1 overflow-hidden bg-ink">
        <Glow className="right-[-10%] top-[-8%] h-[520px] w-[520px]" opacity={0.08} />
        <Glow className="-left-[12%] bottom-[-16%] h-[460px] w-[460px]" opacity={0.05} />
        <div className="container-x relative py-16 lg:py-20">
          <Link href="/members" className="inline-flex items-center gap-2 text-[13px] text-silver/45 transition-colors duration-300 hover:text-chrome">
            <ArrowLeft size={14} /> Back to the members area
          </Link>
          <Reveal>
            <SectionLabel index="11" title="Fitness" tone="light" />
            <div className="mt-6 max-w-2xl">
              <h1 className="text-[clamp(2rem,4vw,3.2rem)] font-semibold leading-[1.04] tracking-[-0.04em] text-silver">Make time for your fitness.</h1>
              <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-silver/55">Build healthy habits alongside everything else you&apos;re working toward.</p>
            </div>
          </Reveal>
          <Reveal delay={0.08} className="mt-10 max-w-2xl">
            <section className="rounded-card border border-silver/10 bg-silver/[0.035] p-7 sm:p-9">
              <div className="flex items-center justify-between gap-4">
                <span className="rounded-pill border border-silver/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-silver/50">Every other week</span>
                <span className="flex h-12 w-12 items-center justify-center rounded-tile border border-silver/10 bg-ink text-chrome"><HeartPulse size={20} /></span>
              </div>
              <h2 className="mt-6 text-[24px] font-semibold tracking-[-0.03em] text-silver">PJ LaBeach | Fitness</h2>
              <p className="mt-3 inline-flex items-center gap-2 text-[15px] text-silver/65"><CalendarDays size={16} className="text-chrome" /> Every other Thursday · 8:00 PM EST</p>
              <p className="mt-3 text-sm leading-relaxed text-silver/50">Starting October 29, 2026. Check the calendar for upcoming dates.</p>
              <Link href="/members#weekly-calls" className="mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-chrome transition-colors hover:text-silver">View the calls calendar <ArrowUpRight size={15} /></Link>
            </section>
          </Reveal>
        </div>
      </main>
      <Footer />
    </>
  );
}
