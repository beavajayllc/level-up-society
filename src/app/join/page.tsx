import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { WhopPlanCheckout } from "@/components/WhopPlanCheckout";
import { PUBLIC_SITE_URL, whopCheckoutPlanId } from "@/lib/checkout";
import { getEnv, isLusAuthConfigured } from "@/lib/env";
import {
  getCurrentLusUser,
  getLinkedWhopAccount,
  type LinkedWhopAccount,
  type LusUser,
} from "@/lib/lus-account";
import { checkWhopMembership, type MembershipState } from "@/lib/whop-access";

export const instant = false;

export const metadata: Metadata = {
  title: "Join Level Up Pro — Level Up Society",
  description: "Join Level Up Pro with secure checkout powered by Whop.",
  robots: { index: false, follow: false },
};

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string | string[]; error?: string | string[] }>;
}) {
  const { a, error } = await searchParams;
  const affiliateCode =
    typeof a === "string" && a.trim().length > 0 && a.trim().length <= 255
      ? a.trim()
      : null;
  const joinPath = `/join${affiliateCode ? `?a=${encodeURIComponent(affiliateCode)}` : ""}`;
  const pageError = Array.isArray(error) ? error[0] : error;

  if (!isLusAuthConfigured()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink px-6 py-16 text-silver">
        <section className="max-w-lg rounded-card border border-silver/10 bg-silver/[0.035] p-8 text-center">
          <h1 className="text-2xl font-semibold">Account setup is in progress</h1>
          <p className="mt-3 text-sm leading-relaxed text-silver/55">Create or sign in to your Level Up Society account before checkout. Account sign-in is being connected right now.</p>
          <Link href="/" className="mt-6 inline-flex text-sm text-chrome underline">Back to Level Up Society</Link>
        </section>
      </main>
    );
  }

  let lusUser: LusUser | null;
  try {
    lusUser = await getCurrentLusUser();
  } catch (error) {
    console.error("[join] LUS sign-in state unavailable:", error instanceof Error ? error.message : "unknown error");
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink px-6 py-16 text-silver">
        <section className="max-w-lg rounded-card border border-silver/10 bg-silver/[0.035] p-8 text-center">
          <h1 className="text-2xl font-semibold">We could not verify your account</h1>
          <p className="mt-3 text-sm leading-relaxed text-silver/55">Please sign in again before continuing to checkout.</p>
          <Link href={`/login?next=${encodeURIComponent(joinPath)}`} className="mt-6 inline-flex text-sm text-chrome underline">Sign in to Level Up Society</Link>
        </section>
      </main>
    );
  }

  if (!lusUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink px-6 py-16 text-silver">
        <section className="max-w-xl rounded-card border border-silver/10 bg-silver/[0.035] p-8 text-center sm:p-10">
          <p className="text-[11px] uppercase tracking-[0.2em] text-chrome">Level Up Pro</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">Start with your LUS account.</h1>
          <p className="mt-4 text-sm leading-relaxed text-silver/55">Create your Level Up Society username and password first, then continue to secure Whop checkout. Your LUS password is only for signing in to this website.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={`/signup?next=${encodeURIComponent(joinPath)}`} className="inline-flex h-12 items-center justify-center rounded-pill bg-silver px-6 text-sm font-semibold text-ink transition hover:bg-white">Create account</Link>
            <Link href={`/login?next=${encodeURIComponent(joinPath)}`} className="inline-flex h-12 items-center justify-center rounded-pill border border-silver/20 px-6 text-sm font-medium text-silver transition hover:border-chrome/60 hover:text-chrome">I already have an account</Link>
          </div>
        </section>
      </main>
    );
  }

  let linkedAccount: LinkedWhopAccount | null;
  try {
    linkedAccount = await getLinkedWhopAccount(lusUser.id);
  } catch (error) {
    console.error("[join] Whop account link lookup failed:", error instanceof Error ? error.message : "unknown error");
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink px-6 py-16 text-silver">
        <section className="max-w-lg rounded-card border border-silver/10 bg-silver/[0.035] p-8 text-center">
          <h1 className="text-2xl font-semibold">We could not check your membership link</h1>
          <p className="mt-3 text-sm leading-relaxed text-silver/55">Please try again before continuing to checkout.</p>
        </section>
      </main>
    );
  }

  if (linkedAccount) {
    let membership: MembershipState;
    try {
      membership = await checkWhopMembership(linkedAccount.user.sub);
    } catch (error) {
      console.error("[join] Whop membership check failed:", error instanceof Error ? error.message : "unknown error");
      membership = "unknown";
    }
    if (membership === "active" || membership === "trialing") {
      return redirect("/members");
    }
    if (membership === "unknown") {
      return (
        <main className="flex min-h-screen items-center justify-center bg-ink px-6 py-16 text-silver">
          <section className="max-w-lg rounded-card border border-silver/10 bg-silver/[0.035] p-8 text-center">
            <h1 className="text-2xl font-semibold">We could not verify your Whop membership</h1>
            <p className="mt-3 text-sm leading-relaxed text-silver/55">Your membership connection is saved, but Whop did not answer our check. Please try again before starting another checkout.</p>
            <Link href="/members" className="mt-6 inline-flex text-sm text-chrome underline">Try member access again</Link>
          </section>
        </main>
      );
    }
  }

  const planId = whopCheckoutPlanId();

  if (!planId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink px-6 py-16 text-silver">
        <section className="max-w-lg rounded-card border border-silver/10 bg-silver/[0.035] p-8 text-center">
          <h1 className="text-2xl font-semibold">Checkout is unavailable</h1>
          <p className="mt-3 text-sm leading-relaxed text-silver/55">
            We couldn’t load the Level Up Pro checkout. Please return to the site and try again.
          </p>
          <Link href="/" className="mt-6 inline-flex text-sm text-chrome underline">
            Back to Level Up Society
          </Link>
        </section>
      </main>
    );
  }

  const env = getEnv();
  const returnUrl = new URL("/members", PUBLIC_SITE_URL).toString();

  return (
    <main className="min-h-screen bg-ink px-5 py-10 text-silver sm:px-8 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="text-xs font-medium uppercase tracking-[0.2em] text-silver/45 transition hover:text-chrome"
        >
          Level Up Society
        </Link>
        <div className="mx-auto mt-12 max-w-3xl text-center sm:mt-16">
          <p className="text-[11px] uppercase tracking-[0.2em] text-chrome">
            Level Up Pro
          </p>
          <h1 className="mt-4 text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-tight tracking-[-0.04em]">
            Your next level starts here.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-silver/55 sm:text-base">
            {pageError === "no_membership"
              ? "Your LUS account is ready. Complete the secure Whop checkout below to activate your membership."
              : "Complete your secure membership checkout below."}
          </p>
          {!linkedAccount ? (
            <p className="mx-auto mt-4 max-w-xl text-xs leading-relaxed text-silver/40">
              Already have a Level Up Pro membership on Whop? <Link href={`/connect-whop?next=${encodeURIComponent(joinPath)}`} className="text-chrome underline">Connect that account first</Link> so you don’t purchase twice.
            </p>
          ) : null}
        </div>

        <section
          aria-label="Level Up Pro checkout"
          className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-card-lg border border-silver/10 bg-silver/[0.035] p-2 sm:mt-12 sm:p-4"
        >
          <WhopPlanCheckout
            planId={planId}
            affiliateCode={affiliateCode}
            returnUrl={returnUrl}
            sandbox={env.WHOP_SANDBOX}
          />
        </section>
      </div>
    </main>
  );
}
