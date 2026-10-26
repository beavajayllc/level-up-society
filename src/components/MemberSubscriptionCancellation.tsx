"use client";

import { useActionState, useState } from "react";
import {
  cancelMyLevelUpProSubscription,
  type SubscriptionCancellationState,
} from "@/app/members/actions";
import type { SubscriptionCancellationOption } from "@/lib/subscription-cancellation";

const initialState: SubscriptionCancellationState = {
  status: "idle",
  message: "",
  membershipId: null,
  renewalPeriodEnd: null,
};

function formatDate(value: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function SubscriptionCancellationForm({
  subscription,
}: {
  subscription: SubscriptionCancellationOption;
}) {
  const [state, formAction, pending] = useActionState(
    cancelMyLevelUpProSubscription,
    initialState,
  );
  const isCanceled =
    state.status === "success" && state.membershipId === subscription.membershipId;
  const isScheduled = subscription.cancelAtPeriodEnd || isCanceled;
  const endsAt = formatDate(
    isCanceled ? state.renewalPeriodEnd : subscription.renewalPeriodEnd,
  );

  if (isScheduled) {
    return (
      <div className="rounded-tile border border-silver/10 bg-ink/60 p-5">
        <p className="text-sm font-medium text-silver/75">
          Your Level Up Pro subscription is set to end
          {endsAt ? ` on ${endsAt}` : " at the end of this billing period"}.
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-silver/45">
          You’ll keep access until then, and it won’t renew again.
        </p>
      </div>
    );
  }

  const actionError =
    state.status === "error" && state.membershipId === subscription.membershipId
      ? state.message
      : null;

  return (
    <div className="rounded-tile border border-silver/10 bg-ink/60 p-5">
      <p className="text-sm font-medium text-silver/75">
        {subscription.isTrialing
          ? "Cancel your Level Up Pro free trial?"
          : `Cancel your Level Up Pro subscription${subscription.price ? ` (${subscription.price})` : ""}?`}
      </p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-silver/45">
        {subscription.isTrialing
          ? endsAt
            ? `Your access will continue through ${endsAt}. Canceling now prevents your trial from converting to a paid membership.`
            : "Canceling now prevents your trial from converting to a paid membership."
          : endsAt
          ? `Your access will continue through ${endsAt}. We won’t charge you for another billing period.`
          : "Your access will continue through the current billing period. We won’t charge you for another billing period."}
      </p>
      <form action={formAction} className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="hidden"
          name="membershipId"
          value={subscription.membershipId}
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-10 items-center justify-center rounded-pill border border-silver/20 px-4 text-[13px] font-medium text-silver/75 transition hover:border-silver/45 hover:text-silver disabled:cursor-wait disabled:opacity-50"
        >
          {pending ? "Scheduling cancellation…" : "Confirm cancellation"}
        </button>
        {actionError ? (
          <span role="alert" className="text-[13px] text-red-300">
            {actionError}
          </span>
        ) : null}
      </form>
    </div>
  );
}

export function MemberSubscriptionCancellation({
  subscriptions,
}: {
  subscriptions: SubscriptionCancellationOption[] | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="mt-10 border-t border-silver/8 pt-6">
      <p className="text-[13px] text-silver/40">
        To cancel your subscription,{" "}
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="underline decoration-silver/25 underline-offset-4 transition hover:text-silver/75 hover:decoration-silver/60"
        >
          click here
        </button>
        .
      </p>
      {open ? (
        <div
          role="region"
          aria-label="Subscription cancellation"
          className="mt-5 grid gap-3"
        >
          {subscriptions === null ? (
            <p className="rounded-tile border border-silver/10 bg-ink/60 p-5 text-[13px] leading-relaxed text-silver/55">
              Whop cancellation details are temporarily unavailable. Please
              refresh or contact support for help.
            </p>
          ) : subscriptions.length === 0 ? (
            <p className="rounded-tile border border-silver/10 bg-ink/60 p-5 text-[13px] leading-relaxed text-silver/55">
              We couldn’t find a recurring Level Up Pro subscription on this
              Whop account. If you’re currently being billed, contact support
              and we’ll help check it.
            </p>
          ) : (
            subscriptions.map((subscription) => (
              <SubscriptionCancellationForm
                key={subscription.membershipId}
                subscription={subscription}
              />
            ))
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="justify-self-start px-1 py-1 text-[12px] text-silver/35 transition hover:text-silver/65"
          >
            Keep my membership
          </button>
        </div>
      ) : null}
    </section>
  );
}
