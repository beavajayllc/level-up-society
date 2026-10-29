"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type LusAuthFormMode = "signup" | "login" | "forgot-password" | "new-password";

interface LusAuthFormProps {
  mode: LusAuthFormMode;
  nextPath: string;
  initialMessage?: string;
  initialError?: string;
  authAvailable?: boolean;
}

const inputClassName =
  "mt-2 block w-full rounded-xl border border-silver/15 bg-ink/70 px-4 py-3 text-[15px] text-silver outline-none transition placeholder:text-silver/70 focus:border-chrome/60 focus:ring-2 focus:ring-chrome/10";

function errorCopy(error: string | undefined): string | null {
  if (!error) return null;
  if (error === "password_updated") return "Password updated. Sign in with your new password.";
  if (error === "email_not_confirmed") return "Please confirm your email before signing in. Check your inbox for the verification link.";
  if (error === "auth_callback_failed") return "That confirmation or recovery link is invalid or expired. Request a fresh link and try again.";
  if (error === "auth_unavailable") return "We could not verify your reset session right now. Please try again shortly.";
  if (error === "account_changed") return "Your sign-in changed while connecting Whop. Sign in again and retry.";
  if (error === "oauth_denied") return "Whop connection was cancelled. You can try again when you're ready.";
  if (error === "already_linked") return "This LUS account already has its one-time Whop connection. Continue to the member area or checkout.";
  if (error === "link_conflict") return "That Whop account is already linked to another LUS account.";
  if (error === "lus_login_required") return "Use your Level Up Society username and password to sign in here.";
  if (error === "state_mismatch" || error === "missing_params") return "That Whop connection link expired. Start again from your LUS account.";
  return "We couldn't complete that request. Please try again.";
}

export function LusAuthForm({
  mode,
  nextPath,
  initialMessage,
  initialError,
  authAvailable = true,
}: LusAuthFormProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(errorCopy(initialError));
  const [message, setMessage] = useState<string | null>(initialMessage ?? null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setMessage(null);
    setBusy(true);

    const form = new FormData(event.currentTarget);
    const payload: Record<string, string> = { next: nextPath };
    for (const key of ["username", "email", "identifier", "password", "confirmPassword"]) {
      const value = form.get(key);
      if (typeof value === "string") payload[key] = value;
    }

    try {
      if (mode === "signup" && payload.password !== payload.confirmPassword) {
        setError("Your passwords don't match yet.");
        return;
      }
      if (mode === "new-password" && payload.password !== payload.confirmPassword) {
        setError("Your passwords don't match yet.");
        return;
      }

      const endpoint = {
        signup: "/api/lus-auth/signup",
        login: "/api/lus-auth/login",
        "forgot-password": "/api/lus-auth/reset",
        "new-password": "/api/lus-auth/password",
      }[mode];
      const response = await fetch(endpoint, {
        method: mode === "new-password" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });
      const result = (await response.json()) as {
        error?: string;
        message?: string;
        redirectTo?: string;
        needsEmailConfirmation?: boolean;
      };

      if (!response.ok) {
        setError(result.error ?? "We couldn't complete that request. Please try again.");
        return;
      }

      if (mode === "forgot-password") {
        setMessage("If an account can be recovered with that email, we’ve sent a reset link.");
        return;
      }
      if (mode === "signup" && result.needsEmailConfirmation) {
        setMessage("Check your email to verify your account. The link will bring you back here to continue.");
        return;
      }
      if (mode === "new-password") {
        router.replace("/login?error=password_updated");
        return;
      }

      router.replace(result.redirectTo ?? nextPath);
    } catch {
      setError("We couldn't reach account sign-in. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {mode === "signup" ? (
        <label className="block text-sm text-silver/70">
          Username
          <input
            className={inputClassName}
            name="username"
            type="text"
            autoComplete="username"
            minLength={3}
            maxLength={24}
            pattern="[A-Za-z0-9_]{3,24}"
            placeholder="Choose a username"
            required
          />
          <span className="mt-2 block text-xs text-silver/70">3–24 characters: letters, numbers, or underscores.</span>
        </label>
      ) : null}

      {mode === "login" ? (
        <label className="block text-sm text-silver/70">
          Username or email
          <input
            className={inputClassName}
            name="identifier"
            type="text"
            autoComplete="username"
            placeholder="Your username or email"
            required
          />
        </label>
      ) : null}

      {mode === "signup" || mode === "forgot-password" ? (
        <label className="block text-sm text-silver/70">
          Email
          <input
            className={inputClassName}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </label>
      ) : null}

      {mode !== "forgot-password" ? (
        <label className="block text-sm text-silver/70">
          {mode === "new-password" ? "New password" : "Password"}
          <input
            className={inputClassName}
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={12}
            placeholder={mode === "login" ? "Your password" : "At least 12 characters"}
            required
          />
        </label>
      ) : null}

      {mode === "signup" || mode === "new-password" ? (
        <label className="block text-sm text-silver/70">
          Confirm password
          <input
            className={inputClassName}
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={12}
            placeholder="Enter the password again"
            required
          />
        </label>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-xl border border-red-300/20 bg-red-300/[0.06] px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="rounded-xl border border-chrome/20 bg-chrome/[0.06] px-4 py-3 text-sm leading-relaxed text-silver/75">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy || !authAvailable}
        className="inline-flex h-12 w-full items-center justify-center rounded-pill bg-silver px-6 text-sm font-semibold text-ink transition hover:bg-silver/85 disabled:cursor-wait disabled:opacity-60"
      >
        {busy
          ? "Please wait…"
          : mode === "signup"
            ? "Create LUS account"
            : mode === "login"
              ? "Sign in"
              : mode === "forgot-password"
                ? "Send reset link"
                : "Update password"}
      </button>

      {mode === "login" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-silver/70">
          <Link href={`/signup?next=${encodeURIComponent(nextPath)}`} className="transition hover:text-chrome">
            Create an account
          </Link>
          <Link href="/forgot-password" className="transition hover:text-chrome">
            Forgot password?
          </Link>
        </div>
      ) : null}

      {mode === "signup" ? (
        <p className="text-center text-sm text-silver/70">
          Already have an account?{" "}
          <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="text-chrome transition hover:text-silver">
            Sign in
          </Link>
        </p>
      ) : null}

      {mode === "forgot-password" ? (
        <p className="text-center text-sm text-silver/70">
          Remember your password? <Link href="/login" className="text-chrome hover:text-silver">Sign in</Link>
        </p>
      ) : null}
    </form>
  );
}
