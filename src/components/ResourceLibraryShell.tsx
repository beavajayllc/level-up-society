import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ChevronDown } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { Glow, SectionLabel } from "@/components/ui";
import { masteryTopics } from "@/lib/resource-library";

export function ResourceLibraryShell({ backHref, backLabel, label, title, description, activeTopic, children }: {
  backHref: string; backLabel: string; label: string; title: string; description: string; activeTopic?: string; children: ReactNode;
}) {
  return (
    <>
      <Nav memberArea />
      <main className="relative flex-1 overflow-hidden bg-ink">
        <Glow className="right-[-10%] top-[-8%] h-[520px] w-[520px]" opacity={0.08} />
        <Glow className="-left-[12%] bottom-[-16%] h-[460px] w-[460px]" opacity={0.05} />
        <div className="container-x relative grid items-start gap-6 py-14 lg:grid-cols-[235px_minmax(0,1fr)] lg:gap-8 lg:py-20">
          <aside className="lg:sticky lg:top-24">
            <details open className="group rounded-card border border-silver/10 bg-silver/[0.035] p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-silver">
                Resource Library <ChevronDown size={16} className="transition group-open:rotate-180" />
              </summary>
              <nav aria-label="Resource Library topics" className="mt-3 border-t border-silver/10 pt-2">
                {masteryTopics.map(({ slug, title: topicTitle, icon: Icon }) => (
                  <Link key={slug} href={`/members/resources/${slug}`} aria-current={activeTopic === slug ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition hover:bg-silver/5 hover:text-silver ${activeTopic === slug ? "bg-accent-strong/10 font-semibold text-accent-strong" : "text-silver/75"}`}>
                    <Icon size={17} className="shrink-0 text-accent-strong" /><span className="flex-1">{topicTitle}</span><ArrowUpRight size={14} />
                  </Link>
                ))}
              </nav>
              <Link href="/members" className="mt-2 flex items-center gap-2 border-t border-silver/10 px-3 pt-4 text-xs text-silver/65 hover:text-silver"><ArrowLeft size={14} /> Members area</Link>
            </details>
          </aside>
          <div className="min-w-0">
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
        </div>
      </main>
      <Footer />
    </>
  );
}
