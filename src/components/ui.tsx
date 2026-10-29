"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
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
    "bg-[#4c2f6f] text-white hover:brightness-[1.12] shadow-[0_12px_30px_-16px_rgba(13,11,51,0.32)]",
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
      <span className="h-[2px] w-8 bg-accent" />
      <span className="text-accent">{index}</span>
      <span className="opacity-45">/</span>
      <span>{title}</span>
    </div>
  );
}

/** The complete logo for the navigation, tinted to match the site palette. */
export function LogoMark({
  className = "",
  height = 58,
  priority = false,
}: {
  className?: string;
  height?: number;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/lus-lockup.png"
      alt="Level Up Society"
      width={620}
      height={320}
      sizes="120px"
      priority={priority}
      style={{ height, width: "auto" }}
      className={`brand-logo ${className}`}
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
      className={`brand-logo ${className}`}
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
  rgb = "194, 102, 167",
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
