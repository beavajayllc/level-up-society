const CANONICAL_BROWSER_AUTH_PATHS = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/connect-whop",
  "/join",
  "/auth/callback",
]);

export interface AuthOriginEnvironment {
  NEXT_PUBLIC_APP_URL?: string;
  VERCEL_URL?: string;
  VERCEL_BRANCH_URL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
}

/**
 * Mobile OAuth login must write its PKCE cookie on the same origin Whop calls
 * back to. The destination always comes from the configured app URL.
 */
export function getCanonicalMobileLoginRedirect(
  requestUrl: string,
  appUrl: string | undefined,
  method = "GET",
): URL | null {
  let request: URL;
  try {
    request = new URL(requestUrl);
  } catch {
    return null;
  }

  if (method !== "GET" || request.pathname !== "/api/auth/mobile/login" || !appUrl) {
    return null;
  }

  let canonical: URL;
  try {
    canonical = new URL(appUrl);
  } catch {
    throw new TypeError("The mobile OAuth origin is not a valid URL.");
  }
  if (!isHttpUrl(request) || !isHttpUrl(canonical) || canonical.username || canonical.password) {
    throw new TypeError("The mobile OAuth origin must be an HTTP(S) URL.");
  }
  if (request.origin === canonical.origin) return null;

  const target = new URL("/api/auth/mobile/login", canonical.origin);
  target.search = request.search;
  return target;
}

/** Return a canonical auth URL only for known deployment hosts and auth pages. */
export function getCanonicalBrowserAuthRedirect(
  requestUrl: string,
  environment: AuthOriginEnvironment,
): URL | null {
  const canonicalValue = environment.NEXT_PUBLIC_APP_URL;
  if (!canonicalValue) return null;

  let request: URL;
  let canonical: URL;
  try {
    request = new URL(requestUrl);
    canonical = new URL(canonicalValue);
  } catch {
    return null;
  }

  if (
    !isHttpUrl(request) ||
    !isHttpUrl(canonical) ||
    canonical.username ||
    canonical.password ||
    request.origin === canonical.origin ||
    !isCanonicalBrowserAuthPath(request.pathname)
  ) {
    return null;
  }

  const deployedHosts = getKnownDeploymentHosts(canonical, environment);
  if (!deployedHosts.has(request.host.toLowerCase())) return null;

  const target = new URL(canonical.origin);
  target.pathname = request.pathname;
  target.search = request.search;
  target.hash = request.hash;
  return target;
}

function isHttpUrl(url: URL): boolean {
  return url.protocol === "https:" || url.protocol === "http:";
}

function isCanonicalBrowserAuthPath(pathname: string): boolean {
  const normalized = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  return (
    CANONICAL_BROWSER_AUTH_PATHS.has(normalized) ||
    normalized === "/members" ||
    normalized.startsWith("/members/")
  );
}

function getKnownDeploymentHosts(
  canonical: URL,
  environment: AuthOriginEnvironment,
): Set<string> {
  const hosts = new Set([canonical.host.toLowerCase()]);

  for (const value of [
    environment.VERCEL_URL,
    environment.VERCEL_BRANCH_URL,
  ]) {
    const host = configuredHost(value);
    if (host) hosts.add(host);
  }

  // These are the deployed production aliases; do not treat them as Preview hosts.
  if (canonical.hostname === "www.level-up-society.com") {
    hosts.add("level-up-society.com");
    hosts.add("level-up-society-nu.vercel.app");
    const productionHost = configuredHost(environment.VERCEL_PROJECT_PRODUCTION_URL);
    if (productionHost) hosts.add(productionHost);
  }

  return hosts;
}

function configuredHost(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    if (!isHttpUrl(url) || url.username || url.password) return null;
    return url.host.toLowerCase();
  } catch {
    return null;
  }
}
