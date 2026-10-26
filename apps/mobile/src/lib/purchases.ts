import { Platform } from "react-native";
import Purchases, { type PurchasesPackage } from "react-native-purchases";

export type LevelUpPackage = PurchasesPackage;

const entitlementId =
  process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID?.trim() || "level_up_pro";

let isConfigured = false;
let configuredUserId: string | null = null;

function platformApiKey(): string | undefined {
  if (Platform.OS === "ios") {
    return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim();
  }
  if (Platform.OS === "android") {
    return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim();
  }
  return undefined;
}

export function getLevelUpEntitlementId(): string {
  return entitlementId;
}

export async function configurePurchasesForUser(userId: string): Promise<void> {
  const apiKey = platformApiKey();
  if (!apiKey) {
    throw new Error("In-app subscriptions aren't configured on this build yet.");
  }

  if (!isConfigured) {
    Purchases.configure({ apiKey, appUserID: userId });
    isConfigured = true;
    configuredUserId = userId;
    return;
  }

  if (configuredUserId !== userId) {
    await Purchases.logIn(userId);
    configuredUserId = userId;
  }
}

export async function signOutPurchasesUser(): Promise<void> {
  if (!isConfigured || configuredUserId === null) return;
  await Purchases.logOut();
  configuredUserId = null;
}
