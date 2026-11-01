import Link from "next/link";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { memberResources, type MemberResource } from "@/lib/data";

export function MemberMenu({ activeId, resources = memberResources }: { activeId?: string; resources?: MemberResource[] }) {
  return (
    <aside className="lg:sticky lg:top-24">
      <details open className="group rounded-card border border-silver/10 bg-silver/[0.035] p-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-silver">
          Member menu <ChevronDown size={16} className="transition group-open:rotate-180" />
        </summary>
        <nav aria-label="Member resources" className="mt-3 border-t border-silver/10 pt-2">
          {resources.map((resource) => {
            const Icon = resource.icon;
            const content = <><Icon size={17} className="shrink-0 text-accent-strong" /><span className="flex-1">{resource.title}</span>{resource.href ? <ArrowUpRight size={14} /> : null}</>;
            return resource.href ? (
              <Link key={resource.id} href={resource.href} aria-current={resource.id === activeId ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition hover:bg-silver/5 hover:text-silver ${resource.id === activeId ? "bg-accent-strong/10 font-semibold text-accent-strong" : "text-silver/75"}`}>{content}</Link>
            ) : (
              <span key={resource.id} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-silver/45">{content}</span>
            );
          })}
        </nav>
      </details>
    </aside>
  );
}
