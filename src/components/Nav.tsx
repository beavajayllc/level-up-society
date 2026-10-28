import { Suspense } from "react";
import { unstable_rethrow } from "next/navigation";
import { getCurrentLusUser } from "@/lib/lus-account";
import { NavClient } from "./NavClient";

export function Nav({ memberArea = false }: { memberArea?: boolean }) {
  return (
    <Suspense fallback={<NavClient isSignedIn={false} memberArea={memberArea} />}>
      <AuthAwareNav memberArea={memberArea} />
    </Suspense>
  );
}

async function AuthAwareNav({ memberArea }: { memberArea: boolean }) {
  let user = null;
  try {
    user = await getCurrentLusUser();
  } catch (error) {
    unstable_rethrow(error);
    console.error("[nav] LUS sign-in state is unavailable:", error instanceof Error ? error.message : "unknown error");
  }
  return <NavClient isSignedIn={Boolean(user)} memberArea={memberArea} />;
}
