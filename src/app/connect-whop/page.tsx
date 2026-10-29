import Link from "next/link";
import { redirect } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { getCurrentLusUser, getLinkedWhopAccount, type LinkedWhopAccount, type LusUser } from "@/lib/lus-account";
import { isAuthConfigured, isLusAuthConfigured } from "@/lib/env";
import { sanitizeNextPath } from "@/lib/whop-oauth";

export const instant = false;

export default async function ConnectWhopPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = sanitizeNextPath(params.next ?? null) ?? "/members";
  if (!isLusAuthConfigured()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink px-6 py-16 text-silver">
        <section className="max-w-lg rounded-card border border-silver/10 bg-silver/[0.035] p-8 text-center">
          <h1 className="text-2xl font-semibold">Account connection is being set up</h1>
          <p className="mt-3 text-sm leading-relaxed text-silver/70">Level Up Society sign-in needs to be connected before you can link your Whop membership.</p>
          <Link href="/" className="mt-6 inline-flex text-sm text-chrome underline">Back to Level Up Society</Link>
        </section>
      </main>
    );
  }

  let lusUser: LusUser | null;
  try {
    lusUser = await getCurrentLusUser();
  } catch (error) {
    console.error("[connect-whop] LUS account check failed:", error instanceof Error ? error.message : "unknown error");
    return (
      <>
        <Nav />
        <main className="flex flex-1 items-center justify-center bg-ink px-6 py-32 text-silver">
          <section className="max-w-lg rounded-card border border-silver/10 bg-silver/[0.035] p-8 text-center">
            <h1 className="text-2xl font-semibold">We could not verify your LUS account</h1>
            <p className="mt-3 text-sm leading-relaxed text-silver/70">Your account is safe. Please try again in a moment.</p>
            <Link href="/login" className="mt-6 inline-flex text-sm text-chrome underline">Sign in again</Link>
          </section>
        </main>
        <Footer />
      </>
    );
  }
  if (!lusUser) redirect(`/login?next=${encodeURIComponent(`/connect-whop?next=${encodeURIComponent(next)}`)}`);

  if (!isAuthConfigured()) {
    return (
      <>
        <Nav />
        <main className="flex flex-1 items-center justify-center bg-ink px-6 py-32 text-silver">
          <section className="max-w-lg rounded-card border border-silver/10 bg-silver/[0.035] p-8 text-center">
            <h1 className="text-2xl font-semibold">Whop connection is unavailable</h1>
            <p className="mt-3 text-sm leading-relaxed text-silver/70">The membership connection is not configured right now. Please try again later.</p>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  let linkedAccount: LinkedWhopAccount | null;
  try {
    linkedAccount = await getLinkedWhopAccount(lusUser.id);
  } catch (error) {
    console.error("[connect-whop] link status lookup failed:", error instanceof Error ? error.message : "unknown error");
    return (
      <>
        <Nav />
        <main className="flex flex-1 items-center justify-center bg-ink px-6 py-32 text-silver">
          <section className="max-w-lg rounded-card border border-silver/10 bg-silver/[0.035] p-8 text-center">
            <h1 className="text-2xl font-semibold">We could not check your Whop connection</h1>
            <p className="mt-3 text-sm leading-relaxed text-silver/70">Your account is safe. Please try again in a moment.</p>
            <Link href={`/connect-whop?next=${encodeURIComponent(next)}`} className="mt-6 inline-flex text-sm text-chrome underline">Try again</Link>
          </section>
        </main>
        <Footer />
      </>
    );
  }
  if (linkedAccount) redirect(next);

  const errorMessage =
    params.error === "oauth_denied"
      ? "The Whop connection was cancelled. You can try again whenever you're ready."
      : params.error === "account_changed"
        ? "Your LUS sign-in changed while connecting Whop. Please sign in again and retry."
        : params.error === "link_conflict"
          ? "That Whop account is already connected to another LUS account."
            : params.error === "already_linked"
              ? "This LUS account already has its one-time Whop connection."
              : params.error === "auth_unavailable"
                ? "We couldn't verify your LUS account or saved Whop connection. Please try again shortly."
                : params.error === "not_configured"
                  ? "The Whop connection is not configured yet. Please try again later."
                  : params.error === "state_mismatch" || params.error === "missing_params"
                    ? "That Whop connection expired. Start the connection again from your LUS account."
          : params.error
            ? "We couldn't connect your Whop account. Please try again."
            : null;

  return (
    <>
      <Nav />
      <main className="flex flex-1 items-center justify-center bg-ink px-6 py-32 text-silver">
        <section className="w-full max-w-xl rounded-card border border-silver/10 bg-silver/[0.035] p-8 sm:p-10">
          <p className="text-[11px] uppercase tracking-[0.2em] text-chrome">One-time connection</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em]">Connect your Whop membership</h1>
          <p className="mt-4 text-sm leading-relaxed text-silver/60">
            Your LUS username and password sign you in here. Whop remains the secure checkout and membership record, so connect the Whop account you used to join Level Up Pro.
          </p>
          <p className="mt-4 text-sm text-silver/70">Signed in to Level Up Society as <span className="text-silver">{lusUser.username}</span></p>
          {errorMessage ? <p role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-300/[0.06] px-4 py-3 text-sm text-red-700">{errorMessage}</p> : null}
          <form method="post" action="/api/auth/connect-whop" className="mt-8">
            <input type="hidden" name="next" value={next} />
            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center rounded-pill bg-silver px-6 text-sm font-semibold text-ink transition hover:bg-silver/85"
            >
              Continue to connect Whop
            </button>
          </form>
          <Link href="/members" className="mt-5 block text-center text-sm text-silver/70 transition hover:text-silver">Back to the members area</Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
