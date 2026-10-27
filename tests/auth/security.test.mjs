import assert from "node:assert/strict";
import test from "node:test";

import { getCanonicalBrowserAuthRedirect, getCanonicalMobileLoginRedirect } from "../../src/lib/auth-origin.ts";
import { emailSchema, isSameOriginRequest, passwordSchema, safeNextPath, usernameSchema } from "../../src/lib/lus-auth-validation.ts";
import { openPkceState, sealPkceState } from "../../src/lib/pkce-state.ts";
import { withSaveHandler } from "../../src/lib/session-state.ts";

test("return paths accept only normalized same-site relative URLs", () => {
  assert.equal(safeNextPath("/members/live-calls?tab=upcoming"), "/members/live-calls?tab=upcoming");
  assert.equal(safeNextPath("//attacker.example/path"), "/members");
  assert.equal(safeNextPath("/\\attacker.example/path"), "/members");
  assert.equal(safeNextPath("https://attacker.example/path"), "/members");
  assert.equal(safeNextPath("/members%0d%0aLocation:evil"), "/members%0d%0aLocation:evil");
});

test("usernames are normalized and constrained before database access", () => {
  assert.equal(usernameSchema.parse("  Jay_Mora7  "), "jay_mora7");
  assert.equal(usernameSchema.safeParse("ab").success, false);
  assert.equal(usernameSchema.safeParse("has space").success, false);
});

test("account email and password inputs are validated consistently", () => {
  assert.equal(emailSchema.parse("  MEMBER@EXAMPLE.COM "), "member@example.com");
  assert.equal(emailSchema.safeParse("not-an-email").success, false);
  assert.equal(passwordSchema.safeParse("short").success, false);
  assert.equal(passwordSchema.safeParse("this-password-is-long-enough").success, true);
});

test("browser mutations require the configured origin or the current same origin", () => {
  const appUrl = "https://level-up-society.com";
  assert.equal(
    isSameOriginRequest(new Request("https://level-up-society.com/api", { headers: { Origin: appUrl } }), appUrl),
    true,
  );
  assert.equal(
    isSameOriginRequest(new Request("https://preview.example/api", { headers: { Origin: "https://preview.example" } }), appUrl),
    true,
  );
  assert.equal(
    isSameOriginRequest(new Request("https://level-up-society.com/api", { headers: { Origin: "https://attacker.example" } }), appUrl),
    false,
  );
  assert.equal(isSameOriginRequest(new Request("https://level-up-society.com/api"), appUrl), false);
});

test("browser auth routes canonicalize only known deployment origins and preserve path/query", () => {
  const environment = {
    NEXT_PUBLIC_APP_URL: "https://www.level-up-society.com",
    VERCEL_PROJECT_PRODUCTION_URL: "level-up-society-nu.vercel.app",
    VERCEL_URL: "lus-git-preview-abc.vercel.app",
  };

  assert.equal(
    getCanonicalBrowserAuthRedirect(
      "https://level-up-society-nu.vercel.app/join?a=friend&next=%2Fmembers%2Flive-calls",
      environment,
    )?.toString(),
    "https://www.level-up-society.com/join?a=friend&next=%2Fmembers%2Flive-calls",
  );
  assert.equal(
    getCanonicalBrowserAuthRedirect(
      "https://lus-git-preview-abc.vercel.app/members/live-calls?tab=upcoming",
      environment,
    )?.toString(),
    "https://www.level-up-society.com/members/live-calls?tab=upcoming",
  );
  assert.equal(
    getCanonicalBrowserAuthRedirect(
      "https://level-up-society-nu.vercel.app/login?next=https%3A%2F%2Fevil.example",
      environment,
    )?.origin,
    "https://www.level-up-society.com",
  );
});

test("preview auth canonicalizes random deployment URLs to the configured stable alias", () => {
  const environment = {
    NEXT_PUBLIC_APP_URL: "https://level-up-society-auth-preview.vercel.app",
    VERCEL_URL: "lus-git-feature-xyz.vercel.app",
    VERCEL_PROJECT_PRODUCTION_URL: "level-up-society-nu.vercel.app",
  };

  assert.equal(
    getCanonicalBrowserAuthRedirect(
      "https://lus-git-feature-xyz.vercel.app/signup?next=%2Fjoin%3Fa%3Dfriend",
      environment,
    )?.toString(),
    "https://level-up-society-auth-preview.vercel.app/signup?next=%2Fjoin%3Fa%3Dfriend",
  );
  assert.equal(
    getCanonicalBrowserAuthRedirect(
      "https://level-up-society-auth-preview.vercel.app/signup",
      environment,
    ),
    null,
  );
  assert.equal(
    getCanonicalBrowserAuthRedirect(
      "https://level-up-society-nu.vercel.app/signup",
      environment,
    ),
    null,
  );
});

test("canonical auth redirects skip public, native API, webhook, and unrecognized hosts", () => {
  const environment = {
    NEXT_PUBLIC_APP_URL: "https://www.level-up-society.com",
    VERCEL_PROJECT_PRODUCTION_URL: "level-up-society-nu.vercel.app",
  };

  for (const path of [
    "/",
    "/api/auth/mobile/login",
    "/api/auth/mobile/session/refresh",
    "/api/webhooks/whop",
    "/api/auth/callback",
    "/memberships",
  ]) {
    assert.equal(
      getCanonicalBrowserAuthRedirect(`https://level-up-society-nu.vercel.app${path}`, environment),
      null,
      `${path} should not be redirected`,
    );
  }

  assert.equal(
    getCanonicalBrowserAuthRedirect("https://attacker.example/login", environment),
    null,
  );
});

test("mobile OAuth login redirects to the configured callback origin before PKCE starts", () => {
  assert.equal(
    getCanonicalMobileLoginRedirect(
      "https://level-up-society-nu.vercel.app/api/auth/mobile/login?next=%2Fmembers",
      "https://www.level-up-society.com",
    )?.toString(),
    "https://www.level-up-society.com/api/auth/mobile/login?next=%2Fmembers",
  );
  assert.equal(
    getCanonicalMobileLoginRedirect(
      "https://untrusted.example/api/auth/mobile/login",
      "https://www.level-up-society.com",
    )?.origin,
    "https://www.level-up-society.com",
  );
  assert.equal(
    getCanonicalMobileLoginRedirect(
      "https://www.level-up-society.com/api/auth/mobile/login",
      "https://www.level-up-society.com",
    ),
    null,
  );
  assert.equal(
    getCanonicalMobileLoginRedirect(
      "https://level-up-society-nu.vercel.app/api/auth/mobile/session",
      "https://www.level-up-society.com",
    ),
    null,
  );
  assert.equal(
    getCanonicalMobileLoginRedirect(
      "https://level-up-society-nu.vercel.app/api/auth/mobile/login",
      "https://www.level-up-society.com",
      "POST",
    ),
    null,
  );
  assert.throws(
    () => getCanonicalMobileLoginRedirect("https://attacker.example/api/auth/mobile/login", "javascript:alert(1)"),
    TypeError,
  );
});

test("Whop OAuth correlation cookies are integrity-protected and expire", () => {
  const secret = "a-test-session-secret-that-is-long-enough";
  const now = 1_900_000_000_000;
  const state = {
    codeVerifier: "v".repeat(43),
    state: "s".repeat(22),
    nonce: "n".repeat(22),
    next: "/members",
    link: true,
    lusUserId: "5e3d1e6b-07bc-43ee-b87b-462775765d06",
  };
  const sealed = sealPkceState(state, secret, now);

  assert.deepEqual(openPkceState(sealed, secret, now), { ...state, issuedAt: now });
  assert.equal(openPkceState(sealed, "a-different-session-secret", now), null);
  assert.equal(openPkceState(`${sealed}x`, secret, now), null);
  assert.equal(openPkceState(sealed, secret, now + 10 * 60 * 1000 + 1), null);
  assert.equal(openPkceState(sealed, secret, now - 60_001), null);
});

test("session persistence saves token rotations made by the route", async () => {
  let persisted;
  const session = withSaveHandler(
    { tokens: { refresh_token: "old-refresh" }, obtainedAt: 100 },
    async (current) => {
      persisted = {
        tokens: structuredClone(current.tokens),
        obtainedAt: current.obtainedAt,
      };
    },
  );

  session.tokens = { refresh_token: "rotated-refresh" };
  session.obtainedAt = 200;
  await session.save();

  assert.deepEqual(persisted, {
    tokens: { refresh_token: "rotated-refresh" },
    obtainedAt: 200,
  });
});
