import { Suspense } from "react";
import { Nav } from "./Nav";
import { NavClient } from "./NavClient";

export function PublicPageNav() {
  return (
    <Suspense fallback={<NavClient isSignedIn={false} />}>
      <Nav />
    </Suspense>
  );
}
