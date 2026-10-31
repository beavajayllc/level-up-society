import { NextResponse } from "next/server";
import {
  findAffiliateLinkHandle,
  type AffiliateLinkHandle,
} from "@/lib/affiliate-links";
import { normalizeAffiliateHandle } from "@/lib/affiliate-handle-format";
import { PUBLIC_SITE_URL } from "@/lib/checkout";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle: rawHandle } = await params;
  const handle = normalizeAffiliateHandle(rawHandle);
  if (!handle) {
    return NextResponse.redirect(
      new URL("/join?error=affiliate_link_not_found", PUBLIC_SITE_URL),
      307,
    );
  }

  let affiliateLink: AffiliateLinkHandle | null;
  try {
    affiliateLink = await findAffiliateLinkHandle(handle);
  } catch (error) {
    console.error("[affiliate-link] referral lookup failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Referral links are temporarily unavailable." },
      { status: 503 },
    );
  }

  if (!affiliateLink) {
    return NextResponse.redirect(
      new URL("/join?error=affiliate_link_not_found", PUBLIC_SITE_URL),
      307,
    );
  }

  const joinUrl = new URL("/join", PUBLIC_SITE_URL);
  joinUrl.searchParams.set("a", affiliateLink.whopUsername);
  return NextResponse.redirect(joinUrl, 307);
}
