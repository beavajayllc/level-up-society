import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Body, BrandHeader, Eyebrow, PageScroll, palette } from "@/components/ui";
import { useSession } from "@/lib/session-context";

const cards = [
  {
    title: "Live calls",
    body: "Watch live sessions and join the member chat.",
    icon: "radio-outline",
    route: "/(member)/live-calls" as const,
    label: "WEEKLY",
  },
  {
    title: "Trade ideas chat",
    body: "Connect Telegram and join the private trade chat.",
    icon: "trending-up-outline",
    route: "/(member)/trade-ideas" as const,
    label: "ALWAYS ON",
  },
  {
    title: "Business education",
    body: "Keep building your business skills and momentum.",
    icon: "book-outline",
    route: "/(member)/resources" as const,
    label: "ON DEMAND",
  },
  {
    title: "Funding & credit",
    body: "Find a next step for credit repair or funding support.",
    icon: "briefcase-outline",
    route: "/(member)/funding-credit" as const,
    label: "BY REQUEST",
  },
];

export default function MemberHome() {
  const { user } = useSession();
  const rawName = user?.name ?? user?.preferred_username ?? user?.email ?? "member";
  const firstName = rawName.split(" ")[0] || "member";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <PageScroll>
        <BrandHeader eyebrow="MEMBERS AREA" />
        <View style={styles.intro}>
          <Eyebrow>LEVEL UP PRO</Eyebrow>
          <Text style={styles.title}>Welcome inside, {firstName}.</Text>
          <Body>Your membership is active. Pick up where you want to grow today.</Body>
        </View>

        <View style={styles.statusPill}>
          <View style={styles.activeDot} />
          <Text style={styles.statusText}>Membership active</Text>
        </View>

        <View style={styles.grid}>
          {cards.map((card) => (
            <Pressable
              key={card.title}
              onPress={() => router.push(card.route)}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
              <View style={styles.cardTop}>
                <View style={styles.iconWrap}>
                  <Ionicons name={card.icon as never} size={20} color={palette.chrome} />
                </View>
                <Text style={styles.cardTag}>{card.label}</Text>
              </View>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardBody}>{card.body}</Text>
              <View style={styles.cardLink}>
                <Text style={styles.cardLinkText}>Open</Text>
                <Ionicons name="arrow-up-outline" size={15} color={palette.muted} />
              </View>
            </Pressable>
          ))}
        </View>
      </PageScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.ink },
  intro: { gap: 13, marginTop: 20 },
  title: { color: palette.text, fontSize: 34, lineHeight: 40, letterSpacing: -1.1, fontWeight: "700" },
  statusPill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 9, borderWidth: 1, borderColor: "#345344", backgroundColor: "#102017", borderRadius: 24, paddingHorizontal: 14, paddingVertical: 9 },
  activeDot: { width: 7, height: 7, borderRadius: 5, backgroundColor: palette.green },
  statusText: { color: palette.green, fontSize: 12, fontWeight: "600" },
  grid: { gap: 12, marginTop: 4 },
  card: { borderRadius: 20, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.panel, padding: 18, minHeight: 195 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  iconWrap: { width: 42, height: 42, borderRadius: 22, borderWidth: 1, borderColor: palette.border, alignItems: "center", justifyContent: "center", backgroundColor: palette.ink },
  cardTag: { color: palette.dim, fontSize: 9, letterSpacing: 1.5, fontWeight: "700" },
  cardTitle: { color: palette.text, fontSize: 19, fontWeight: "600", letterSpacing: -0.4, marginTop: 17 },
  cardBody: { color: palette.muted, fontSize: 13, lineHeight: 19, marginTop: 6 },
  cardLink: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 14 },
  cardLinkText: { color: palette.muted, fontSize: 12, fontWeight: "600" },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
});
