import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Body, BrandHeader, Eyebrow, PageScroll, PrimaryButton, Surface, palette } from "@/components/ui";
import { ApiError, apiRequest } from "@/lib/api";
import { useSession } from "@/lib/session-context";

export default function TradeIdeasScreen() {
  const { sessionToken } = useSession();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"error" | "success">("error");

  const connect = async () => {
    if (!sessionToken || loading) return;
    setLoading(true);
    setMessage(null);
    try {
      const result = await apiRequest<{ telegramUrl: string }>("/api/telegram/link", {
        method: "POST",
        sessionToken,
      });
      await Linking.openURL(result.telegramUrl);
      setTone("success");
      setMessage("Telegram opened. Follow the bot prompts to join the private chat.");
    } catch (caught) {
      setTone("error");
      if (caught instanceof ApiError && caught.status === 403) {
        setMessage("An active Level Up Pro membership is required to join the trade chat.");
      } else {
        setMessage("We couldn't create your secure Telegram link. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const openTelegramDownload = () => void Linking.openURL("https://telegram.org/dl/");

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <PageScroll>
        <BrandHeader eyebrow="TRADE IDEAS CHAT" />
        <View style={styles.intro}>
          <Eyebrow>ALWAYS ON</Eyebrow>
          <Text style={styles.title}>Get ready for the trade ideas chat.</Text>
          <Body>Connect Telegram to your active Level Up Pro membership. The bot checks your access before approving your private join request and removes access when your membership expires.</Body>
        </View>

        <Surface style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepLabel}>STEP 1</Text>
            <View style={styles.iconCircle}><Ionicons name="download-outline" size={19} color={palette.chrome} /></View>
          </View>
          <Text style={styles.cardTitle}>Download Telegram</Text>
          <Text style={styles.cardBody}>Install Telegram on your phone or computer. If you already have it, go straight to Step 2.</Text>
          <Pressable onPress={openTelegramDownload} style={styles.outlineButton}>
            <Text style={styles.outlineButtonText}>Download Telegram</Text>
            <Ionicons name="arrow-up-outline" size={15} color={palette.text} />
          </Pressable>
        </Surface>

        <Surface style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepLabel}>STEP 2</Text>
            <View style={styles.iconCircle}><Ionicons name="chatbubble-ellipses-outline" size={19} color={palette.chrome} /></View>
          </View>
          <Text style={styles.cardTitle}>Connect your member account</Text>
          <Text style={styles.cardBody}>We’ll verify your membership and create a personal Telegram link. The bot checks again before letting you into the chat.</Text>
          <PrimaryButton onPress={() => void connect()} disabled={loading} style={styles.joinButton}>
            {loading ? <ActivityIndicator color={palette.ink} /> : <Text style={styles.primaryText}>Connect and continue</Text>}
          </PrimaryButton>
          {message ? <Text style={[styles.note, tone === "error" ? styles.error : styles.success]}>{message}</Text> : null}
        </Surface>
      </PageScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.ink },
  intro: { gap: 13, marginTop: 18, marginBottom: 3 },
  title: { color: palette.text, fontSize: 31, lineHeight: 37, fontWeight: "700", letterSpacing: -1 },
  stepCard: { gap: 14 },
  stepHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  stepLabel: { color: palette.chrome, fontSize: 10, letterSpacing: 2.2, fontWeight: "700" },
  iconCircle: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 24, backgroundColor: palette.ink, borderWidth: 1, borderColor: palette.border },
  cardTitle: { color: palette.text, fontSize: 21, lineHeight: 27, fontWeight: "600", letterSpacing: -0.5 },
  cardBody: { color: palette.muted, fontSize: 13, lineHeight: 20 },
  outlineButton: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: palette.border, borderRadius: 24, paddingHorizontal: 17, paddingVertical: 12, marginTop: 3 },
  outlineButtonText: { color: palette.text, fontSize: 13, fontWeight: "600" },
  joinButton: { marginTop: 3 },
  primaryText: { color: palette.ink, fontSize: 14, fontWeight: "700" },
  note: { fontSize: 12, lineHeight: 18 },
  error: { color: palette.red },
  success: { color: palette.green },
});
