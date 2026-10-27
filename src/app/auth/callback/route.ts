import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAuthClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/lus-auth-validation";

function redirectTo(request: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, request.url), {
    status: 303,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"), "/members");

  if (!code || url.searchParams.has("error")) {
    return redirectTo(request, "/login?error=auth_callback_failed");
  }

  try {
    const auth = await createSupabaseAuthClient();
    const { error } = await auth.auth.exchangeCodeForSession(code);
    if (error) {
      console.error(`[lus-auth] email callback failed (${error.code ?? "unknown"})`);
      return redirectTo(request, "/login?error=auth_callback_failed");
    }

    const { data: userResult, error: userError } = await auth.auth.getUser();
    if (userError || !userResult.user?.email_confirmed_at) {
      await auth.auth.signOut({ scope: "local" });
      return redirectTo(request, "/login?error=email_not_confirmed");
    }

    return redirectTo(request, next);
  } catch (error) {
    console.error("[lus-auth] email callback service unavailable:", error instanceof Error ? error.message : "unknown error");
    return redirectTo(request, "/login?error=auth_callback_failed");
  }
}
