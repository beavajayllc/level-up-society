"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/member-access";
import {
  AffiliateHandleTakenError,
  getAffiliateLinkHandle,
  saveAffiliateLinkHandle,
} from "@/lib/affiliate-links";
import { normalizeAffiliateHandle } from "@/lib/affiliate-handle-format";
import {
  AffiliateTrackingUsernameMissingError,
  createMemberAffiliate,
} from "@/lib/whop-affiliates";

export type AffiliateEnrollmentState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function activateAffiliate(
  _previousState: AffiliateEnrollmentState,
  formData: FormData,
): Promise<AffiliateEnrollmentState> {
  void _previousState;

  const handle = normalizeAffiliateHandle(formData.get("affiliateUsername"));
  if (!handle) {
    return {
      status: "error",
      message: "Choose 3–24 characters using only letters, numbers, and underscores.",
    };
  }

  const { user, lusUser } = await requireMember("/members/affiliate");

  try {
    const existing = await getAffiliateLinkHandle(lusUser.id);
    if (existing) {
      if (existing.handle === handle) {
        return {
          status: "success",
          message: "Your affiliate link is already set and ready to share.",
        };
      }
      return {
        status: "error",
        message: "Your affiliate username is already set and can’t currently be changed.",
      };
    }

    const whopUsername = await createMemberAffiliate(
      user.sub,
      user.preferred_username,
    );
    await saveAffiliateLinkHandle(lusUser.id, handle, whopUsername);
  } catch (error) {
    if (error instanceof AffiliateHandleTakenError) {
      return {
        status: "error",
        message: "That affiliate username is already taken. Please choose another.",
      };
    }

    const status =
      typeof error === "object" && error !== null && "status" in error
        ? error.status
        : undefined;

    console.error("[whop] member affiliate enrollment failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      status,
    });

    let message =
      "Whop couldn’t activate your affiliate profile. Please try again or contact support.";
    if (status === 403) {
      message = "Affiliate activation isn’t enabled yet. Please contact Level Up Society support.";
    } else if (error instanceof AffiliateTrackingUsernameMissingError) {
      message = "Set a username on your Whop profile first, then try again. Whop uses it to credit referrals.";
    }

    return {
      status: "error",
      message,
    };
  }

  revalidatePath("/members/affiliate");

  return {
    status: "success",
    message: "Your affiliate link is ready and your referrals will be tracked by Whop.",
  };
}
