import { Redirect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Purchases from "react-native-purchases";
import {
  Body,
  BrandHeader,
  Eyebrow,
  PageScroll,
  PrimaryButton,
  QuietButton,
  StatusNote,
  Surface,
  palette,
} from "@/components/ui";
import {
  configurePurchasesForUser,
  getLevelUpEntitlementId,
  type LevelUpPackage,
} from "@/lib/purchases";
import { useSession } from "@/lib/session-context";

function billingPeriod(period: string | null): string {
  const labels: Record<string, string> = {
    P1W: "per week",
    P2W: "every 2 weeks",
    P1M: "per month",
    P2M: "every 2 months",
    P3M: "every 3 months",
    P6M: "every 6 months",
    P1Y: "per year",
  };
  return period ? labels[period] ?? "per subscription period" : "subscription";
}

function safeError(error: unknown): string {
  if (error instanceof Error && error.message.includes("aren't configured")) {
    return error.message;
  }
  return "We couldn't reach the app stores. Please try again.";
}

export default function SubscribeScreen() {
  const { status, user, membership, refreshMembership, signOut } = useSession();
  const [packages, setPackages] = useState<LevelUpPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadPackages = useCallback(async () => {
    if (!user) return;
    try {
      await configurePurchasesForUser(user.sub);
      const offerings = await Purchases.getOfferings();
      setPackages(offerings.current?.availablePackages ?? []);
    } catch (caught) {
      setError(safeError(caught));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => void loadPackages(), 0);
    return () => clearTimeout(timer);
  }, [loadPackages]);

  if (status === "loading") {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={palette.chrome} />
      </View>
    );
  }
  if (status === "signedOut") return <Redirect href="/" />;
  if (status === "unavailable") return <Redirect href="/" />;
  if (membership === "active" || membership === "trialing") {
    return <Redirect href="/(member)" />;
  }

  const confirmAccess = async (successMessage: string) => {
    setNotice(null);
    try {
      const state = await refreshMembership();
      if (state === "active" || state === "trialing") return;
      setNotice(successMessage);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't verify your membership yet.");
    }
  };

  const buy = async (selected: LevelUpPackage) => {
    if (!user) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await configurePurchasesForUser(user.sub);
      const purchase = await Purchases.purchasePackage(selected);
      const entitlement = purchase.customerInfo.entitlements.active[
        getLevelUpEntitlementId()
      ];
      await confirmAccess(
        entitlement
          ? "Your purchase is complete. Access is syncing—tap Check access in a moment."
          : "The store completed your purchase, but access hasn't synced yet. Tap Check access in a moment.",
      );
    } catch (caught) {
      const userCancelled =
        typeof caught === "object" && caught !== null &&
        "userCancelled" in caught && caught.userCancelled === true;
      if (!userCancelled) setError(safeError(caught));
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    if (!user) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await configurePurchasesForUser(user.sub);
      await Purchases.restorePurchases();
      await confirmAccess("No active Level Up Pro subscription was found for this account.");
    } catch (caught) {
      setError(safeError(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <PageScroll>
        <BrandHeader eyebrow="MEMBERSHIP" />
        <View style={styles.intro}>
          <Eyebrow>LEVEL UP PRO</Eyebrow>
          <Text style={styles.title}>Your next level starts here.</Text>
          <Body>
            Subscribe in the app to unlock live calls, trade ideas, education, and member support.
          </Body>
        </View>

        <Surface style={styles.accountCard}>
          <Text style={styles.cardTitle}>Sign in with your WHOP account</Text>
          <Body>
            Your app subscription is connected to this account, so Level Up Pro access follows you across devices.
          </Body>
          {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
        </Surface>

        <View style={styles.offerSection}>
          <Text style={styles.sectionTitle}>Choose your subscription</Text>
          {loading ? (
            <ActivityIndicator color={palette.chrome} style={styles.loader} />
          ) : packages.length > 0 ? (
            packages.map((item) => (
              <Surface key={item.identifier} style={styles.offerCard}>
                <View style={styles.offerHeading}>
                  <View style={styles.offerCopy}>
                    <Text style={styles.offerTitle}>{item.product.title || "Level Up Pro"}</Text>
                    <Text style={styles.period}>{billingPeriod(item.product.subscriptionPeriod)}</Text>
                  </View>
                  <Text style={styles.price}>{item.product.priceString}</Text>
                </View>
                {item.product.description ? (
                  <Body style={styles.offerDescription}>{item.product.description}</Body>
                ) : null}
                <PrimaryButton
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={() => void buy(item)}
                >
                  {busy ? "Please wait…" : "Subscribe"}
                </PrimaryButton>
              </Surface>
            ))
          ) : (
            <Surface style={styles.offerCard}>
              <Text style={styles.cardTitle}>Subscriptions are being set up</Text>
              <Body>
                App Store and Google Play subscription options will appear here once store products are connected.
              </Body>
              <QuietButton
                disabled={busy}
                onPress={() => {
                  setLoading(true);
                  setError(null);
                  void loadPackages();
                }}
              >
                {loading ? "Checking…" : "Try again"}
              </QuietButton>
            </Surface>
          )}
        </View>

        {error ? <StatusNote tone="error">{error}</StatusNote> : null}
        {notice ? <StatusNote tone="success">{notice}</StatusNote> : null}

        <View style={styles.actions}>
          <QuietButton disabled={busy} onPress={() => void restore()}>
            Restore purchases
          </QuietButton>
          <QuietButton disabled={busy} onPress={() => void confirmAccess("This account doesn't have an active Level Up Pro subscription yet.")}>
            Check access
          </QuietButton>
          <QuietButton disabled={busy} onPress={() => void signOut()}>
            Sign out
          </QuietButton>
        </View>

        <Text style={styles.renewal}>
          Payment is charged to your Apple Account or Google Play account at the price shown. Subscriptions renew automatically unless canceled at least 24 hours before renewal in your store account settings.
        </Text>
      </PageScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.ink },
  loadingScreen: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: palette.ink },
  intro: { gap: 13, marginTop: 20 },
  title: { color: palette.text, fontSize: 34, lineHeight: 40, letterSpacing: -1.1, fontWeight: "700" },
  accountCard: { gap: 10 },
  cardTitle: { color: palette.text, fontSize: 17, lineHeight: 23, fontWeight: "600" },
  email: { color: palette.chrome, fontSize: 12, marginTop: 3 },
  offerSection: { gap: 12 },
  sectionTitle: { color: palette.text, fontSize: 19, fontWeight: "600" },
  offerCard: { gap: 15 },
  offerHeading: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 14 },
  offerCopy: { flex: 1, gap: 5 },
  offerTitle: { color: palette.text, fontSize: 17, fontWeight: "600" },
  period: { color: palette.muted, fontSize: 13 },
  price: { color: palette.text, fontSize: 19, fontWeight: "700" },
  offerDescription: { fontSize: 13, lineHeight: 19 },
  loader: { paddingVertical: 22 },
  actions: { gap: 9 },
  renewal: { color: palette.dim, fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 4 },
});
