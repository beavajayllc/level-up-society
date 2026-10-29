import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { AccessNotice } from "@/components/AccessNotice";
import { EducatorSchedule } from "@/components/EducatorSchedule";
import { isAuthConfigured, isLusAuthConfigured } from "@/lib/env";
import { requireMember } from "@/lib/member-access";

export const instant = false;

export const metadata: Metadata = {
  title: "Live call schedule — Level Up Society",
  description: "The Level Up Society coaches’ schedule.",
  robots: { index: false, follow: false },
};

export default async function LiveCallsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  if (error) return <AccessNotice reason={error} />;
  if (!isAuthConfigured() || !isLusAuthConfigured()) return <AccessNotice reason="not_configured" />;

  await requireMember("/members/live-calls");
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

  return (
    <>
      <Nav memberArea />
      <main className="relative flex-1 bg-ink">
        <div className="container-x relative py-16 lg:py-20">
          <Link href="/members" className="inline-flex items-center gap-2 text-[13px] text-silver/70 transition-colors hover:text-chrome">
            <ArrowLeft size={14} /> Back to the members area
          </Link>
          <EducatorSchedule today={today} />
        </div>
      </main>
      <Footer />
    </>
  );
}
