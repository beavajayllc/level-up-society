"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "motion/react";
import { ArrowUpRight, Check, Sparkles } from "lucide-react";
import { heroChips } from "@/lib/data";
import { checkoutHref } from "@/lib/checkout";
import { CrestMark, Glow, PillButton, SectionLabel } from "./ui";
import { Testimony } from "./Testimony";

const headline: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.075, delayChildren: 0.15 } },
};

const line: Variants = {
  hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
  },
};


export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const orbY = useTransform(scrollYProgress, [0, 1], ["0%", "26%"]);
  const cardY = useTransform(scrollYProgress, [0, 1], ["0%", "-14%"]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <section
      id="top"
      ref={ref}
      className="grain relative isolate overflow-hidden bg-ink pt-[74px]"
    >
      {/* ambient light */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <Image
          src="/brand/lus-mark-hero.webp"
          alt=""
          width={900}
          height={405}
          quality={50}
          sizes="620px"
          style={{ width: 620, height: "auto" }}
          className="absolute -right-[10%] top-[4%] opacity-[0.06]"
        />
        <Glow className="left-1/2 top-[-18%] h-[720px] w-[1100px] -translate-x-1/2" opacity={0.12} />
        <div
          className="absolute -left-40 top-[18%] h-[520px] w-[520px]"
          style={reduce ? undefined : { animation: "drift 18s ease-in-out infinite" }}
        >
          <Glow className="inset-0" rgb="153, 162, 175" opacity={0.1} />
        </div>
        <div
          className="absolute -right-32 bottom-[6%] h-[560px] w-[560px]"
          style={reduce ? undefined : { animation: "drift 22s ease-in-out infinite reverse" }}
        >
          <Glow className="inset-0" rgb="29, 39, 51" opacity={0.08} />
        </div>
        <div className="grain-layer absolute inset-0 opacity-[0.05] mix-blend-overlay" />
      </div>

      <div className="container-x relative grid items-center gap-16 pb-24 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-32 lg:pt-24">
        {/* Copy */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="flex items-center gap-4"
          >
            <CrestMark />
            <span className="inline-flex items-center gap-2 rounded-pill border border-crest-blue/25 bg-crest-blue/5 px-4 py-2 text-[12px] font-medium tracking-[0.14em] uppercase text-crest-blue">
              <Sparkles size={13} />
              Now Enrolling
            </span>
          </motion.div>

          <motion.h1
            variants={headline}
            initial="hidden"
            animate="show"
            className="mt-7 text-[clamp(2.75rem,7.4vw,5.5rem)] font-semibold leading-[0.94] tracking-[-0.045em] text-silver"
          >
            <motion.span variants={line} className="block">
              Where
            </motion.span>
            <motion.span variants={line} className="block">
              <span className="display-serif text-chrome-gradient">Entrepreneurs</span>
            </motion.span>
            <motion.span variants={line} className="block">
              Grow and <span className="display-serif text-silver">Live</span>
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 max-w-xl text-[17px] leading-relaxed text-silver/62"
          >
            Build your business. Grow as a person. Surround yourself with
            entrepreneurs who are creating a life they love — just like you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.62, ease: [0.16, 1, 0.3, 1] }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <PillButton href={checkoutHref()} size="lg">
              Join Level Up Pro — $97/mo
              <ArrowUpRight size={17} />
            </PillButton>
            <PillButton href="#memberships" size="lg" variant="outline">
              Explore Memberships
            </PillButton>
          </motion.div>

          <motion.ul
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.07, delayChildren: 0.85 } },
            }}
            className="mt-11 flex flex-wrap items-center gap-x-6 gap-y-3"
          >
            {heroChips.map((chip) => (
              <motion.li
                key={chip}
                variants={line}
                className="inline-flex items-center gap-2 text-[13.5px] text-silver/70"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-crest-blue/10">
                  <Check size={11} className="text-crest-blue" strokeWidth={3} />
                </span>
                {chip}
              </motion.li>
            ))}
          </motion.ul>
        </div>

        {/* Floating preview stack */}
        <motion.div
          style={reduce ? undefined : { y: cardY, opacity: fade }}
          className="relative mx-auto w-full max-w-md lg:max-w-none"
        >
          <motion.div
            initial={{ opacity: 0, y: 46, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div
              aria-hidden
              className="absolute -inset-6 -z-10 rounded-[3rem] bg-chrome/10 blur-3xl"
            />

            {/* Main card */}
            <div className="rounded-card-lg border border-crest-gold/25 bg-gradient-to-b from-ink-2 to-ink p-6 shadow-[0_40px_100px_-30px_rgba(16,49,90,0.22)] sm:p-8">
              <div className="flex items-center justify-between">
                <SectionLabel index="LIVE" title="Inside the society" tone="light" />
                <span className="flex items-center gap-2 rounded-pill bg-emerald-400/10 px-3 py-1.5 text-[11px] font-medium text-emerald-800">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  128 online
                </span>
              </div>

              <Testimony />

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-card border border-silver/8 bg-silver/4 p-5">
                  <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-silver/70">
                    Next live
                  </p>
                  <p className="mt-2 text-[15px] font-semibold text-silver">
                    Credit Mastery
                  </p>
                  <p className="mt-1 text-xs text-chrome/80">Thursday · 8PM</p>
                </div>
                <div className="rounded-card border border-silver/8 bg-silver/4 p-5">
                  <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-silver/70">
                    Members
                  </p>
                  <p className="mt-2 text-[15px] font-semibold text-silver">
                    1,240+
                  </p>
                  <p className="mt-1 text-xs text-silver/70">and growing</p>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <motion.div
              animate={reduce ? undefined : { y: [0, -12, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-7 -right-7 rounded-card border border-silver/10 bg-ink-2/95 px-4 py-3 shadow-xl sm:-right-6"
            >
              <p className="text-[11px] text-silver/70">Business funding</p>
              <p className="text-sm font-semibold text-chrome">+ $250K approved</p>
            </motion.div>

            <motion.div
              animate={reduce ? undefined : { y: [0, 14, 0] }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.6,
              }}
              className="absolute -bottom-7 -left-7 rounded-card border border-silver/10 bg-ink-2/95 px-4 py-3 shadow-xl sm:-left-7"
            >
              <p className="text-[11px] text-silver/70">This month</p>
              <p className="text-sm font-semibold text-silver">
                14 wins shared
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Marquee strip */}
      <motion.div
        style={reduce ? undefined : { y: orbY }}
        className="relative border-y border-crest-blue/15 bg-crest-blue/[0.035] py-4"
      >
        <div className="flex overflow-hidden">
          <div className="flex shrink-0 animate-marquee items-center gap-10 pr-10">
            {[...heroChips, ...heroChips].map((chip, i) => (
              <span
                key={`${chip}-${i}`}
                className="flex shrink-0 items-center gap-10 text-sm font-medium tracking-[-0.01em] text-silver/70"
              >
                {chip}
                <span className="h-1 w-1 rounded-full bg-chrome/60" />
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
