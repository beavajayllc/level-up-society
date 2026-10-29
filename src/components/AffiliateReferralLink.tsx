"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function AffiliateReferralLink({ href }: { href: string }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(href);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  return (
    <section className="mt-10 grid gap-6 rounded-card-lg border border-chrome/15 bg-[linear-gradient(135deg,rgba(255,255,255,0.075),rgba(255,255,255,0.018))] p-7 sm:p-9 lg:grid-cols-[1fr_minmax(20rem,0.9fr)] lg:items-center">
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-pill border border-chrome/20 bg-chrome/5 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-chrome">
          Your personal link
        </span>
        <h2 className="mt-5 text-[22px] font-semibold tracking-[-0.03em] text-silver">
          Share Level Up Pro
        </h2>
        <p className="mt-2.5 text-[14px] leading-relaxed text-silver/70">
          Send people this link to open the Level Up Pro checkout on our website.
          Whop tracks eligible referrals to your account.
        </p>
      </div>

      <div>
        <label
          htmlFor="affiliate-referral-link"
          className="mb-2 block text-[12px] text-silver/70"
        >
          Your referral link
        </label>
        <div className="flex gap-2">
          <input
            id="affiliate-referral-link"
            readOnly
            value={href}
            onFocus={(event) => event.currentTarget.select()}
            className="h-12 min-w-0 flex-1 rounded-pill border border-silver/10 bg-ink/70 px-4 text-[13px] text-silver/75 outline-none focus:border-chrome/40"
          />
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-pill bg-[#19394f] px-5 text-sm font-medium text-white transition hover:brightness-[1.06]"
          >
            {copyState === "copied" ? <Check size={15} /> : <Copy size={15} />}
            {copyState === "copied" ? "Copied" : "Copy link"}
          </button>
        </div>
        <p aria-live="polite" className="mt-2 min-h-5 text-[12px] text-silver/70">
          {copyState === "error"
            ? "Copy wasn’t available. Select the link above and copy it manually."
            : copyState === "copied"
              ? "Your link is ready to share."
              : "Your link is unique to your signed-in affiliate account."}
        </p>
      </div>
    </section>
  );
}
