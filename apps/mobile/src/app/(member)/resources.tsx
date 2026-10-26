import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Body, BrandHeader, Eyebrow, PageScroll, Surface, palette } from "@/components/ui";

const resources = [
  {
    icon: "school-outline",
    title: "Business education library",
    detail: "Structured learning on building, marketing, and selling a business.",
    tag: "ON DEMAND",
    action: "library",
  },
  {
    icon: "briefcase-outline",
    title: "Funding & credit desk",
    detail: "Answer a few questions and find a useful next step for your goals.",
    tag: "BY REQUEST",
    action: "funding",
  },
  {
    icon: "people-outline",
    title: "Member community",
    detail: "Join the live room chat during weekly calls and meet other builders.",
    tag: "COMMUNITY",
    action: "live",
  },
];

export default function ResourcesScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <PageScroll>
        <BrandHeader eyebrow="MEMBER RESOURCES" />
        <View style={styles.intro}>
          <Eyebrow>LEARN & MOVE FORWARD</Eyebrow>
          <Text style={styles.title}>Your next useful step.</Text>
          <Body>Education, funding support, and a place to connect with the community.</Body>
        </View>

        {resources.map((resource) => (
          <Pressable
            key={resource.title}
            onPress={() => {
              if (resource.action === "funding") router.push("/(member)/funding-credit");
              if (resource.action === "live") router.push("/(member)/live-calls");
            }}
            style={({ pressed }) => pressed && resource.action !== "library" ? styles.pressed : undefined}
          >
            <Surface style={styles.card}>
              <View style={styles.topRow}>
                <View style={styles.iconWrap}>
                  <Ionicons name={resource.icon as never} size={20} color={palette.chrome} />
                </View>
                <Text style={styles.tag}>{resource.tag}</Text>
              </View>
              <Text style={styles.cardTitle}>{resource.title}</Text>
              <Text style={styles.cardBody}>{resource.detail}</Text>
              <View style={styles.footer}>
                <Text style={styles.open}>{resource.action === "library" ? "Coming soon" : "Open"}</Text>
                {resource.action !== "library" ? <Ionicons name="arrow-up-outline" size={15} color={palette.muted} /> : null}
              </View>
            </Surface>
          </Pressable>
        ))}
      </PageScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.ink },
  intro: { gap: 13, marginTop: 18, marginBottom: 3 },
  title: { color: palette.text, fontSize: 32, lineHeight: 38, fontWeight: "700", letterSpacing: -1 },
  card: { gap: 11 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconWrap: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 23, backgroundColor: palette.ink, borderWidth: 1, borderColor: palette.border },
  tag: { color: palette.dim, fontSize: 9, fontWeight: "700", letterSpacing: 1.6 },
  cardTitle: { color: palette.text, fontSize: 18, fontWeight: "600", marginTop: 5 },
  cardBody: { color: palette.muted, fontSize: 13, lineHeight: 20 },
  footer: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 },
  open: { color: palette.muted, fontSize: 12, fontWeight: "600" },
  pressed: { opacity: 0.8 },
});
