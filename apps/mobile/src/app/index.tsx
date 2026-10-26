import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import lusMark from "@/assets/images/lus-mark.png";
import { Body, Eyebrow, PrimaryButton, Screen, StatusNote, palette } from "@/components/ui";
import { useSession } from "@/lib/session-context";

export default function SignInScreen() {
  const { status, membership, error, signIn, retrySession } = useSession();

  if (status === "signedIn") {
    return membership === "active" || membership === "trialing"
      ? <Redirect href="/(member)" />
      : <Redirect href="/subscribe" />;
  }

  return (
    <Screen style={styles.screen}>
      <View style={styles.content}>
        <Image source={lusMark} alt="Level Up Society" style={styles.logo} />
        <Eyebrow style={styles.kicker}>LEVEL UP SOCIETY</Eyebrow>
        <Text style={styles.title}>Build with people who are leveling up.</Text>
        <Body style={styles.description}>
          Business education, live calls, member chat, and support for your next step—all in one place.
        </Body>

        {status === "loading" ? (
          <ActivityIndicator color={palette.chrome} style={styles.loader} />
        ) : (
          <PrimaryButton
            onPress={() => void (status === "unavailable" ? retrySession() : signIn())}
            accessibilityRole="button"
          >
            {status === "unavailable" ? "Try again" : "Sign in with WHOP"}
          </PrimaryButton>
        )}

        {error ? <StatusNote tone="error">{error}</StatusNote> : null}
        <Text style={styles.footer}>Sign in with the same WHOP account you use for Level Up Pro.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: "center", paddingHorizontal: 24 },
  content: { width: "100%", maxWidth: 480, alignSelf: "center", alignItems: "flex-start", gap: 22 },
  logo: { width: 82, height: 82, borderRadius: 24, marginBottom: 8 },
  kicker: { color: palette.chrome, letterSpacing: 3 },
  title: { color: palette.text, fontSize: 40, lineHeight: 45, letterSpacing: -1.5, fontWeight: "700" },
  description: { marginTop: -6, marginBottom: 4, fontSize: 16, lineHeight: 25 },
  footer: { color: palette.dim, fontSize: 12, lineHeight: 18, marginTop: -3 },
  loader: { alignSelf: "center", marginTop: 18 },
});
