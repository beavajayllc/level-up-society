import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireMember } from "@/lib/member-access";
import { getInactiveAffiliateMembers } from "@/lib/whop-affiliates";

const privateNoStore = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Cookie",
};

export async function GET() {
  await cookies();
  const { user } = await requireMember("/members/affiliate");
  const result = await getInactiveAffiliateMembers(
    user.sub,
    user.preferred_username,
  );

  return NextResponse.json(result, {
    status: result.status === "unavailable" ? 503 : 200,
    headers: privateNoStore,
  });
}
