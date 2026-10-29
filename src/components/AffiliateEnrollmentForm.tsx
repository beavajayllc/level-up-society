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
        Activate your Level Up Pro affiliate access
      </h2>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-silver/70">
        Already a Whop affiliate? That’s okay. Activate here to connect your
        account to Level Up Society’s program. Your personal link and referral
        stats will then appear on this page.
      </p>
      <form action={formAction} className="mt-6">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-pill bg-[#89600c] px-6 text-sm font-medium text-white transition hover:brightness-[1.06] disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Activating…" : "Activate my affiliate access"}
          {!pending ? <ArrowRight size={15} /> : null}
        </button>
      </form>
      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`mt-4 text-[13px] ${
            state.status === "error" ? "text-red-700" : "text-silver/70"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </section>
  );
}
