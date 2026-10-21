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
    "bg-[linear-gradient(180deg,#ffffff_0%,#e7ecf3_46%,#c2cad5_100%)] text-ink hover:brightness-[1.06] shadow-[0_14px_44px_-14px_rgba(214,226,240,0.75)]",
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
        tone === "dark" ? "text-ink/45" : "text-chrome/85"
      }`}
    >
      <span className="h-px w-8 bg-current opacity-60" />
      <span>{index}</span>
      <span className="opacity-45">/</span>
      <span>{title}</span>
    </div>
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
      width={2225}
      height={992}
      priority={priority}
      style={{ height, width: "auto" }}
      className={`drop-shadow-[0_5px_16px_rgba(0,0,0,0.65)] ${className}`}
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
      width={2225}
      height={1150}
      style={{ width, height: "auto" }}
      className={`drop-shadow-[0_6px_20px_rgba(0,0,0,0.7)] ${className}`}
    />
  );
}
