"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import {
  activateAffiliate,
  type AffiliateEnrollmentState,
} from "@/app/members/affiliate/actions";

const initialState: AffiliateEnrollmentState = {
  status: "idle",
  message: "",
};

export function AffiliateEnrollmentForm() {
  const [state, formAction, pending] = useActionState(
    activateAffiliate,
    initialState,
  );

  return (
    <section className="mt-10 rounded-card border border-silver/10 bg-silver/[0.035] p-7 sm:p-9">
      <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-silver">
        Choose your affiliate username
      </h2>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-silver/70">
        Pick the name you want to share. Your personal link will use it, while
        Whop continues to track referrals and commissions behind the scenes.
      </p>
      <form action={formAction} className="mt-6 max-w-xl">
        <label
          htmlFor="affiliateUsername"
          className="mb-2 block text-[13px] text-silver/75"
        >
          Affiliate username
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex min-w-0 flex-1 items-center rounded-pill border border-silver/15 bg-ink px-4 focus-within:border-chrome/60">
            <span className="shrink-0 text-[13px] text-silver/45">/r/</span>
            <input
              id="affiliateUsername"
              name="affiliateUsername"
              type="text"
              minLength={3}
              maxLength={24}
              pattern="[A-Za-z0-9_]{3,24}"
              autoCapitalize="none"
              autoComplete="off"
              required
              aria-describedby="affiliateUsernameHint"
              className="h-12 min-w-0 flex-1 bg-transparent px-2 text-sm text-silver outline-none placeholder:text-silver/35"
              placeholder="yourname"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-pill bg-[#4c2f6f] px-6 text-sm font-medium text-white transition hover:brightness-[1.06] disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? "Setting up…" : "Join & create my link"}
            {!pending ? <ArrowRight size={15} /> : null}
          </button>
        </div>
        <p id="affiliateUsernameHint" className="mt-2 text-[12px] text-silver/50">
          3–24 characters: letters, numbers, and underscores. Your link will look like
          {" "}<span className="text-silver/70">www.level-up-society.com/r/yourname</span>.
          Choose carefully; changing it later can break links you have already shared.
        </p>
      </form>
      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`mt-4 text-[13px] ${
            state.status === "error" ? "text-red-300" : "text-silver/70"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </section>
  );
}
