import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { getEnv } from "@/lib/env";
import { whopCheckoutPlanId } from "@/lib/checkout";

export const instant = false;

export const metadata: Metadata = {
  title: "Join Level Up Pro — Level Up Society",
  description: "Join Level Up Pro with secure checkout powered by Whop.",
  robots: { index: false, follow: false },
};

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string | string[] }>;
}) {
  const { a } = await searchParams;
  const affiliateCode =
    typeof a === "string" && a.trim().length > 0 && a.trim().length <= 255
      ? a.trim()
      : null;
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

  const returnUrl = new URL("/members", getEnv().NEXT_PUBLIC_APP_URL).toString();

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
            Complete your secure membership checkout below.
          </p>
        </div>

        <section
          aria-label="Level Up Pro checkout"
          className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-card-lg border border-silver/10 bg-silver/[0.035] p-2 sm:mt-12 sm:p-4"
        >
          <div
            className="whop-checkout-embed min-h-[38rem] w-full"
            data-whop-checkout-plan-id={planId}
            data-whop-checkout-return-url={returnUrl}
            data-whop-color-scheme="dark"
            data-whop-affiliate={affiliateCode ?? undefined}
          />
        </section>
      </div>
      <Script
        src="https://js.whop.com/static/checkout/loader.js"
        strategy="afterInteractive"
      />
    </main>
  );
}
