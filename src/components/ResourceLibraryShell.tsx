import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { Glow, SectionLabel } from "@/components/ui";

export function ResourceLibraryShell({ backHref, backLabel, label, title, description, children }: {
  backHref: string; backLabel: string; label: string; title: string; description: string; children: ReactNode;
}) {
  return (
    <>
      <Nav memberArea />
      <main className="relative flex-1 overflow-hidden bg-ink">
        <Glow className="right-[-10%] top-[-8%] h-[520px] w-[520px]" opacity={0.08} />
        <Glow className="-left-[12%] bottom-[-16%] h-[460px] w-[460px]" opacity={0.05} />
        <div className="container-x relative py-16 lg:py-20">
          <Link href={backHref} className="inline-flex items-center gap-2 text-[13px] text-silver/70 transition-colors hover:text-chrome">
            <ArrowLeft size={14} /> {backLabel}
          </Link>
          <div className="mt-8">
            <SectionLabel index="08" title={label} tone="light" />
            <h1 className="mt-6 max-w-3xl text-[clamp(2rem,4vw,3.2rem)] font-semibold leading-[1.04] tracking-[-0.04em] text-silver">{title}</h1>
            <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-silver/70">{description}</p>
          </div>
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
