import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/Footer";
import { FitnessPlanner } from "@/components/FitnessPlanner";
import { Nav } from "@/components/Nav";
import { Reveal } from "@/components/Reveal";
import { Glow, SectionLabel } from "@/components/ui";
import { requireMember } from "@/lib/member-access";

export const instant = false;

export const metadata: Metadata = {
  title: "Fitness — Level Up Society",
  description: "Build a fitness starting plan based on your goals and schedule.",
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
          <Link href="/members" className="inline-flex items-center gap-2 text-[13px] text-silver/70 transition-colors duration-300 hover:text-chrome">
            <ArrowLeft size={14} /> Back to the members area
          </Link>
          <Reveal>
            <SectionLabel index="11" title="Fitness" tone="light" />
            <div className="mt-6 max-w-2xl">
              <h1 className="text-[clamp(2rem,4vw,3.2rem)] font-semibold leading-[1.04] tracking-[-0.04em] text-silver">Make time for your fitness.</h1>
              <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-silver/70">Build healthy habits alongside everything else you&apos;re working toward.</p>
            </div>
          </Reveal>
          <FitnessPlanner />
        </div>
      </main>
      <Footer />
    </>
  );
}
