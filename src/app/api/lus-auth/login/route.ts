import { NextResponse } from "next/server";
import { z } from "zod";
import { isLusAuthConfigured } from "@/lib/env";
import { authJson } from "@/lib/lus-auth-http";
import {
  isSameOriginRequest,
  passwordSchema,
  safeNextPath,
} from "@/lib/lus-auth-validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseAuthClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  identifier: z.string().trim().min(1).max(254),
  password: passwordSchema,
  next: z.unknown().optional(),
});

const INVALID_CREDENTIALS = "That username, email, or password doesn't match.";

export async function POST(request: Request): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) {
    return authJson({ error: "Request origin was not accepted." }, { status: 403 });
  }
  if (!isLusAuthConfigured()) {
    return authJson({ error: "LUS account sign-in is not connected yet." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return authJson({ error: "Please check the form and try again." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return authJson({ error: "Enter your username or email and password." }, { status: 400 });
  }

  try {
    const identifier = parsed.data.identifier.trim();
    let email = identifier.toLowerCase();
    if (!email.includes("@")) {
      const admin = createSupabaseAdminClient();
      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select("id")
        .eq("username", identifier.toLowerCase())
        .maybeSingle();
      if (profileError) {
        throw new Error("Username lookup failed.");
      }
      if (!profile) {
        return authJson({ error: INVALID_CREDENTIALS }, { status: 401 });
      }

      const { data: userResult, error: userError } =
        await admin.auth.admin.getUserById(profile.id);
      if (userError) {
        throw new Error("Account lookup failed.");
      }
      if (!userResult.user.email) {
        return authJson({ error: INVALID_CREDENTIALS }, { status: 401 });
      }
      email = userResult.user.email;
    }

    const auth = await createSupabaseAuthClient();
    const { data, error } = await auth.auth.signInWithPassword({
      email,
      password: parsed.data.password,
    });
    if (error) {
      if (error.code === "email_not_confirmed") {
        return authJson(
          { error: "Confirm your email before signing in. Check your inbox for the verification link." },
          { status: 403 },
        );
      }
      if ((error.status ?? 400) >= 500) {
        throw new Error(`Sign-in provider returned ${error.status}.`);
      }
      return authJson({ error: INVALID_CREDENTIALS }, { status: 401 });
    }

    if (!data.user.email_confirmed_at) {
      await auth.auth.signOut({ scope: "local" });
      return authJson(
        { error: "Confirm your email before signing in. Check your inbox for the verification link." },
        { status: 403 },
      );
    }

    return authJson({ ok: true, redirectTo: safeNextPath(parsed.data.next, "/members") });
  } catch (error) {
    console.error("[lus-auth] sign-in service unavailable:", error instanceof Error ? error.message : "unknown error");
    return authJson({ error: "Account sign-in is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
