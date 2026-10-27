import type { Metadata } from "next";
import { LusAuthPage } from "@/components/LusAuthPage";
import { isLusAuthConfigured } from "@/lib/env";
import { safeNextPath } from "@/lib/lus-auth-validation";

export const instant = false;

export const metadata: Metadata = {
  title: "Create your account — Level Up Society",
  robots: { index: false, follow: false },
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; error?: string | string[] }>;
}) {
  const params = await searchParams;
  const next = Array.isArray(params.next) ? params.next[0] : params.next;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <LusAuthPage
      mode="signup"
      nextPath={safeNextPath(next, "/join")}
      error={error}
      authAvailable={isLusAuthConfigured()}
    />
  );
}
