import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { checkMembershipCached } from "@/lib/whop-access";
import {
  createCloudflareManifestUrl,
  getCloudflareStreamStatus,
} from "@/lib/cloudflare-stream";

/**
 * Issues a short-lived Cloudflare Stream player URL only to active members.
 */
export async function GET(): Promise<NextResponse> {
  const session = await getSession();
  const user = session.user;

  if (!user) {
    return NextResponse.json({ error: "not_authorized" }, { status: 401 });
  }

  const membership = await checkMembershipCached(user.sub);
  if (membership !== "active" && membership !== "trialing") {
    return NextResponse.json({ error: "not_authorized" }, { status: 403 });
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
