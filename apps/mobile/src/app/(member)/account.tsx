import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Body, BrandHeader, Eyebrow, PageScroll, PrimaryButton, QuietButton, Surface, palette } from "@/components/ui";
import { useSession } from "@/lib/session-context";

const PRIVACY_URL = "https://www.level-up-society.com/privacy-policy";
const DELETE_ACCOUNT_URL = "https://www.level-up-society.com/delete-account";

export default function AccountScreen() {
  const { user, signOut } = useSession();
  const displayName = user?.name ?? user?.preferred_username ?? "Level Up member";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <PageScroll>
        <BrandHeader eyebrow="YOUR ACCOUNT" />
        <View style={styles.intro}>
          <Eyebrow>LEVEL UP PRO</Eyebrow>
          <Text style={styles.title}>Your membership.</Text>
          <Body>Manage your sign-in and get help with your account.</Body>
        </View>

        <Surface style={styles.accountCard}>
          <View style={styles.avatar}><Ionicons name="person-outline" size={22} color={palette.chrome} /></View>
          <Text style={styles.name}>{displayName}</Text>
          {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
          <View style={styles.activeLine}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>Level Up Pro active</Text>
          </View>
        </Surface>

        <Surface style={styles.signOutCard}>
          <Text style={styles.cardTitle}>Ready to step away?</Text>
          <Body>Signing out ends your app session on this device. Your membership stays as it is.</Body>
          <PrimaryButton onPress={() => void signOut()} style={styles.signOutButton}>
            <View style={styles.buttonContent}>
              <Ionicons name="log-out-outline" size={17} color={palette.ink} />
              <Text style={styles.buttonText}>Sign out</Text>
            </View>
          </PrimaryButton>
        </Surface>

        <Surface style={styles.privacyCard}>
          <Text style={styles.cardTitle}>Privacy & account data</Text>
          <Body>Read how we handle your information or request account deletion.</Body>
          <QuietButton onPress={() => void Linking.openURL(PRIVACY_URL)}>
            Privacy policy
          </QuietButton>
          <QuietButton onPress={() => void Linking.openURL(DELETE_ACCOUNT_URL)}>
            Request account deletion
          </QuietButton>
        </Surface>
      </PageScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.ink },
  intro: { gap: 13, marginTop: 18 },
  title: { color: palette.text, fontSize: 32, lineHeight: 38, fontWeight: "700", letterSpacing: -1 },
  accountCard: { alignItems: "center", gap: 11, paddingVertical: 28 },
  avatar: { width: 58, height: 58, alignItems: "center", justifyContent: "center", borderRadius: 32, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.ink },
  name: { color: palette.text, fontSize: 19, fontWeight: "600", marginTop: 4 },
  email: { color: palette.muted, fontSize: 12 },
  activeLine: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 5 },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.green },
  activeText: { color: palette.green, fontSize: 12, fontWeight: "600" },
  signOutCard: { gap: 15 },
  cardTitle: { color: palette.text, fontSize: 18, fontWeight: "600" },
  signOutButton: { marginTop: 4 },
  privacyCard: { gap: 14 },
  buttonContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  buttonText: { color: palette.ink, fontSize: 14, fontWeight: "700" },
});
