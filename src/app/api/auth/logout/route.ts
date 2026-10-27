import { NextResponse, type NextRequest } from "next/server";
import { isSameOriginRequest } from "@/lib/lus-auth-validation";
import { createSupabaseAuthClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "Request origin was not accepted." },
      { status: 403, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    const auth = await createSupabaseAuthClient();
    const { error } = await auth.auth.signOut({ scope: "local" });
    if (error) {
      console.error(`[lus-auth] local sign-out failed (${error.code ?? "unknown"})`);
    }
  } catch (error) {
    console.error("[lus-auth] local sign-out unavailable:", error instanceof Error ? error.message : "unknown error");
  }

  // Remove any legacy Whop-only browser session too. The linked OAuth tokens
  // remain server-side so this LUS account can use Whop-backed member tools.
  const response = NextResponse.redirect(new URL("/", request.url), {
    status: 303,
    headers: { "Cache-Control": "private, no-store" },
  });
  response.cookies.set("whop_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  for (const { name } of request.cookies.getAll()) {
    if (name.startsWith("sb-")) {
      response.cookies.set(name, "", {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
    }
  }
  return response;
}
