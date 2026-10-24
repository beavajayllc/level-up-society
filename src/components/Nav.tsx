import { getCurrentUser } from "@/lib/session";
import { NavClient } from "./NavClient";

export async function Nav() {
  const user = await getCurrentUser();
  return <NavClient isSignedIn={Boolean(user)} />;
}
