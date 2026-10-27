import { NextResponse } from "next/server";
import { getRequestSession } from "@/lib/session";
import { checkSessionMembership } from "@/lib/whop-access";
import {
  createCloudflareManifestUrl,
  getCloudflareStreamStatus,
} from "@/lib/cloudflare-stream";

/**
 * Issues a short-lived Cloudflare Stream player URL only to active members.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const session = await getRequestSession(request);
  if (session.unavailable) {
    return NextResponse.json({ error: "auth_unavailable" }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
  const user = session.user;

  if (!user) {
    return NextResponse.json({ error: "not_authorized" }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
  }

  const membership = await checkSessionMembership(user.sub, session.mobile === true);
  if (membership === "unknown") {
    return NextResponse.json(
      { error: "membership_check_failed" },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  if (membership !== "active" && membership !== "trialing") {
    return NextResponse.json(
      { error: "not_authorized" },
      { status: 403, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const status = await getCloudflareStreamStatus();
  if (status === "not_configured") {
    return NextResponse.json(
      { error: "stream_not_configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (status === "offline") {
    return NextResponse.json(
      { error: "stream_not_live" },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (status === "unavailable") {
    return NextResponse.json(
      { error: "stream_unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const manifestUrl = await createCloudflareManifestUrl();
    if (!manifestUrl) {
      return NextResponse.json(
        { error: "stream_not_live" },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      { manifestUrl },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[cloudflare] Could not create member playback URL:", error);
    return NextResponse.json(
      { error: "stream_unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
