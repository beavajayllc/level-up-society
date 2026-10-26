import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, View } from "react-native";
import { palette } from "@/components/ui";
import { useSession } from "@/lib/session-context";

const icons = {
  index: "grid-outline",
  "live-calls": "radio-outline",
  "trade-ideas": "trending-up-outline",
  resources: "book-outline",
  account: "person-circle-outline",
} as const;

export default function MemberTabs() {
  const { status, membership } = useSession();

  if (status === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: palette.ink }}>
        <ActivityIndicator color={palette.chrome} />
      </View>
    );
  }
  if (status !== "signedIn") return <Redirect href="/" />;
  if (membership !== "active" && membership !== "trialing") {
    return <Redirect href="/subscribe" />;
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: { backgroundColor: palette.ink },
        tabBarActiveTintColor: palette.chrome,
        tabBarInactiveTintColor: palette.dim,
        tabBarStyle: {
          backgroundColor: palette.ink,
          borderTopColor: palette.border,
          height: 66,
          paddingTop: 7,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600", letterSpacing: 0.2 },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={icons[route.name as keyof typeof icons]} color={String(color)} size={size} />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="live-calls" options={{ title: "Live calls" }} />
      <Tabs.Screen name="trade-ideas" options={{ title: "Trade ideas" }} />
      <Tabs.Screen name="resources" options={{ title: "Resources" }} />
      <Tabs.Screen name="account" options={{ title: "Account" }} />
      <Tabs.Screen name="funding-credit" options={{ href: null, title: "Funding & credit" }} />
    </Tabs>
  );
}
