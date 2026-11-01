import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Download } from "lucide-react";
import { AccessNotice } from "@/components/AccessNotice";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { Reveal } from "@/components/Reveal";
import { Glow, SectionLabel } from "@/components/ui";
import { isAuthConfigured, isLusAuthConfigured } from "@/lib/env";
import { requireMember } from "@/lib/member-access";

export const instant = false;

export const metadata: Metadata = {
  title: "AI Automation — Level Up Society",
  description: "Get to know KEB OS and download it for your computer.",
  robots: { index: false, follow: false },
};

const downloads = [
  {
    platform: "Mac",
    options: [
      { label: "Apple Silicon", href: "https://keb-os.com/api/download/mac?arch=arm64&source=download_page_mac_arm64" },
      { label: "Intel", href: "https://keb-os.com/api/download/mac?arch=x64&source=download_page_mac_x64" },
    ],
    help: "Open the Apple menu → About This Mac to see which chip your Mac uses.",
  },
  {
    platform: "Windows",
    options: [
      { label: "x64", href: "https://keb-os.com/api/download/windows?arch=x64&source=download_page_windows_x64" },
      { label: "ARM64", href: "https://keb-os.com/api/download/windows?arch=arm64&source=download_page_windows_arm64" },
    ],
    help: "Open Settings → System → About to check your system type. Windows 10 or later is required.",
  },
];

export default async function AiAutomationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  if (error) return <AccessNotice reason={error} />;
  if (!isAuthConfigured() || !isLusAuthConfigured()) {
    return <AccessNotice reason="not_configured" />;
  }

  await requireMember("/members/ai-automation");

  return (
    <>
      <Nav memberArea />
      <main className="relative flex-1 overflow-hidden bg-ink">
        <Glow className="right-[-10%] top-[-8%] h-[520px] w-[520px]" opacity={0.08} />
        <div className="container-x relative py-16 lg:py-20">
          <Link href="/members" className="inline-flex items-center gap-2 text-[13px] text-silver/70 transition-colors hover:text-chrome">
            <ArrowLeft size={14} /> Back to the members area
          </Link>

          <Reveal>
            <SectionLabel index="12" title="AI Automation" tone="light" />
            <h1 className="mt-6 text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-[1.04] tracking-[-0.04em] text-silver">
              Welcome to <span className="display-serif text-chrome-gradient">KEB OS.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-silver/70">
              Get to know KEB OS, then choose the download that fits your computer.
            </p>
          </Reveal>

          <div className="mx-auto mt-10 w-full max-w-4xl overflow-hidden rounded-card border border-silver/10 bg-black">
            <video
              aria-label="Introduction to KEB OS"
              autoPlay
              className="aspect-video w-full"
              controls
              playsInline
              preload="metadata"
            >
              <source src="/media/keb-os-explainer.mp4" type="video/mp4" />
              Your browser does not support video playback.
            </video>
          </div>
          <p className="mx-auto mt-3 max-w-4xl text-[13px] text-silver/60">If the video doesn’t start automatically, press play.</p>

          <section className="mt-14" aria-labelledby="download-title">
            <h2 id="download-title" className="text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-[-0.03em] text-silver">
              Download KEB OS
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-silver/70">
              Choose your computer and processor below to download the right version.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {downloads.map(({ platform, options, help }) => (
                <div key={platform} className="rounded-card border border-accent/15 bg-silver/[0.035] p-7">
                  <h3 className="text-xl font-semibold text-silver">{platform}</h3>
                  <p className="mt-3 min-h-[3rem] text-[14px] leading-relaxed text-silver/70">{help}</p>
                  <div className="mt-5 grid gap-2">
                    {options.map(({ label, href }) => (
                      <a key={label} href={href} className="flex items-center justify-between gap-4 rounded-tile border border-silver/10 bg-ink px-4 py-4 text-[14px] font-medium text-silver transition-colors hover:border-accent/40 hover:text-chrome">
                        <span className="inline-flex items-center gap-2"><Download size={16} /> {platform} · {label}</span>
                        <ArrowUpRight size={16} aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
