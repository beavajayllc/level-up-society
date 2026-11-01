import type { Metadata } from "next";
import { ResourceLibraryShell } from "@/components/ResourceLibraryShell";
import { requireMember } from "@/lib/member-access";

export const instant = false;
export const metadata: Metadata = { title: "Resource Library — Level Up Society", robots: { index: false, follow: false } };

export default async function ResourcesPage() {
  await requireMember("/members/resources");
  return (
    <ResourceLibraryShell backHref="/members" backLabel="Back to the members area" label="Resource Library" title="Keep building, keep growing." description="Choose an area to explore and find resources for your next level.">
      <div className="mt-10 rounded-card border border-silver/10 bg-silver/[0.035] p-7">
        <h2 className="text-lg font-semibold text-silver">Explore your resources</h2>
        <p className="mt-2 text-sm leading-relaxed text-silver/70">Choose a mastery area from the Resource Library menu to explore books, audiobooks, and videos.</p>
      </div>
    </ResourceLibraryShell>
  );
}
