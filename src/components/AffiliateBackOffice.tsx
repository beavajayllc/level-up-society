import {
  Activity,
  ArrowLeft,
  BadgeDollarSign,
  ChartNoAxesCombined,
  CircleDollarSign,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { AffiliateReferralLink } from "@/components/AffiliateReferralLink";
import { Reveal } from "@/components/Reveal";
import { Glow, SectionLabel } from "@/components/ui";
import type { AffiliateBackOfficeResult } from "@/lib/whop-affiliates";

function money(value: string | null): string {
  if (value === null) return "—";

  const amount = Number(value.replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(amount)) return value;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

function percentage(value: string | null): string {
  if (value === null) return "—";

  const cleaned = value.trim();
  const number = Number(cleaned.replace("%", ""));
  if (!Number.isFinite(number)) return "—";

  const percent = cleaned.endsWith("%") ? number : number <= 1 ? number * 100 : number;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(percent) + "%";
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-card border border-silver/10 bg-silver/[0.035] p-6 sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <span className="text-[13px] text-silver/50">{label}</span>
        <span className="flex h-10 w-10 items-center justify-center rounded-tile border border-chrome/15 bg-chrome/5 text-chrome">
          <Icon size={17} strokeWidth={1.8} />
        </span>
      </div>
      <p className="mt-7 text-[clamp(1.8rem,4vw,2.5rem)] font-semibold tracking-[-0.045em] text-silver">
        {value}
      </p>
      <p className="mt-2 text-[12px] text-silver/35">{detail}</p>
    </article>
  );
}

export function AffiliateBackOffice({
  result,
  referralLink,
}: {
  result: AffiliateBackOfficeResult;
  referralLink: string | null;
}) {
  return (
    <main className="relative flex-1 overflow-hidden bg-ink">
      <Glow className="right-[-8%] top-[-8%] h-[560px] w-[560px]" opacity={0.08} />
      <Glow className="-left-[12%] bottom-[-10%] h-[460px] w-[460px]" opacity={0.05} />

      <div className="container-x relative py-16 lg:py-20">
        <Link
          href="/members"
          className="inline-flex items-center gap-2 text-[13px] text-silver/45 transition-colors duration-300 hover:text-chrome"
        >
          <ArrowLeft size={14} />
          Back to the members area
        </Link>

        <Reveal>
          <SectionLabel index="11" title="Affiliate back office" tone="light" />
          <div className="mt-6 max-w-3xl">
            <h1 className="text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-[1.04] tracking-[-0.04em] text-silver">
              Your growth,{" "}
              <span className="display-serif text-chrome-gradient">in motion.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-silver/55">
              See how your referrals are growing Level Up Society. Your stats come directly from Whop and are private to your signed-in account.
            </p>
          </div>
        </Reveal>

        {referralLink ? (
          <Reveal delay={0.08}>
            <AffiliateReferralLink href={referralLink} />
          </Reveal>
        ) : null}

        {result.status === "ready" ? (
          <>
            <Reveal delay={0.12}>
              <div className="mt-12 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <SectionLabel index="01" title="Performance" tone="light" />
                  <h2 className="mt-4 text-[26px] font-semibold tracking-[-0.035em] text-silver">
                    Your referral snapshot
                  </h2>
                </div>
                <p className="max-w-sm text-[12px] leading-relaxed text-silver/35">
                  Whop totals, refreshed when you open this page.
                </p>
              </div>
            </Reveal>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <MetricCard
                icon={Users}
                label="Total referrals"
                value={result.stats.referrals.toLocaleString("en-US")}
                detail={
                  result.stats.activeReferrals === null
                    ? "Level Up Pro referrals recorded by Whop"
                    : "People referred through your affiliate links"
                }
              />
              <MetricCard
                icon={Activity}
                label="Active referrals"
                value={result.stats.activeReferrals?.toLocaleString("en-US") ?? "—"}
                detail={
                  result.stats.activeReferrals === null
                    ? "Whop will show this after your first referrals"
                    : "Referred customers with active memberships"
                }
              />
              <MetricCard
                icon={BadgeDollarSign}
                label="Commission earned"
                value={money(result.stats.commissionEarnedUsd)}
                detail={
                  result.stats.commissionEarnedUsd === null
                    ? "Whop will show this after your first attributed sale"
                    : "All-time commissions from your referrals"
                }
              />
              <MetricCard
                icon={CircleDollarSign}
                label="Revenue generated"
                value={money(result.stats.revenueGeneratedUsd)}
                detail={
                  result.stats.revenueGeneratedUsd === null
                    ? "Whop will show this after your first attributed sale"
                    : "Total revenue from your referrals"
                }
              />
              <MetricCard
                icon={ChartNoAxesCombined}
                label="Monthly recurring revenue"
                value={money(result.stats.monthlyRecurringRevenueUsd)}
                detail={
                  result.stats.monthlyRecurringRevenueUsd === null
                    ? "Whop will show this when referred memberships renew"
                    : "Current monthly revenue from your referrals"
                }
              />
              <MetricCard
                icon={Activity}
                label="90-day retention"
                value={percentage(result.stats.retentionRateNinetyDays)}
                detail={
                  result.stats.retentionRate === null
                    ? "Retention appears as your referrals build history"
                    : "Overall customer retention: " + percentage(result.stats.retentionRate)
                }
              />
            </div>

            {result.stats.product ? (
              <Reveal delay={0.16}>
                <section className="mt-8 rounded-card border border-silver/10 bg-silver/[0.025] p-7 sm:p-9">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <SectionLabel index="02" title="Level Up Pro" tone="light" />
                      <h2 className="mt-4 text-[22px] font-semibold tracking-[-0.03em] text-silver">
                        Product performance
                      </h2>
                    </div>
                    <p className="text-[12px] text-silver/35">
                      Specific to the Level Up Pro products that unlock membership
                    </p>
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-card border border-silver/8 bg-ink/55 p-6">
                      <p className="text-[13px] text-silver/45">Level Up Pro referrals</p>
                      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-silver">
                        {result.stats.product.referrals.toLocaleString("en-US")}
                      </p>
                    </div>
                    <div className="rounded-card border border-silver/8 bg-ink/55 p-6">
                      <p className="text-[13px] text-silver/45">Level Up Pro rewards</p>
                      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-silver">
                        {result.stats.product.rewardsUsd}
                      </p>
                    </div>
                  </div>
                </section>
              </Reveal>
            ) : null}

            <p className="mt-6 max-w-3xl text-[12px] leading-relaxed text-silver/30">
              Whop provides these referral and earnings totals. Your tracked link sends people to the Level Up Pro checkout on our website.
            </p>
          </>
        ) : result.status === "not-enrolled" ? (
          <section className="mt-10 rounded-card border border-silver/10 bg-silver/[0.035] p-7 sm:p-9">
            <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-silver">
              Your Whop affiliate profile isn’t active yet
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-silver/50">
              Once Whop has enrolled your account in the Level Up Pro affiliate program, your referral link, totals, and earnings will show here.
            </p>
          </section>
        ) : (
          <section className="mt-10 rounded-card border border-silver/10 bg-silver/[0.035] p-7 sm:p-9">
            <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-silver">
              Your affiliate stats couldn’t load
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-silver/50">
              Whop didn’t return your referral data just now. Try again in a moment; your link and stats will load when Whop responds.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
