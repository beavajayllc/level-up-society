import type { PropsWithChildren, ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type ScrollViewProps,
  type TextProps,
  type ViewProps,
} from "react-native";
import { Image } from "expo-image";
import lusMark from "@/assets/images/lus-mark.png";

export const palette = {
  ink: "#08090B",
  panel: "#101114",
  panelRaised: "#15171B",
  border: "#282A2F",
  text: "#F1F2F4",
  muted: "#999CA4",
  dim: "#6F737B",
  chrome: "#D7DCE3",
  red: "#FC6868",
  green: "#72C9A5",
};

export function Screen({ children, ...props }: PropsWithChildren<ViewProps>) {
  return (
    <View {...props} style={[styles.screen, props.style]}>
      {children}
    </View>
  );
}

export function PageScroll({ children, ...props }: PropsWithChildren<ScrollViewProps>) {
  return (
    <ScrollView
      {...props}
      style={[styles.screen, props.style]}
      contentContainerStyle={[styles.pageContent, props.contentContainerStyle]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function BrandHeader({
  eyebrow,
  action,
}: {
  eyebrow?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.brandHeader}>
      <View style={styles.brandGroup}>
        <Image source={lusMark} alt="" style={styles.brandMark} />
        <View>
          <Text style={styles.brandName}>LEVEL UP SOCIETY</Text>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        </View>
      </View>
      {action}
    </View>
  );
}

export function Heading({ children, ...props }: PropsWithChildren<TextProps>) {
  return <Text {...props} style={[styles.heading, props.style]}>{children}</Text>;
}

export function Body({ children, ...props }: PropsWithChildren<TextProps>) {
  return <Text {...props} style={[styles.body, props.style]}>{children}</Text>;
}

export function Eyebrow({ children, ...props }: PropsWithChildren<TextProps>) {
  return <Text {...props} style={[styles.eyebrow, props.style]}>{children}</Text>;
}

export function Surface({ children, ...props }: PropsWithChildren<ViewProps>) {
  return <View {...props} style={[styles.surface, props.style]}>{children}</View>;
}

export function PrimaryButton({
  children,
  disabled,
  style,
  ...props
}: PropsWithChildren<PressableProps>) {
  return (
    <Pressable
      {...props}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryButton,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
        typeof style === "function" ? style({ pressed }) : style,
      ]}
    >
      {typeof children === "string" ? <Text style={styles.primaryButtonText}>{children}</Text> : children}
    </Pressable>
  );
}

export function QuietButton({ children, ...props }: PropsWithChildren<PressableProps>) {
  return (
    <Pressable {...props} style={({ pressed }) => [styles.quietButton, pressed && styles.buttonPressed]}>
      {typeof children === "string" ? <Text style={styles.quietButtonText}>{children}</Text> : children}
    </Pressable>
  );
}

export function StatusNote({
  children,
  tone = "muted",
}: PropsWithChildren<{ tone?: "muted" | "error" | "success" }>) {
  return (
    <Text style={[styles.statusNote, tone === "error" && styles.errorText, tone === "success" && styles.successText]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.ink },
  pageContent: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 32, gap: 20 },
  brandHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  brandGroup: { flexDirection: "row", alignItems: "center", gap: 11 },
  brandMark: { width: 40, height: 40, borderRadius: 12 },
  brandName: { color: palette.text, fontSize: 11, letterSpacing: 2.1, fontWeight: "700" },
  eyebrow: { color: palette.dim, fontSize: 10, letterSpacing: 2.3, textTransform: "uppercase", fontWeight: "600" },
  heading: { color: palette.text, fontSize: 31, lineHeight: 37, letterSpacing: -0.9, fontWeight: "700" },
  body: { color: palette.muted, fontSize: 15, lineHeight: 23 },
  surface: { backgroundColor: palette.panel, borderColor: palette.border, borderWidth: 1, borderRadius: 22, padding: 19 },
  primaryButton: { minHeight: 54, paddingHorizontal: 22, paddingVertical: 15, borderRadius: 28, alignItems: "center", justifyContent: "center", backgroundColor: palette.chrome },
  primaryButtonText: { color: palette.ink, fontSize: 15, fontWeight: "700" },
  quietButton: { minHeight: 48, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 26, alignItems: "center", justifyContent: "center", borderColor: palette.border, borderWidth: 1 },
  quietButtonText: { color: palette.text, fontSize: 14, fontWeight: "600" },
  buttonDisabled: { opacity: 0.58 },
  buttonPressed: { opacity: 0.82 },
  statusNote: { color: palette.muted, fontSize: 13, lineHeight: 19 },
  errorText: { color: palette.red },
  successText: { color: palette.green },
});
