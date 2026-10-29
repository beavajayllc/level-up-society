import Link from "next/link";
import type { LusAuthFormMode } from "@/components/LusAuthForm";
import { LusAuthForm } from "@/components/LusAuthForm";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";

const pageContent: Record<LusAuthFormMode, { eyebrow: string; title: string; body: string }> = {
  login: {
    eyebrow: "Member sign in",
    title: "Welcome back.",
    body: "Sign in with your Level Up Society username or email and password.",
  },
  signup: {
    eyebrow: "Create your account",
    title: "Your next level starts here.",
    body: "Create your Level Up Society account before continuing to secure Whop checkout.",
  },
  "forgot-password": {
    eyebrow: "Account recovery",
    title: "Let’s get you back in.",
    body: "Enter the email on your Level Up Society account and we’ll send a secure reset link if it can be recovered.",
  },
  "new-password": {
    eyebrow: "Account recovery",
    title: "Choose a new password.",
    body: "Set a new password for signing in to Level Up Society.",
  },
};

export function LusAuthPage({
  mode,
  nextPath,
  error,
  authAvailable = true,
}: {
  mode: LusAuthFormMode;
  nextPath: string;
  error?: string;
  authAvailable?: boolean;
}) {
  const content = pageContent[mode];

  return (
    <>
      <Nav />
      <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-ink px-5 pb-20 pt-32 text-silver sm:px-8 sm:pt-36">
        <div className="pointer-events-none absolute left-1/2 top-1/4 h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-chrome/[0.045] blur-[100px]" />
        <section className="relative w-full max-w-xl rounded-card-lg border border-silver/10 bg-silver/[0.035] p-6 shadow-[0_24px_100px_rgba(0,0,0,0.28)] sm:p-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-chrome">
            {content.eyebrow}
          </p>
          <h1 className="mt-4 text-[clamp(2rem,5vw,3rem)] font-semibold leading-[1.04] tracking-[-0.045em]">
            {content.title}
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-silver/70 sm:text-base">
            {content.body}
          </p>

          {mode === "signup" ? (
            <div className="mt-5 rounded-xl border border-silver/10 bg-ink/45 px-4 py-3 text-sm leading-relaxed text-silver/70">
              Your username and password are for this website. Whop handles checkout and keeps your membership record. After checkout, connect the Whop account you used to join.
            </div>
          ) : null}

          {!authAvailable ? (
            <p role="status" className="mt-6 rounded-xl border border-chrome/20 bg-chrome/[0.06] px-4 py-3 text-sm leading-relaxed text-silver/70">
              Secure account sign-in is still being connected. Please try again later.
            </p>
          ) : null}

          <div className="mt-7">
            <LusAuthForm
              mode={mode}
              nextPath={nextPath}
              initialError={error}
              authAvailable={authAvailable}
            />
          </div>

          {mode !== "login" ? (
            <Link href="/" className="mt-7 block text-center text-sm text-silver/70 transition hover:text-silver/75">
              Back to Level Up Society
            </Link>
          ) : null}
        </section>
      </main>
      <Footer />
    </>
  );
}
