import type { Metadata } from "next";
import { LusAuthPage } from "@/components/LusAuthPage";
import { isLusAuthConfigured } from "@/lib/env";

export const instant = false;

export const metadata: Metadata = {
  title: "Reset your password — Level Up Society",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <LusAuthPage
      mode="forgot-password"
      nextPath="/members"
      authAvailable={isLusAuthConfigured()}
    />
  );
}
