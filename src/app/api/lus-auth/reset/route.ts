import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppUrl, isLusAuthConfigured } from "@/lib/env";
import { authJson } from "@/lib/lus-auth-http";
import { emailSchema, isSameOriginRequest } from "@/lib/lus-auth-validation";
import { createSupabaseAuthClient } from "@/lib/supabase/server";

const resetSchema = z.object({ email: emailSchema });

export async function POST(request: Request): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) {
    return authJson({ error: "Request origin was not accepted." }, { status: 403 });
  }
  if (!isLusAuthConfigured()) {
    return authJson({ error: "LUS account recovery is not connected yet." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return authJson({ error: "Please enter a valid email." }, { status: 400 });
  }
  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) {
    return authJson({ error: "Please enter a valid email." }, { status: 400 });
  }

  try {
    const redirectTo = new URL("/auth/callback?next=%2Freset-password", getAppUrl()).toString();
    const auth = await createSupabaseAuthClient();
    const { error } = await auth.auth.resetPasswordForEmail(parsed.data.email, { redirectTo });
    if (error) {
      console.error(`[lus-auth] password reset request failed (${error.code ?? "unknown"})`);
      if (error.status === 429) {
        return authJson({ error: "Please wait before requesting another reset link." }, { status: 429 });
      }
      if (error.code !== "user_not_found") {
        return authJson({ error: "We couldn't send a reset link right now. Please try again." }, { status: 503 });
      }
    }
    // Keep the response the same for known and unknown email addresses.
    return authJson({ ok: true });
  } catch (error) {
    console.error("[lus-auth] password reset service unavailable:", error instanceof Error ? error.message : "unknown error");
    return authJson({ error: "We couldn't send a reset link right now. Please try again." }, { status: 503 });
  }
}
