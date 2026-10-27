import { Suspense } from "react";
import { getCurrentLusUser } from "@/lib/lus-account";
import { NavClient } from "./NavClient";

export function Nav() {
  return (
    <Suspense fallback={<NavClient isSignedIn={false} />}>
      <AuthAwareNav />
    </Suspense>
  );
}

async function AuthAwareNav() {
  let user = null;
  try {
    user = await getCurrentLusUser();
  } catch (error) {
    console.error("[nav] LUS sign-in state is unavailable:", error instanceof Error ? error.message : "unknown error");
  }
  return <NavClient isSignedIn={Boolean(user)} />;
}
