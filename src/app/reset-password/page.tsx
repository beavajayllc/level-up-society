import Link from "next/link";
import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { LusAuthPage } from "@/components/LusAuthPage";
import { isLusAuthConfigured } from "@/lib/env";
import { getCurrentLusUser } from "@/lib/lus-account";

export const instant = false;

export const metadata: Metadata = {
  title: "Choose a new password — Level Up Society",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const authAvailable = isLusAuthConfigured();

  if (!authAvailable) {
    return <LusAuthPage mode="new-password" nextPath="/members" authAvailable={false} />;
  }

  let user: Awaited<ReturnType<typeof getCurrentLusUser>> = null;
  let authCheckFailed = false;
  try {
    user = await getCurrentLusUser();
  } catch (caught) {
    console.error("[lus-auth] password reset page could not verify session:", caught instanceof Error ? caught.message : "unknown error");
    authCheckFailed = true;
  }

  if (authCheckFailed) {
    return <LusAuthPage mode="new-password" nextPath="/members" error="auth_unavailable" />;
  }
  if (user) {
    return <LusAuthPage mode="new-password" nextPath="/members" error={error} />;
  }

  return (
    <>
      <Nav />
      <main className="flex flex-1 items-center justify-center bg-ink px-6 py-24 text-silver">
        <section className="max-w-lg rounded-card border border-silver/10 bg-silver/[0.035] p-8 text-center sm:p-10">
          <p className="text-[11px] uppercase tracking-[0.2em] text-chrome">Account recovery</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">That reset link has expired.</h1>
          <p className="mt-4 text-sm leading-relaxed text-silver/70">Request a new password reset link and open it in the same browser where you want to finish the reset.</p>
          <Link href="/forgot-password" className="mt-7 inline-flex h-11 items-center justify-center rounded-pill bg-silver px-6 text-sm font-semibold text-ink transition hover:bg-silver/85">Request a new link</Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
