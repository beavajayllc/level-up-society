import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { Body, BrandHeader, Eyebrow, PageScroll, PrimaryButton, QuietButton, Surface, palette } from "@/components/ui";

type CreditAnswer = "Yes" | "No" | "I'm not sure";

const questions = [
  {
    prompt: "Do you need credit repair?",
    options: ["Yes", "No", "I'm not sure"],
  },
  {
    prompt: "Where are you with your business?",
    options: ["I own a business", "I'm getting one started", "I'm exploring ideas"],
  },
  {
    prompt: "What kind of support are you looking for?",
    options: ["Business funding", "Personal credit support", "Both funding and credit support", "I'm still figuring that out"],
  },
  {
    prompt: "When are you hoping to make progress?",
    options: ["As soon as possible", "In the next few months", "I'm planning ahead"],
  },
] as const;

const bookingUrl = "https://calendly.com/beavajayllc-sxr3/30min?background_color=101113&text_color=e7eaf0&primary_color=c2cad5&hide_event_type_details=1";

export default function FundingCreditScreen() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const answer = answers[0] as CreditAnswer | undefined;
  const needsCall = answer === "Yes" || answer === "I'm not sure";
  const complete = step === questions.length;

  const selectAnswer = (value: string) => {
    setAnswers((current) => {
      const next = current.slice(0, step);
      next[step] = value;
      return next;
    });
  };

  const continueQuestionnaire = () => {
    if (!answers[step]) return;
    if (step === 0 && (answers[0] === "Yes" || answers[0] === "I'm not sure")) {
      setStep(questions.length);
      return;
    }
    setStep((current) => current + 1);
  };

  const restart = () => {
    setStep(0);
    setAnswers([]);
    setShowCalendar(false);
  };

  const wantsCreditSupport = answers[2] === "Personal credit support" || answers[2] === "Both funding and credit support";
  const wantsFunding = answers[2] === "Business funding" || answers[2] === "Both funding and credit support";
  const recommendation = wantsCreditSupport
    ? "Start with a credit review, then map out the funding options that fit your goals."
    : wantsFunding && answers[1] === "I own a business"
      ? "Start with a business funding conversation and review the options that fit your plans."
      : wantsFunding
        ? "Build your business foundation and learn what lenders typically look for before pursuing funding."
        : "Explore the funding and credit education in the members area, then revisit your goals as they become clearer.";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <PageScroll>
        <BrandHeader eyebrow="FUNDING & CREDIT" />
        <View style={styles.intro}>
          <Eyebrow>YOUR NEXT STEP</Eyebrow>
          <Text style={styles.title}>Find your next step.</Text>
          <Body>Answer a few quick questions so you can see which credit or funding support may fit where you are right now.</Body>
        </View>

        {!complete ? (
          <Surface style={styles.questionCard}>
            <View style={styles.progressRow}>
              <Text style={styles.questionCount}>QUESTION {step + 1} OF {questions.length}</Text>
              <Text style={styles.timeEstimate}>About a minute</Text>
            </View>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${((step + 1) / questions.length) * 100}%` }]} /></View>
            <Text style={styles.question}>{questions[step].prompt}</Text>
            {questions[step].options.map((option) => (
              <Pressable key={option} onPress={() => selectAnswer(option)} style={[styles.option, answers[step] === option && styles.optionSelected]}>
                <Text style={styles.optionText}>{option}</Text>
                {answers[step] === option ? <Ionicons name="checkmark-circle" size={18} color={palette.chrome} /> : <Ionicons name="chevron-forward" size={17} color={palette.dim} />}
              </Pressable>
            ))}
            <View style={styles.questionActions}>
              {step > 0 ? <QuietButton onPress={() => setStep((current) => current - 1)}><Text style={styles.quietText}>Back</Text></QuietButton> : <View />}
              <PrimaryButton onPress={continueQuestionnaire} disabled={!answers[step]} style={styles.continueButton}>
                <Text style={styles.primaryText}>{step === questions.length - 1 ? "See your next step" : "Continue"}</Text>
              </PrimaryButton>
            </View>
          </Surface>
        ) : needsCall ? (
          <Surface style={styles.answerCard}>
            <Eyebrow>YOUR NEXT STEP</Eyebrow>
            <Text style={styles.answerTitle}>Let’s schedule a call.</Text>
            <Body>A member of our team can talk with you about credit repair and help you figure out the next step that fits.</Body>
            <Text style={styles.yourAnswer}>Your answer: <Text style={styles.answerEmphasis}>{answer}</Text></Text>
            <View style={styles.calendarHeading}>
              <Ionicons name="calendar-outline" size={19} color={palette.chrome} />
              <Text style={styles.calendarTitle}>Choose a time that works for you</Text>
            </View>
            <PrimaryButton onPress={() => setShowCalendar(true)}>
              <Text style={styles.primaryText}>Schedule a call today</Text>
            </PrimaryButton>
            <QuietButton onPress={() => setStep(0)}>
              <Text style={styles.quietText}>Change answer</Text>
            </QuietButton>
          </Surface>
        ) : (
          <Surface style={styles.answerCard}>
            <Eyebrow>YOUR NEXT STEP</Eyebrow>
            <Text style={styles.answerTitle}>Here’s a place to start.</Text>
            <Body>{recommendation}</Body>
            <Text style={styles.yourAnswer}>Your answer: <Text style={styles.answerEmphasis}>No</Text></Text>
            <View style={styles.answersBox}>
              {questions.map((question, index) => (
                <View key={question.prompt} style={styles.answerRow}>
                  <Text style={styles.answerQuestion}>{question.prompt}</Text>
                  <Text style={styles.answerValue}>{answers[index]}</Text>
                </View>
              ))}
            </View>
            <QuietButton onPress={() => setStep(0)}>
              <Text style={styles.quietText}>Change answer</Text>
            </QuietButton>
            <QuietButton onPress={restart}>
              <Text style={styles.quietText}>Start over</Text>
            </QuietButton>
          </Surface>
        )}
      </PageScroll>

      <Modal visible={showCalendar} animationType="slide" onRequestClose={() => setShowCalendar(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <View>
              <Eyebrow>LEVEL UP SOCIETY</Eyebrow>
              <Text style={styles.modalTitle}>Schedule a call</Text>
            </View>
            <Pressable onPress={() => setShowCalendar(false)} accessibilityLabel="Close calendar" style={styles.closeButton}>
              <Ionicons name="close" size={22} color={palette.text} />
            </Pressable>
          </View>
          <WebView
            source={{ uri: bookingUrl }}
            style={styles.webView}
            originWhitelist={["https://*"]}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            allowsBackForwardNavigationGestures
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.ink },
  intro: { gap: 13, marginTop: 18 },
  title: { color: palette.text, fontSize: 33, lineHeight: 39, letterSpacing: -1.1, fontWeight: "700" },
  questionCard: { gap: 18, marginTop: 2 },
  progressRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  questionCount: { color: palette.chrome, fontSize: 10, letterSpacing: 1.7, fontWeight: "700" },
  timeEstimate: { color: palette.dim, fontSize: 11 },
  progressTrack: { height: 3, backgroundColor: palette.border, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", width: "25%", backgroundColor: palette.chrome },
  question: { color: palette.text, fontSize: 22, lineHeight: 28, fontWeight: "600", marginTop: 7 },
  option: { minHeight: 54, borderRadius: 15, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.ink, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  optionSelected: { borderColor: palette.chrome, backgroundColor: "#1A1C20" },
  optionText: { color: palette.text, fontSize: 14, fontWeight: "500" },
  questionActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 4 },
  continueButton: { flex: 1, maxWidth: 220 },
  answerCard: { gap: 17, marginTop: 2 },
  answerTitle: { color: palette.text, fontSize: 25, lineHeight: 31, fontWeight: "700", letterSpacing: -0.5, marginTop: -7 },
  yourAnswer: { color: palette.dim, fontSize: 13 },
  answerEmphasis: { color: palette.muted },
  calendarHeading: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 5 },
  calendarTitle: { color: palette.text, fontSize: 15, fontWeight: "600", flex: 1 },
  primaryText: { color: palette.ink, fontSize: 14, fontWeight: "700" },
  quietText: { color: palette.text, fontSize: 13, fontWeight: "600" },
  answersBox: { gap: 13, borderTopWidth: 1, borderBottomWidth: 1, borderColor: palette.border, paddingVertical: 15 },
  answerRow: { gap: 5 },
  answerQuestion: { color: palette.dim, fontSize: 12 },
  answerValue: { color: palette.muted, fontSize: 13 },
  modalSafe: { flex: 1, backgroundColor: palette.ink },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: palette.border },
  modalTitle: { color: palette.text, fontSize: 21, fontWeight: "700", marginTop: 5 },
  closeButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: palette.panel, borderWidth: 1, borderColor: palette.border },
  webView: { flex: 1, backgroundColor: palette.ink },
});
