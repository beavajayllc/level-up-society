import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppUrl, isLusAuthConfigured } from "@/lib/env";
import { authJson } from "@/lib/lus-auth-http";
import {
  emailSchema,
  isSameOriginRequest,
  passwordSchema,
  safeNextPath,
  usernameSchema,
} from "@/lib/lus-auth-validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseAuthClient } from "@/lib/supabase/server";

const signupSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1),
  next: z.unknown().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match.",
});

export async function POST(request: Request): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) {
    return authJson({ error: "Request origin was not accepted." }, { status: 403 });
  }
  if (!isLusAuthConfigured()) {
    return authJson({ error: "LUS account sign-up is not connected yet." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return authJson({ error: "Please check the form and try again." }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return authJson({ error: parsed.error.issues[0]?.message ?? "Please check the form." }, { status: 400 });
  }

  const { username, email, password, next } = parsed.data;
  const returnPath = safeNextPath(next, "/members");

  try {
    const admin = createSupabaseAdminClient();
    const { data: existing, error: lookupError } = await admin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (lookupError) throw new Error("Username availability could not be checked.");
    if (existing) {
      return authJson({ error: "That username is already in use. Please choose another." }, { status: 409 });
    }

    const auth = await createSupabaseAuthClient();
    const callback = new URL("/auth/callback", getAppUrl());
    callback.searchParams.set("next", returnPath);
    const { data, error } = await auth.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: callback.toString(),
      },
    });

    if (error) {
      console.error(`[lus-auth] signup failed (${error.code ?? "unknown"})`);
      if ((error.status ?? 0) >= 500) {
        throw new Error(`Signup provider returned ${error.status}.`);
      }
      return authJson({ error: "We couldn't create that account. Check your details and try again." }, { status: 400 });
    }

    const emailVerified = Boolean(data.user?.email_confirmed_at);
    if (data.session && !emailVerified) {
      await auth.auth.signOut({ scope: "local" });
    }

    return authJson({
      ok: true,
      needsEmailConfirmation: !emailVerified,
      redirectTo: returnPath,
    });
  } catch (error) {
    console.error("[lus-auth] signup service unavailable:", error instanceof Error ? error.message : "unknown error");
    return authJson({ error: "Account sign-up is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
