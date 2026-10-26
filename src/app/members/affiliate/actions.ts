"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/member-access";
import { createMemberAffiliate } from "@/lib/whop-affiliates";

export type AffiliateEnrollmentState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function activateAffiliate(
  _previousState: AffiliateEnrollmentState,
  _formData: FormData,
): Promise<AffiliateEnrollmentState> {
  const { user } = await requireMember("/members/affiliate");

  try {
    await createMemberAffiliate(user.sub);
  } catch (error) {
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? error.status
        : undefined;

    console.error("[whop] member affiliate enrollment failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      status,
    });

    return {
      status: "error",
      message:
        status === 403
          ? "Affiliate activation isn’t enabled yet. Please contact Level Up Society support."
          : "Whop couldn’t activate your affiliate profile. Please try again or contact support.",
    };
  }

  revalidatePath("/members/affiliate");

  return {
    status: "success",
    message: "Your affiliate access is active. Your link and stats are ready below.",
  };
}
