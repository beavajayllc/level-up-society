import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { ResourceLibraryShell } from "@/components/ResourceLibraryShell";
import { requireMember } from "@/lib/member-access";
import { masteryTopics, mindsetFormats } from "@/lib/resource-library";
import { resourceCatalog } from "@/lib/resource-catalog";

export const instant = false;
export const metadata: Metadata = { title: "Mastery Resources — Level Up Society", robots: { index: false, follow: false } };

export default async function MasteryFormatPage({ params }: { params: Promise<{ topic: string; format: string }> }) {
  const { topic, format } = await params;
  const selected = mindsetFormats.find((item) => item.slug === format);
  const mastery = masteryTopics.find((item) => item.slug === topic);
  if (!mastery || !selected) notFound();
  await requireMember(`/members/resources/${mastery.slug}/${selected.slug}`);
  const action = selected.slug === "audiobooks" ? "Listen on LibriVox" : selected.slug === "books" ? "Read on Project Gutenberg" : "Watch on YouTube";

  return (
    <ResourceLibraryShell backHref={`/members/resources/${mastery.slug}`} backLabel={`Back to ${mastery.title}`} label={mastery.title} title={selected.title} description={selected.description}>
      <p className="mt-8 text-sm leading-relaxed text-silver/70">These free resources open on their original platforms, where the creators and publishers receive credit.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {resourceCatalog[mastery.slug][selected.slug].map((resource) => (
          <article key={resource.href} className="relative flex h-full flex-col rounded-card border border-silver/10 bg-silver/[0.035] p-7">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-chrome/60">{resource.source}</span>
            <h2 className="mt-4 text-xl font-semibold tracking-[-0.025em] text-silver">{resource.title}</h2>
            <p className="mt-2 text-sm text-chrome/70">{resource.creator}</p>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-silver/70">{resource.description}</p>
            <a href={resource.href} target="_blank" rel="noopener noreferrer" className={`mt-6 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-chrome transition-colors hover:text-crest-gold-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-chrome ${resource.cover ? "mr-14" : ""}`}>
              {resource.action ?? action} <ArrowUpRight size={15} /> <span className="sr-only">(opens in a new tab)</span>
            </a>
            {resource.cover ? (
              <Image src={resource.cover} alt={`${resource.coverCredit ?? "LibriVox cover art"} for ${resource.title}`} title={resource.coverCredit ?? "Cover art: LibriVox"} width={48} height={48} className="absolute bottom-6 right-7 h-12 w-12 rounded-md object-cover" />
            ) : null}
          </article>
        ))}
      </div>
    </ResourceLibraryShell>
  );
}
