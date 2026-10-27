import { NextResponse } from "next/server";
import { z } from "zod";
import { isLusAuthConfigured } from "@/lib/env";
import { authJson } from "@/lib/lus-auth-http";
import { isSameOriginRequest, passwordSchema } from "@/lib/lus-auth-validation";
import { createSupabaseAuthClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1),
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match.",
});

export async function PATCH(request: Request): Promise<NextResponse> {
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
    return authJson({ error: "Please choose a valid password." }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return authJson({ error: parsed.error.issues[0]?.message ?? "Please choose a valid password." }, { status: 400 });
  }

  try {
    const auth = await createSupabaseAuthClient();
    const { data, error: userError } = await auth.auth.getUser();
    if (userError || !data.user) {
      return authJson({ error: "That password reset link is no longer valid. Request a new one." }, { status: 401 });
    }

    const { error } = await auth.auth.updateUser({ password: parsed.data.password });
    if (error) {
      console.error(`[lus-auth] password update failed (${error.code ?? "unknown"})`);
      return authJson({ error: "We couldn't update your password. Request a new reset link and try again." }, { status: 400 });
    }
    return authJson({ ok: true });
  } catch (error) {
    console.error("[lus-auth] password update service unavailable:", error instanceof Error ? error.message : "unknown error");
    return authJson({ error: "We couldn't update your password right now. Please try again." }, { status: 503 });
  }
}
