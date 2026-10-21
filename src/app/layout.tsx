import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://level-up-society-nu.vercel.app"),
  title: "Level Up Society — Where Entrepreneurs Grow and Live",
  description:
    "A paid community for entrepreneurs. Business education, skills training, credit repair and funding, personal growth, and the people who keep you moving. $97/month.",
  keywords: [
    "entrepreneur community",
    "credit repair",
    "business education",
    "business funding",
    "Level Up Society",
  ],
  openGraph: {
    title: "Level Up Society — Where Entrepreneurs Grow and Live",
    description:
      "Business education, credit repair & funding, personal growth, and a community of entrepreneurs building real businesses.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Level Up Society" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Level Up Society — Where Entrepreneurs Grow and Live",
    description:
      "Business education, credit repair & funding, personal growth, and a community of entrepreneurs building real businesses.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ink text-silver">{children}</body>
    </html>
  );
}
