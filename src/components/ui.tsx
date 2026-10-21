"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { ReactNode } from "react";

type Variant = "gold" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-6 text-sm",
  lg: "h-14 px-8 text-[15px]",
};

const variants: Record<Variant, string> = {
  gold: "bg-gold text-ink hover:bg-gold-soft shadow-[0_10px_40px_-12px_rgba(247,197,72,0.75)]",
  ghost: "bg-cream/8 text-cream hover:bg-cream/14 backdrop-blur",
  outline:
    "border border-cream/15 text-cream hover:border-gold/60 hover:text-gold hover:bg-gold/5",
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
  variant = "gold",
  size = "md",
  className = "",
  onClick,
}: ButtonProps) {
  const classes = `group relative inline-flex items-center justify-center gap-2 rounded-pill font-medium tracking-[-0.01em] transition-colors duration-300 overflow-hidden ${sizes[size]} ${variants[variant]} ${className}`;

  const inner = (
    <>
      {variant === "gold" && (
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
        tone === "dark" ? "text-ink/45" : "text-gold/85"
      }`}
    >
      <span className="h-px w-8 bg-current opacity-60" />
      <span>{index}</span>
      <span className="opacity-45">/</span>
      <span>{title}</span>
    </div>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex flex-col leading-none ${className}`}>
      <span className="text-[15px] font-bold tracking-[-0.02em] text-cream">
        LEVEL UP
      </span>
      <span className="text-[15px] font-bold tracking-[-0.02em] text-gold">
        SOCIETY.
      </span>
    </span>
  );
}
