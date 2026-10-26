import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Body, BrandHeader, Eyebrow, PageScroll, Surface, palette } from "@/components/ui";
import { ApiError, apiRequest } from "@/lib/api";
import { useSession } from "@/lib/session-context";

interface StreamItem {
  id: string;
  title: string;
  started_at: string | null;
  scheduled_at: string | null;
  recording_url: string | null;
}

interface CallsState {
  live: StreamItem | null;
  recordings: StreamItem[];
  upcoming: StreamItem[];
  cloudflareStreamStatus: "live" | "offline" | "not_configured" | "unavailable";
  connected: boolean;
}

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  author: string;
  isSystem: boolean;
}

interface ChatState {
  connected: boolean;
  messages: ChatMessage[];
  unavailable: boolean;
  requiresReauthorization: boolean;
}

const emptyCalls: CallsState = {
  live: null,
  recordings: [],
  upcoming: [],
  cloudflareStreamStatus: "offline",
  connected: false,
};

const emptyChat: ChatState = {
  connected: false,
  messages: [],
  unavailable: false,
  requiresReauthorization: false,
};

export default function LiveCallsScreen() {
  const { sessionToken } = useSession();
  const [calls, setCalls] = useState(emptyCalls);
  const [chat, setChat] = useState(emptyChat);
  const [playerSource, setPlayerSource] = useState<{ uri: string; contentType: "hls" | "progressive" } | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loadingCalls, setLoadingCalls] = useState(true);
  const [sending, setSending] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const isLive = calls.cloudflareStreamStatus === "live" || Boolean(calls.live);

  const player = useVideoPlayer(
    playerSource ? { uri: playerSource.uri, contentType: playerSource.contentType } : null,
    (instance) => {
      instance.audioMixingMode = "doNotMix";
      instance.keepScreenOnWhilePlaying = true;
      instance.play();
    },
  );

  const fetchCalls = useCallback(async () => {
    if (!sessionToken) return;
    try {
      const next = await apiRequest<CallsState>("/api/live-calls", { sessionToken });
      setCalls(next);
      setPageError(null);
    } catch (caught) {
      setPageError(errorText(caught));
    } finally {
      setLoadingCalls(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    void fetchCalls();
    const timer = setInterval(() => void fetchCalls(), 15_000);
    return () => clearInterval(timer);
  }, [fetchCalls]);

  useEffect(() => {
    if (!sessionToken || calls.cloudflareStreamStatus !== "live") {
      setPlayerSource(null);
      setSelectedVideo(null);
      return;
    }

    let cancelled = false;
    const loadStream = async () => {
      try {
        const result = await apiRequest<{ manifestUrl: string }>("/api/live-stream", { sessionToken });
        if (!cancelled) {
          setPlayerSource({ uri: result.manifestUrl, contentType: "hls" });
          setSelectedVideo("live");
        }
      } catch (caught) {
        if (!cancelled) setPageError(errorText(caught));
      }
    };

    void loadStream();
    const refreshTimer = setInterval(() => void loadStream(), 45 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(refreshTimer);
    };
  }, [calls.cloudflareStreamStatus, sessionToken]);

  useEffect(() => {
    if (!sessionToken || !isLive) {
      setChat(emptyChat);
      return;
    }

    let cancelled = false;
    const pullChat = async () => {
      try {
        const next = await apiRequest<ChatState>("/api/live-chat", { sessionToken });
        if (!cancelled) setChat(next);
      } catch (caught) {
        if (!cancelled) {
          setChat((current) => ({
            ...current,
            unavailable: true,
            requiresReauthorization: (caught as ApiError).code === "chat_auth_required",
          }));
        }
      }
    };

    void pullChat();
    const timer = setInterval(() => void pullChat(), 3_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [isLive, sessionToken]);

  const playRecording = (recording: StreamItem) => {
    if (!recording.recording_url) return;
    setSelectedVideo(recording.id);
    setPlayerSource({ uri: recording.recording_url, contentType: "progressive" });
  };

  const sendMessage = async () => {
    const content = message.trim();
    if (!content || sending || !sessionToken) return;
    setSending(true);
    try {
      await apiRequest("/api/live-chat", {
        method: "POST",
        sessionToken,
        body: { content },
      });
      setMessage("");
    } catch (caught) {
      setPageError(errorText(caught));
    } finally {
      setSending(false);
    }
  };

  const liveStatusText = useMemo(() => {
    if (calls.cloudflareStreamStatus === "live") return "LIVE NOW";
    if (calls.cloudflareStreamStatus === "not_configured") return "STREAM SETUP NEEDED";
    if (calls.cloudflareStreamStatus === "unavailable") return "STREAM UNAVAILABLE";
    return "NO CALL LIVE";
  }, [calls.cloudflareStreamStatus]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <PageScroll>
          <BrandHeader eyebrow="LIVE CALLS" />
          <View style={styles.titleBlock}>
            <Eyebrow>WEEKLY SESSIONS</Eyebrow>
            <Text style={styles.title}>Show up, learn, and grow.</Text>
            <Body>Live calls and replays, with the member chat alongside the broadcast.</Body>
          </View>

          <View style={[styles.livePill, isLive && styles.livePillActive]}>
            <View style={[styles.liveDot, isLive && styles.liveDotActive]} />
            <Text style={[styles.liveText, isLive && styles.liveTextActive]}>{liveStatusText}</Text>
          </View>

          {playerSource ? (
            <View style={styles.playerFrame}>
              <VideoView player={player} style={styles.player} nativeControls fullscreenOptions={{ enable: true }} contentFit="contain" />
            </View>
          ) : (
            <Surface style={styles.playerPlaceholder}>
              {loadingCalls ? <ActivityIndicator color={palette.chrome} /> : <Ionicons name="videocam-outline" size={29} color={palette.dim} />}
              <Text style={styles.placeholderTitle}>{loadingCalls ? "Checking for a live call…" : "The live video appears here"}</Text>
              <Text style={styles.placeholderBody}>{isLive ? "Connecting to the stream…" : "When the host goes on air, members can watch right here."}</Text>
            </Surface>
          )}

          {pageError ? <Text style={styles.error}>{pageError}</Text> : null}

          {isLive ? (
            <Surface>
              <View style={styles.chatHeader}>
                <Ionicons name="chatbubble-ellipses-outline" size={19} color={palette.chrome} />
                <Text style={styles.sectionTitle}>Live chat</Text>
                <Text style={styles.memberOnly}>MEMBERS</Text>
              </View>
              <View style={styles.messageList}>
                {chat.messages.length ? chat.messages.slice(-12).map((item) => (
                  <View key={item.id} style={styles.messageRow}>
                    <Text style={styles.author}>{item.author}</Text>
                    <Text style={styles.messageText}>{item.content}</Text>
                  </View>
                )) : (
                  <Text style={styles.placeholderBody}>{chat.unavailable ? "Chat is unavailable right now." : "Chat messages appear here when the call is live."}</Text>
                )}
              </View>
              <View style={styles.composer}>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Say something…"
                  placeholderTextColor={palette.dim}
                  maxLength={500}
                  editable={!sending}
                  returnKeyType="send"
                  onSubmitEditing={() => void sendMessage()}
                  style={styles.input}
                />
                <Pressable onPress={() => void sendMessage()} disabled={sending || !message.trim()} style={styles.sendButton} accessibilityLabel="Send message">
                  {sending ? <ActivityIndicator color={palette.ink} size="small" /> : <Ionicons name="arrow-up" size={18} color={palette.ink} />}
                </Pressable>
              </View>
            </Surface>
          ) : null}

          {calls.upcoming.length ? (
            <View style={styles.section}>
              <Eyebrow>COMING UP</Eyebrow>
              {calls.upcoming.map((item) => (
                <Surface key={item.id} style={styles.listCard}>
                  <Text style={styles.sectionTitle}>{item.title}</Text>
                  <Text style={styles.placeholderBody}>{item.scheduled_at ? formatDate(item.scheduled_at) : "Scheduled call"}</Text>
                </Surface>
              ))}
            </View>
          ) : null}

          {calls.recordings.length ? (
            <View style={styles.section}>
              <Eyebrow>RECENT REPLAYS</Eyebrow>
              {calls.recordings.map((item) => (
                <Pressable key={item.id} onPress={() => playRecording(item)}>
                  <Surface style={[styles.listCard, selectedVideo === item.id && styles.selectedCard]}>
                    <View style={styles.recordingRow}>
                      <Ionicons name="play-circle-outline" size={25} color={palette.chrome} />
                      <View style={styles.recordingCopy}>
                        <Text style={styles.sectionTitle}>{item.title}</Text>
                        {item.started_at ? <Text style={styles.placeholderBody}>{formatDate(item.started_at)}</Text> : null}
                      </View>
                      <Ionicons name="chevron-forward" size={17} color={palette.dim} />
                    </View>
                  </Surface>
                </Pressable>
              ))}
            </View>
          ) : null}
        </PageScroll>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" }).format(date);
}

function errorText(error: unknown): string {
  if (error instanceof ApiError && error.status === 401) return "Your sign-in expired. Sign in again to keep watching.";
  if (error instanceof ApiError && error.status === 403) return "An active Level Up Pro membership is required.";
  return "We couldn't load this right now. Pull down to refresh or try again.";
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.ink },
  keyboard: { flex: 1 },
  titleBlock: { gap: 12, marginTop: 18 },
  title: { color: palette.text, fontSize: 32, lineHeight: 38, fontWeight: "700", letterSpacing: -1 },
  livePill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 24, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.panel },
  livePillActive: { borderColor: "#653031", backgroundColor: "#241011" },
  liveDot: { width: 7, height: 7, borderRadius: 5, backgroundColor: palette.dim },
  liveDotActive: { backgroundColor: palette.red },
  liveText: { color: palette.muted, fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  liveTextActive: { color: palette.red },
  playerFrame: { overflow: "hidden", borderRadius: 22, borderWidth: 1, borderColor: palette.border, backgroundColor: "#000", aspectRatio: 16 / 9 },
  player: { flex: 1 },
  playerPlaceholder: { aspectRatio: 16 / 9, alignItems: "center", justifyContent: "center", gap: 12 },
  placeholderTitle: { color: palette.text, fontSize: 15, fontWeight: "600", textAlign: "center" },
  placeholderBody: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  error: { color: palette.red, fontSize: 12, lineHeight: 18 },
  chatHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 15 },
  sectionTitle: { color: palette.text, fontSize: 15, fontWeight: "600", flex: 1 },
  memberOnly: { color: palette.dim, fontSize: 9, letterSpacing: 1.3, fontWeight: "700" },
  messageList: { gap: 13, paddingVertical: 9, minHeight: 70 },
  messageRow: { gap: 3 },
  author: { color: palette.chrome, fontSize: 12, fontWeight: "600" },
  messageText: { color: palette.muted, fontSize: 13, lineHeight: 19 },
  composer: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 },
  input: { flex: 1, color: palette.text, borderWidth: 1, borderColor: palette.border, borderRadius: 24, paddingHorizontal: 15, paddingVertical: Platform.OS === "ios" ? 13 : 10, fontSize: 13 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: palette.chrome, alignItems: "center", justifyContent: "center" },
  section: { gap: 11 },
  listCard: { paddingVertical: 15 },
  selectedCard: { borderColor: palette.chrome },
  recordingRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  recordingCopy: { flex: 1, gap: 5 },
});
