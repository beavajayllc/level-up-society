import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PillButton } from "@/components/ui";
import { checkoutHref } from "@/lib/checkout";
import { Glow } from "./ui";

const copy: Record<string, { title: string; body: string }> = {
  no_membership: {
    title: "Your membership isn't active",
    body: "This account is signed in to WHOP, but there isn't an active Level Up Society membership on it. If you just subscribed, give it a minute and try again — otherwise reactivate from the checkout link.",
  },
  not_configured: {
    title: "Member sign-in is still being set up",
    body: "The WHOP connection for this site hasn't been switched on yet. It will be live shortly — check back soon.",
  },
  oauth_denied: {
    title: "Sign-in was cancelled",
    body: "You backed out of the WHOP sign-in, so nothing was changed. Ready when you are.",
  },
  oauth_failed: {
    title: "We couldn't complete the sign-in",
    body: "Something went wrong talking to WHOP. Try again, and if it keeps happening we'll take a closer look.",
  },
  check_failed: {
    title: "We couldn't verify your membership",
    body: "WHOP didn't answer our access check in time. Give it another try in a moment.",
  },
  state_mismatch: {
    title: "That sign-in link expired",
    body: "Sign-in links are short-lived for security. Start again and you'll be in shortly.",
  },
  missing_params: {
    title: "That sign-in link didn't work",
    body: "Start again and you'll be in shortly.",
  },
};

export function AccessNotice({ reason }: { reason: string }) {
  const content =
    copy[reason] ??
    copy.oauth_failed ?? {
      title: "Something went wrong",
      body: "Try again in a moment.",
    };

  return (
    <>
      <Nav />
      <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-ink px-6 py-32">
        <Glow className="left-1/2 top-1/3 h-[520px] w-[520px] -translate-x-1/2" opacity={0.08} />
        <div className="relative w-full max-w-lg rounded-card border border-silver/10 bg-silver/[0.04] p-9 text-center sm:p-12">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-tile border border-chrome/25 bg-chrome/10 font-mono text-[15px] text-chrome">
            LS
          </span>
          <h1 className="mt-7 text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-silver">
            {content.title}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-silver/55">
            {content.body}
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <PillButton href="/api/auth/login" variant="chrome">
              Sign in with WHOP
            </PillButton>
            <Link
              href={checkoutHref("/#memberships")}
              className="inline-flex h-11 items-center justify-center rounded-pill border border-silver/18 px-6 text-sm font-medium text-silver transition-colors duration-300 hover:border-chrome/60 hover:text-chrome"
            >
              {reason === "no_membership"
                ? "Reactivate membership"
                : "View membership"}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
