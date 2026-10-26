import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { API_BASE_URL, ApiError, apiRequest, type WhopUserInfo } from "@/lib/api";
import { signOutPurchasesUser } from "@/lib/purchases";

WebBrowser.maybeCompleteAuthSession();

const STORAGE_KEY = "lus.mobile.session";
const REDIRECT_URI = "levelupsociety://auth/complete";

type SessionStatus = "loading" | "signedOut" | "signedIn" | "unavailable";
export type MembershipState = "active" | "trialing" | "inactive";

interface MobileSessionContextValue {
  status: SessionStatus;
  user: WhopUserInfo | null;
  membership: MembershipState | null;
  sessionToken: string | null;
  error: string | null;
  signIn(): Promise<void>;
  signOut(): Promise<void>;
  retrySession(): Promise<void>;
  refreshMembership(): Promise<MembershipState>;
  dismissError(): void;
}

const SessionContext = createContext<MobileSessionContextValue | null>(null);

export function SessionProvider({ children }: React.PropsWithChildren) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [user, setUser] = useState<WhopUserInfo | null>(null);
  const [membership, setMembership] = useState<MembershipState | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearSession = useCallback(async () => {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
    setSessionToken(null);
    setUser(null);
    setMembership(null);
    setStatus("signedOut");
  }, []);

  const retrySession = useCallback(async () => {
    let savedToken: string | null;
    try {
      savedToken = await SecureStore.getItemAsync(STORAGE_KEY);
    } catch {
      setStatus("unavailable");
      setError("We couldn't open your saved sign-in. Please try again.");
      return;
    }
    setStatus("loading");
    setError(null);
    if (!savedToken) {
      setSessionToken(null);
      setUser(null);
      setMembership(null);
      setStatus("signedOut");
      return;
    }

    try {
      const session = await apiRequest<{
        user: WhopUserInfo;
        membership: MembershipState;
      }>(
        "/api/auth/mobile/session",
        { sessionToken: savedToken },
      );
      setSessionToken(savedToken);
      setUser(session.user);
      setMembership(session.membership);
      setStatus("signedIn");
    } catch (caught) {
      const authEnded = caught instanceof ApiError &&
        (caught.status === 401 || caught.status === 403);
      if (authEnded) {
        await SecureStore.deleteItemAsync(STORAGE_KEY);
        setSessionToken(null);
        setUser(null);
        setMembership(null);
        setStatus("signedOut");
      } else {
        setSessionToken(savedToken);
        setStatus("unavailable");
      }
      setError(caught instanceof Error ? caught.message : "We couldn't verify your account right now.");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void retrySession(), 0);
    return () => clearTimeout(timer);
  }, [retrySession]);

  const signIn = useCallback(async () => {
    setError(null);
    try {
      const result = await WebBrowser.openAuthSessionAsync(
        `${API_BASE_URL}/api/auth/mobile/login`,
        REDIRECT_URI,
      );

      if (result.type !== "success") return;
      const returnedUrl = new URL(result.url);
      const code = returnedUrl.searchParams.get("code");
      const authError = returnedUrl.searchParams.get("error");
      if (authError) {
        throw new Error(
          authError === "no_membership"
            ? "An active Level Up Pro membership is required to use the app."
            : "We couldn't sign you in. Please try again.",
        );
      }
      if (!code) throw new Error("The sign-in link was incomplete. Please try again.");

      const exchanged = await apiRequest<{
        sessionToken: string;
        user: WhopUserInfo;
        membership: MembershipState;
      }>("/api/auth/mobile/exchange", {
        method: "POST",
        body: { code },
      });

      await SecureStore.setItemAsync(STORAGE_KEY, exchanged.sessionToken, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      setSessionToken(exchanged.sessionToken);
      setUser(exchanged.user);
      setMembership(exchanged.membership);
      setStatus("signedIn");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't sign you in.");
      setStatus("signedOut");
    }
  }, []);

  const signOut = useCallback(async () => {
    if (sessionToken) {
      await apiRequest("/api/auth/mobile/logout", {
        method: "POST",
        sessionToken,
      }).catch(() => undefined);
    }
    await signOutPurchasesUser().catch(() => undefined);
    await clearSession();
  }, [clearSession, sessionToken]);

  const refreshMembership = useCallback(async () => {
    if (!sessionToken) throw new Error("Sign in again to check your membership.");
    const result = await apiRequest<{
      user: WhopUserInfo;
      membership: MembershipState;
    }>("/api/auth/mobile/session/refresh", {
      method: "POST",
      sessionToken,
    });
    setUser(result.user);
    setMembership(result.membership);
    return result.membership;
  }, [sessionToken]);

  const value = useMemo<MobileSessionContextValue>(
    () => ({
      status,
      user,
      membership,
      sessionToken,
      error,
      signIn,
      signOut,
      retrySession,
      refreshMembership,
      dismissError: () => setError(null),
    }),
    [status, user, membership, sessionToken, error, signIn, signOut, retrySession, refreshMembership],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): MobileSessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside SessionProvider.");
  return context;
}
