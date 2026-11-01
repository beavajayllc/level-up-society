"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { MemberMenu } from "./MemberMenu";
import { MemberSubscriptionCancellation } from "./MemberSubscriptionCancellation";
import { MemberAnnouncements } from "./MemberAnnouncements";
import { WeeklyCallsCalendar } from "./WeeklyCallsCalendar";
import { Glow, SectionLabel } from "./ui";
import type { WhopUserInfo } from "@/lib/whop-oauth";
import type { SubscriptionCancellationOption } from "@/lib/subscription-cancellation";
import type { AnnouncementView } from "@/lib/member-announcements";
import type { AffiliateBackOfficeResult } from "@/lib/whop-affiliates";

const featuredProducts = [
  { name: "BOOST Patch", description: "Designed to support energy throughout your day, without caffeine.", image: "https://us.superpatch.com/cdn/shop/files/NA_SP_Boost_30PK.webp?v=1773064983" },
  { name: "FOCUS Patch", description: "Designed to support concentration and attention as you work or study.", image: "https://us.superpatch.com/cdn/shop/files/NA_SP_Focus_30PK.webp?v=1773065124" },
  { name: "REM Patch", description: "Designed to support restful sleep and your nighttime routine.", image: "https://us.superpatch.com/cdn/shop/files/NA_SP_REM_30PK.webp?v=1773065560" },
];
const superPatchShop = "https://shop.superpatch.com/#/shop/from/111115011";

function ProductSlideshow() {
  const [index, setIndex] = useState(0);
  const product = featuredProducts[index];
  function move(offset: number) {
    setIndex((current) => (current + offset + featuredProducts.length) % featuredProducts.length);
  }
  return (
    <section aria-labelledby="featured-products-title" className="rounded-card border border-silver/10 bg-silver/[0.035] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent-strong">A little something for you</p><h2 id="featured-products-title" className="mt-2 text-lg font-semibold text-silver">Products of the week</h2></div>
        <div className="flex gap-1"><button type="button" onClick={() => move(-1)} aria-label="Previous product" className="rounded-full border border-silver/10 p-1.5 text-silver/70 hover:text-silver"><ChevronLeft size={15} /></button><button type="button" onClick={() => move(1)} aria-label="Next product" className="rounded-full border border-silver/10 p-1.5 text-silver/70 hover:text-silver"><ChevronRight size={15} /></button></div>
      </div>
      <div aria-live="polite" className="mt-4 flex items-center gap-4">
        <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-xl bg-[#dedede]"><Image unoptimized src={product.image} alt={product.name} fill sizes="128px" className="object-contain" /></div>
        <div><p className="text-xs uppercase tracking-wider text-silver/55">The Super Patch Company</p><p className="mt-1 font-semibold text-silver">{product.name}</p><p className="mt-1 text-xs leading-relaxed text-silver/65">{product.description}</p><a href={superPatchShop} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent-strong hover:underline">Explore the shop <ArrowUpRight size={13} /></a></div>
      </div>
      <p className="mt-3 text-xs text-silver/50">{index + 1} / {featuredProducts.length}</p>
    </section>
  );
}

function TradeResults() {
  const results = [
    { title: "Weekly results", period: "October 26–30, 2026", pips: "+5,880", trades: "29*", days: "5 / 5", flyer: "/member-dashboard/trade-results-oct-26-30.png" },
    { title: "Monthly results", period: "October 1–30, 2026", pips: "+24,180", trades: "107*", days: "22 / 22" },
  ];

  return (
    <section aria-labelledby="trade-results-title" className="rounded-card border border-silver/10 bg-silver/[0.035] p-5 sm:p-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent-strong">Level Up Society trades</p>
      <h2 id="trade-results-title" className="mt-2 text-lg font-semibold text-silver">Trade results</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {results.map((result) => (
          <div key={result.title} className="rounded-xl border border-silver/10 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><h3 className="text-sm font-semibold text-silver">{result.title}</h3><p className="mt-1 text-xs text-silver/60">{result.period} · reported recap</p></div>
              {result.flyer && <a href={result.flyer} target="_blank" rel="noopener noreferrer" aria-label={`Share: open the ${result.period} results image`} className="inline-flex items-center gap-1 text-xs font-semibold text-accent-strong hover:underline">Share <ArrowUpRight size={13} /></a>}
            </div>
            <dl className="mt-3 space-y-2 border-t border-silver/10 pt-3 text-xs">
              <div className="flex justify-between gap-2"><dt className="text-silver/60">Net pips</dt><dd className="font-semibold text-silver">{result.pips}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-silver/60">Trades taken</dt><dd className="font-semibold text-silver">{result.trades}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-silver/60">Positive days</dt><dd className="font-semibold text-silver">{result.days}</dd></div>
            </dl>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-silver/55">*Some trade counts were estimated. October 30’s itemized total differs from the daily recap; these totals use the recap.</p>
      <p className="mt-2 text-xs leading-relaxed text-silver/55">Past performance does not guarantee future results. Trading involves substantial risk. Individual results vary.</p>
    </section>
  );
}

function displayName(user: WhopUserInfo): string {
  const raw = user.name ?? user.preferred_username ?? user.email ?? "member";
  return raw.split(" ")[0] ?? raw;
}

export function MembersArea({ user, lusUsername, lusEmail, subscriptions, today, announcements, affiliate }: { user: WhopUserInfo; lusUsername: string; lusEmail: string; subscriptions: SubscriptionCancellationOption[] | null; today: string; announcements: AnnouncementView; affiliate: AffiliateBackOfficeResult }) {
  const name = lusUsername || displayName(user);
  return (
    <main className="relative flex-1 overflow-hidden bg-ink">
      <Glow className="right-[-8%] top-[-6%] h-[560px] w-[560px]" opacity={0.08} />
      <div className="container-x relative py-14 lg:py-20">
        <SectionLabel index="07" title="Members" tone="light" />
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div><h1 className="text-[clamp(2rem,4vw,3.3rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-silver">Welcome inside, <span className="display-serif text-chrome-gradient">{name}</span></h1><p className="mt-3 text-sm leading-relaxed text-silver/70">Your membership is active. Everything below is yours — go build.</p></div>
          <div className="flex flex-wrap gap-2"><span className="rounded-pill border border-pink/30 bg-pink/10 px-3 py-2 text-xs text-accent-strong">Membership active</span><span className="inline-flex items-center gap-2 rounded-pill border border-silver/12 px-3 py-2 text-xs text-silver/70"><ShieldCheck size={13} /> Level Up Pro · $97/mo</span></div>
        </div>
        <div className="mt-9 grid items-start gap-6 lg:grid-cols-[235px_minmax(0,1fr)] lg:gap-8">
          <MemberMenu />
          <div className="min-w-0 space-y-6">
            <div className="grid items-stretch gap-5 xl:grid-cols-2"><div className="-mt-6"><WeeklyCallsCalendar today={today} /></div><MemberAnnouncements view={announcements} /></div>
            <div className="grid gap-5 xl:grid-cols-2"><ProductSlideshow /><TradeResults /></div>
            <div className="grid gap-5 md:grid-cols-2">
            <section aria-labelledby="affiliate-earnings-title" className="rounded-card border border-silver/10 bg-silver/[0.035] p-5 sm:p-6"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent-strong">Your affiliate back office</p><h2 id="affiliate-earnings-title" className="mt-2 text-lg font-semibold text-silver">Affiliate earnings</h2>{affiliate.status === "ready" ? <><p className="mt-3 text-xs text-silver/60">All-time commissions</p><p className="mt-1 text-2xl font-semibold text-silver">{affiliate.stats.commissionEarnedUsd ?? affiliate.stats.product?.rewardsUsd ?? "Unavailable"}</p><p className="mt-2 text-xs leading-relaxed text-silver/60">A monthly commission total is not available here yet.</p></> : <p className="mt-3 text-sm leading-relaxed text-silver/65">{affiliate.status === "not-enrolled" ? "Activate your affiliate profile to start tracking referrals." : "Your earnings couldn’t be loaded right now."}</p>}<Link href="/members/affiliate" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent-strong hover:underline">Open affiliate back office <ArrowUpRight size={13} /></Link></section>
            <section aria-labelledby="monthly-call-title" className="rounded-card border border-silver/10 bg-silver/[0.035] p-5 sm:p-6"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent-strong">Get together</p><h2 id="monthly-call-title" className="mt-2 text-lg font-semibold text-silver">Call of the month</h2><div className="mt-4 flex flex-wrap items-center gap-5"><Image src="/brand/monthly-level-up-call.png" alt="Monthly Level Up Call with a special guest, the first week of every month" width={160} height={160} className="h-32 w-32 rounded-xl object-cover" /><div><p className="text-sm text-silver/70">Join us for the monthly Level Up Call with a special guest.</p><Link href="/members/live-calls" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent-strong hover:underline">Explore live calls <ArrowDownRight size={14} /></Link></div></div></section>
            </div>
            <MemberSubscriptionCancellation subscriptions={subscriptions} />
            {lusEmail ? <p className="text-xs text-silver/50">Signed in as {lusEmail}</p> : null}
          </div>
        </div>
      </div>
    </main>
  );
}
