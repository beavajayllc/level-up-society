"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { Crown } from "lucide-react";
import type { ReactNode } from "react";

type Variant = "chrome" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-6 text-sm",
  lg: "h-14 px-8 text-[15px]",
};

const variants: Record<Variant, string> = {
  chrome:
    "bg-[#10477f] text-white hover:brightness-[1.12] shadow-[0_14px_36px_-16px_rgba(16,49,90,0.35)]",
  ghost: "bg-silver/8 text-silver hover:bg-silver/14 backdrop-blur",
  outline:
    "border border-silver/18 text-silver hover:border-chrome/60 hover:text-chrome hover:bg-chrome/5",
};

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  onClick?: () => void;
};

export function PillButton({
  children,
  href,
  variant = "chrome",
  size = "md",
  className = "",
  onClick,
}: ButtonProps) {
  const classes = `group relative inline-flex items-center justify-center gap-2 rounded-pill font-medium tracking-[-0.01em] transition-colors duration-300 overflow-hidden ${sizes[size]} ${variants[variant]} ${className}`;

  const inner = (
    <>
      {variant === "chrome" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent transition-transform duration-700 group-hover:translate-x-full"
        />
      )}
      <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
        {children}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} onClick={onClick}>
        {inner}
      </Link>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      className={classes}
      onClick={onClick}
    >
      {inner}
    </motion.button>
  );
}

export function SectionLabel({
  index,
  title,
  tone = "dark",
}: {
  index: string;
  title: string;
  tone?: "dark" | "light";
}) {
  return (
    <div
      className={`inline-flex items-center gap-3 text-[11px] font-semibold tracking-[0.22em] uppercase ${
        tone === "dark" ? "text-ink/70" : "text-chrome/85"
      }`}
    >
      <span className="h-px w-8 bg-crest-gold opacity-80" />
      <span>{index}</span>
      <span className="opacity-45">/</span>
      <span>{title}</span>
    </div>
  );
}

/** A small crest-inspired frame for the existing Level Up mark. */
export function CrestMark() {
  return (
    <span aria-hidden="true" className="relative inline-flex h-[62px] w-[56px] shrink-0 items-end justify-center">
      <Crown size={19} strokeWidth={1.7} className="absolute left-1/2 top-0 -translate-x-1/2 text-crest-gold" />
      <span className="relative flex h-[46px] w-[46px] items-center justify-center overflow-hidden rounded-full border-2 border-crest-gold bg-[#10315a] ring-2 ring-white">
        <span className="absolute inset-x-[-8px] top-1/2 h-[7px] -rotate-[24deg] bg-crest-blue/70" />
        <Image src="/brand/lus-mark.png" alt="" width={560} height={250} sizes="34px" className="relative h-auto w-[34px]" />
      </span>
    </span>
  );
}

/** The chrome LS mark — used in the nav and as a brand accent. */
export function LogoMark({
  className = "",
  height = 34,
  priority = false,
}: {
  className?: string;
  height?: number;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/lus-mark.png"
      alt="Level Up Society"
      width={560}
      height={250}
      sizes="120px"
      priority={priority}
      style={{ height, width: "auto" }}
      className={`rounded-lg bg-[#10315a] px-2 py-1 ${className}`}
    />
  );
}

/** Full lockup — mark plus the LEVEL UP SOCIETY wordmark. */
export function LogoLockup({
  className = "",
  width = 172,
}: {
  className?: string;
  width?: number;
}) {
  return (
    <Image
      src="/brand/lus-lockup.png"
      alt="Level Up Society"
      width={620}
      height={320}
      sizes="200px"
      style={{ width, height: "auto" }}
      className={`rounded-2xl bg-[#10315a] p-3 ${className}`}
    />
  );
}

/**
 * A soft ambient light blob.
 *
 * The site used to render these as a solid circle with a `blur(150px)` filter.
 * A Gaussian blur that wide is one of the most expensive things a browser can
 * paint — it re-rasterises a huge layer on every scroll frame, and the site
 * has a dozen of them. A radial gradient with a Gaussian-ish falloff looks
 * the same and costs nothing, because it is painted straight into the layer.
 */
export function Glow({
  className = "",
  rgb = "22, 83, 156",
  opacity = 0.12,
  fade = 74,
}: {
  className?: string;
  rgb?: string;
  opacity?: number;
  fade?: number;
}) {
  const core = fade * 0.3;
  const mid = fade * 0.62;
  const background = `radial-gradient(circle at 50% 50%, rgba(${rgb}, ${opacity}) 0%, rgba(${rgb}, ${opacity}) ${core}%, rgba(${rgb}, ${opacity * 0.45}) ${mid}%, rgba(${rgb}, 0) ${fade}%)`;

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute rounded-full ${className}`}
      style={{ background }}
    />
  );
}
