export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "https://level-up-society-nu.vercel.app";

export interface WhopUserInfo {
  sub: string;
  name?: string;
  preferred_username?: string;
  picture?: string;
  email?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  path: string,
  options: {
    sessionToken?: string | null;
    method?: "GET" | "POST";
    body?: unknown;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  const headers = new Headers({ Accept: "application/json" });
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (options.sessionToken) {
    headers.set("Authorization", `Bearer ${options.sessionToken}`);
  }

  let response: Response;
  try {
    response = await fetch(new URL(path.replace(/^\//, ""), `${API_BASE_URL}/`), {
      method: options.method ?? "GET",
      headers,
      ...(options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
      ...(options.signal ? { signal: options.signal } : {}),
      cache: "no-store",
    });
  } catch {
    throw new ApiError("We couldn't reach Level Up Society. Check your connection and try again.", 0);
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const code =
      payload && typeof payload === "object" && "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : undefined;
    const message = errorMessage(code, response.status);
    throw new ApiError(message, response.status, code);
  }

  return payload as T;
}

function errorMessage(code: string | undefined, status: number): string {
  switch (code) {
    case "auth_unavailable":
    case "membership_check_failed":
      return "We couldn't verify your account right now. Please try again.";
    case "no_membership":
      return "An active Level Up Pro membership is required to use the app.";
    case "not_authorized":
      return "Your sign-in has expired. Sign in again to continue.";
    case "stream_not_live":
      return "The live stream is currently offline.";
    case "chat_auth_required":
      return "Reconnect your WHOP account to use live chat.";
    default:
      return status >= 500
        ? "That service is temporarily unavailable. Please try again."
        : "We couldn't complete that request. Please try again.";
  }
}
