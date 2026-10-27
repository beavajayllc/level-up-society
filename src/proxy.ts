import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getCanonicalBrowserAuthRedirect,
  getCanonicalMobileLoginRedirect,
} from "@/lib/auth-origin";

export async function proxy(request: NextRequest) {
  if (
    request.method === "GET" &&
    request.nextUrl.pathname === "/api/auth/mobile/login"
  ) {
    let mobileLoginRedirect: URL | null = null;
    try {
      mobileLoginRedirect = getCanonicalMobileLoginRedirect(
        request.url,
        process.env.NEXT_PUBLIC_APP_URL,
      );
    } catch {
      // The route reports invalid app-origin configuration without setting PKCE.
    }
    if (mobileLoginRedirect) {
      return NextResponse.redirect(mobileLoginRedirect, {
        status: 307,
        headers: { "Cache-Control": "private, no-store" },
      });
    }

    // This OAuth kickoff does not need a Supabase session refresh. In particular,
    // let the route report missing configuration without reading auth cookies.
    return NextResponse.next({ request });
  }

  const canonicalRedirect = getCanonicalBrowserAuthRedirect(request.url, {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_BRANCH_URL: process.env.VERCEL_BRANCH_URL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  });
  if (canonicalRedirect) {
    return NextResponse.redirect(canonicalRedirect, 307);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, publishableKey, {
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        for (const { name, value } of values) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of values) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  try {
    await supabase.auth.getClaims();
  } catch (error) {
    // Let the route's server-side auth check report an unavailable provider;
    // Proxy refresh is an optimization and must not turn every page into 500.
    console.error(
      "[lus-auth] session refresh failed:",
      error instanceof Error ? error.name : "unknown error",
    );
  }

  if (request.cookies.getAll().some(({ name }) => name.startsWith("sb-"))) {
    response.headers.set("Cache-Control", "private, no-store");
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
