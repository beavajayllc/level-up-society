import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ResourceLibraryShell } from "@/components/ResourceLibraryShell";
import { requireMember } from "@/lib/member-access";
import { masteryTopics } from "@/lib/resource-library";

export const instant = false;
export const metadata: Metadata = { title: "Resource Library — Level Up Society", robots: { index: false, follow: false } };

export default async function ResourcesPage() {
  await requireMember("/members/resources");
  return (
    <ResourceLibraryShell backHref="/members" backLabel="Back to the members area" label="Resource Library" title="Keep building, keep growing." description="Choose an area to explore and find resources for your next level.">
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {masteryTopics.map(({ slug, title, description, icon: Icon }) => (
          <Link key={slug} href={`/members/resources/${slug}`} className="group flex min-h-56 flex-col rounded-card border border-silver/10 bg-silver/[0.035] p-7 transition-colors hover:border-chrome/30 hover:bg-silver/[0.06] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-chrome">
            <span className="flex h-12 w-12 items-center justify-center rounded-tile border border-silver/10 bg-ink text-chrome"><Icon size={20} /></span>
            <h2 className="mt-6 text-xl font-semibold tracking-[-0.025em] text-silver">{title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-silver/70">{description}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm text-chrome/75">Explore <ArrowUpRight size={15} /></span>
          </Link>
        ))}
      </div>
    </ResourceLibraryShell>
  );
}
