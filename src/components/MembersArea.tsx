"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { memberResources } from "@/lib/data";
import { MemberSubscriptionCancellation } from "./MemberSubscriptionCancellation";
import { Reveal, Stagger, StaggerItem } from "./Reveal";
import { Glow, SectionLabel } from "./ui";
import type { WhopUserInfo } from "@/lib/whop-oauth";
import type { SubscriptionCancellationOption } from "@/lib/subscription-cancellation";

function displayName(user: WhopUserInfo): string {
  const raw = user.name ?? user.preferred_username ?? user.email ?? "member";
  return raw.split(" ")[0] ?? raw;
}

export function MembersArea({
  user,
  subscriptions,
}: {
  user: WhopUserInfo;
  subscriptions: SubscriptionCancellationOption[] | null;
}) {
  const name = displayName(user);

  return (
    <main className="relative flex-1 overflow-hidden bg-ink">
      <Glow className="right-[-8%] top-[-6%] h-[560px] w-[560px]" opacity={0.08} />
      <Glow className="-left-[10%] bottom-[-10%] h-[460px] w-[460px]" opacity={0.06} />

      <div className="container-x relative py-20 lg:py-28">
        <Reveal>
          <SectionLabel index="07" title="Members" tone="light" />
          <h1 className="mt-6 max-w-3xl text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-silver">
            Welcome inside,{" "}
            <span className="display-serif text-chrome-gradient">{name}</span>
          </h1>
          <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-silver/55">
            Your membership is active. Everything below is yours — go build.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2.5 rounded-pill border border-chrome/25 bg-chrome/10 px-4 py-2 text-[13px] text-chrome">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-chrome opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-chrome" />
              </span>
              Membership active
            </span>
            <span className="inline-flex items-center gap-2 rounded-pill border border-silver/12 bg-silver/4 px-4 py-2 text-[13px] text-silver/55">
              <ShieldCheck size={14} className="text-chrome/80" />
              Level Up Pro · $97/mo
            </span>
            {user.email ? (
              <span className="rounded-pill border border-silver/10 px-4 py-2 text-[13px] text-silver/45">
                {user.email}
              </span>
            ) : null}
          </div>
        </Reveal>

        <Stagger className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {memberResources.map((resource) => {
            const Icon = resource.icon;
            return (
              <StaggerItem key={resource.id} className="sm:col-span-1">
                <motion.article
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className="group relative flex h-full flex-col overflow-hidden rounded-card border border-silver/8 bg-silver/[0.035] p-7 transition-colors duration-500 hover:border-chrome/30 hover:bg-silver/[0.06]"
                >
                  <div className="flex items-start justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-tile border border-silver/10 bg-ink text-chrome transition-colors duration-500 group-hover:border-chrome/60">
                      <Icon size={20} strokeWidth={1.8} />
                    </span>
                    <span className="rounded-pill border border-silver/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-silver/40">
                      {resource.tag}
                    </span>
                  </div>

                  <h3 className="mt-6 text-[20px] font-semibold tracking-[-0.025em] text-silver">
                    {resource.title}
                  </h3>
                  <p className="mt-2.5 flex-1 text-[15px] leading-relaxed text-silver/50">
                    {resource.body}
                  </p>

                  <span className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-silver/40 transition-colors duration-300 group-hover:text-chrome">
                    {resource.cta ?? "Open"}
                    <ArrowUpRight
                      size={14}
                      className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </span>
                  {resource.href ? (
                    <Link
                      href={resource.href}
                      aria-label={resource.cta ?? `Open ${resource.title}`}
                      className="absolute inset-0 rounded-card"
                    />
                  ) : null}
                </motion.article>
              </StaggerItem>
            );
          })}

        </Stagger>

        <MemberSubscriptionCancellation subscriptions={subscriptions} />
      </div>
    </main>
  );
}
