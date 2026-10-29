import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, BookOpen, Headphones, PlayCircle } from "lucide-react";
import { ResourceLibraryShell } from "@/components/ResourceLibraryShell";
import { requireMember } from "@/lib/member-access";
import { masteryTopics, mindsetFormats } from "@/lib/resource-library";

export const instant = false;
export const metadata: Metadata = { title: "Mastery Resources — Level Up Society", robots: { index: false, follow: false } };

const formatIcons = { audiobooks: Headphones, books: BookOpen, videos: PlayCircle };

export default async function MasteryPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const mastery = masteryTopics.find((item) => item.slug === topic);
  if (!mastery) notFound();
  await requireMember(`/members/resources/${mastery.slug}`);
  return (
    <ResourceLibraryShell backHref="/members/resources" backLabel="Back to Resource Library" label="Resource Library" title={mastery.title} description={`${mastery.description} Choose how you want to learn.`}>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {mindsetFormats.map(({ slug, title, description }) => {
            const Icon = formatIcons[slug];
            return (
              <Link key={slug} href={`/members/resources/${mastery.slug}/${slug}`} className="group flex min-h-56 flex-col rounded-card border border-silver/10 bg-silver/[0.035] p-7 transition-colors hover:border-chrome/30 hover:bg-silver/[0.06] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-chrome">
                <span className="flex h-12 w-12 items-center justify-center rounded-tile border border-silver/10 bg-ink text-chrome"><Icon size={20} /></span>
                <h2 className="mt-6 text-xl font-semibold text-silver">{title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-silver/70">{description}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm text-chrome/75">Explore <ArrowUpRight size={15} /></span>
              </Link>
            );
          })}
        </div>
    </ResourceLibraryShell>
  );
}
