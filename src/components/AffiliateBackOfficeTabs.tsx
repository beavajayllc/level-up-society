"use client";

import { useRef, useState, type ReactNode } from "react";
import { Activity, Users } from "lucide-react";
import type { InactiveAffiliateMember } from "@/lib/whop-affiliates";

type InactiveResult =
  | { status: "ready"; members: InactiveAffiliateMember[] }
  | { status: "not-enrolled" }
  | {
      status: "unavailable";
      reason: "product_not_configured" | "lookup_failed";
    };

type InactiveState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | InactiveResult;

function dateLabel(value: string | null): string {
  if (!value) return "End date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "End date unavailable";

  return `Ended ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)}`;
}

export function AffiliateBackOfficeTabs({
  performance,
}: {
  performance: ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<"performance" | "inactive">(
    "performance",
  );
  const [inactiveState, setInactiveState] = useState<InactiveState>({
    status: "idle",
  });
  const loading = useRef(false);
  const loaded = useRef(false);

  async function loadInactiveMembers(retry = false) {
    if (loading.current || (loaded.current && !retry)) return;

    loading.current = true;
    setInactiveState({ status: "loading" });

    try {
      const response = await fetch(
        "/api/members/affiliate/inactive-members",
        { cache: "no-store", headers: { Accept: "application/json" } },
      );
      const result = (await response.json()) as InactiveResult;
      if (!response.ok || !result || typeof result.status !== "string") {
        throw new Error("Inactive referrals could not be loaded.");
      }

      loaded.current = true;
      setInactiveState(result);
    } catch {
      setInactiveState({ status: "error" });
    } finally {
      loading.current = false;
    }
  }

  function selectTab(tab: "performance" | "inactive") {
    setActiveTab(tab);
    if (tab === "inactive") void loadInactiveMembers();
  }

  return (
    <section className="mt-12">
      <div
        role="tablist"
        aria-label="Affiliate back office sections"
        className="flex flex-wrap gap-2 border-b border-silver/10"
      >
        <button
          id="affiliate-performance-tab"
          type="button"
          role="tab"
          aria-selected={activeTab === "performance"}
          aria-controls="affiliate-performance-panel"
          onClick={() => selectTab("performance")}
          className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm transition-colors ${
            activeTab === "performance"
              ? "border-chrome text-silver"
              : "border-transparent text-silver/65 hover:text-silver"
          }`}
        >
          <Activity size={16} />
          Performance
        </button>
        <button
          id="affiliate-inactive-tab"
          type="button"
          role="tab"
          aria-selected={activeTab === "inactive"}
          aria-controls="affiliate-inactive-panel"
          onClick={() => selectTab("inactive")}
          className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm transition-colors ${
            activeTab === "inactive"
              ? "border-chrome text-silver"
              : "border-transparent text-silver/65 hover:text-silver"
          }`}
        >
          <Users size={16} />
          Inactive members
          {inactiveState.status === "ready" ? (
            <span className="rounded-full border border-silver/15 px-2 py-0.5 text-[11px] text-silver/70">
              {inactiveState.members.length}
            </span>
          ) : null}
        </button>
      </div>

      <div
        id="affiliate-performance-panel"
        role="tabpanel"
        aria-labelledby="affiliate-performance-tab"
        hidden={activeTab !== "performance"}
      >
        {performance}
      </div>

      <div
        id="affiliate-inactive-panel"
        role="tabpanel"
        aria-labelledby="affiliate-inactive-tab"
        hidden={activeTab !== "inactive"}
        className="mt-8"
      >
        {inactiveState.status === "idle" || inactiveState.status === "loading" ? (
          <section className="rounded-card border border-silver/10 bg-silver/[0.035] p-7 sm:p-9">
            <p className="text-sm text-silver/70" aria-live="polite">
              Checking your referral memberships with Whop…
            </p>
          </section>
        ) : inactiveState.status === "error" ||
          inactiveState.status === "unavailable" ? (
          <section className="rounded-card border border-silver/10 bg-silver/[0.035] p-7 sm:p-9">
            <h2 className="text-[20px] font-semibold text-silver">
              Inactive members couldn’t load
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-silver/70">
              We couldn’t verify your inactive referrals with Whop. Please try again.
            </p>
            <button
              type="button"
              onClick={() => void loadInactiveMembers(true)}
              className="mt-5 text-sm text-chrome underline underline-offset-4"
            >
              Try again
            </button>
          </section>
        ) : inactiveState.status === "not-enrolled" ? (
          <section className="rounded-card border border-silver/10 bg-silver/[0.035] p-7 sm:p-9">
            <p className="text-sm leading-relaxed text-silver/70">
              Your Whop affiliate profile isn’t active yet, so there are no referred members to show.
            </p>
          </section>
        ) : inactiveState.members.length === 0 ? (
          <section className="rounded-card border border-silver/10 bg-silver/[0.035] p-7 sm:p-9">
            <h2 className="text-[20px] font-semibold text-silver">
              No inactive referrals to show
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-silver/70">
              Your Level Up Pro referrals are either still active or none have ended yet.
            </p>
          </section>
        ) : (
          <section className="overflow-hidden rounded-card border border-silver/10 bg-silver/[0.035]">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-silver/10 px-6 py-5 sm:px-8">
              <div>
                <h2 className="text-[20px] font-semibold text-silver">
                  Members whose access ended
                </h2>
                <p className="mt-2 text-sm text-silver/65">
                  These referrals no longer have active Level Up Pro access.
                </p>
              </div>
              <span className="text-xs text-silver/55">Verified through Whop</span>
            </div>
            <ul className="divide-y divide-silver/10">
              {inactiveState.members.map((member, index) => (
                <li
                  key={`${member.displayName}-${member.inactiveSince ?? "unknown"}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 sm:px-8"
                >
                  <div>
                    <p className="font-medium text-silver">{member.displayName}</p>
                    <p className="mt-1 text-xs text-silver/60">
                      {dateLabel(member.inactiveSince)}
                    </p>
                  </div>
                  <span className="rounded-full border border-silver/15 px-3 py-1 text-[11px] capitalize text-silver/70">
                    {member.membershipStatus}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </section>
  );
}
