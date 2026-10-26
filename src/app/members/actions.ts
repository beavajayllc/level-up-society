"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/member-access";
import { cancelLevelUpProSubscription } from "@/lib/whop-access";

export type SubscriptionCancellationState = {
  status: "idle" | "success" | "error";
  message: string;
  membershipId: string | null;
  renewalPeriodEnd: string | null;
};

export async function cancelMyLevelUpProSubscription(
  _previousState: SubscriptionCancellationState,
  formData: FormData,
): Promise<SubscriptionCancellationState> {
  const { user } = await requireMember("/members");
  const membershipId = formData.get("membershipId");

  if (
    typeof membershipId !== "string" ||
    !/^mem_[a-zA-Z0-9]+$/.test(membershipId)
  ) {
    return {
      status: "error",
      message: "We couldn't identify this subscription. Refresh and try again.",
      membershipId: null,
      renewalPeriodEnd: null,
    };
  }

  try {
    const result = await cancelLevelUpProSubscription(user.sub, membershipId);

    if (result.status === "not-found") {
      return {
        status: "error",
        message:
          "This subscription is no longer available to cancel. Refresh the page and check its status.",
        membershipId,
        renewalPeriodEnd: null,
      };
    }

    revalidatePath("/members");

    return {
      status: "success",
      message:
        result.status === "already-scheduled"
          ? "Your subscription is already set to end at the end of this billing period."
          : "Your subscription is set to end at the end of this billing period.",
      membershipId,
      renewalPeriodEnd: result.renewalPeriodEnd,
    };
  } catch (error) {
    const status =
      typeof error === "object" && error !== null && "statusCode" in error
        ? error.statusCode
        : typeof error === "object" && error !== null && "status" in error
          ? error.status
          : undefined;

    console.error("[whop] member subscription cancellation failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      status,
    });

    return {
      status: "error",
      message:
        status === 403
          ? "Online cancellation isn't available yet. Please contact Level Up Society support."
          : "We couldn't cancel your subscription right now. Please try again or contact support.",
      membershipId,
      renewalPeriodEnd: null,
    };
  }
}
