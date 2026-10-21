"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import { Reveal } from "./Reveal";

export function CallToAction() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <section id="waitlist" className="relative overflow-hidden bg-ink py-24 lg:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[560px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-chrome/12 blur-[150px]" />
        <div className="grain-layer absolute inset-0 opacity-[0.04] mix-blend-overlay" />
      </div>

      <div className="container-x">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-pill border border-silver/12 bg-silver/5 px-4 py-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-silver/60">
              Not ready to join yet?
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="mt-7 text-[clamp(2.25rem,5.5vw,4rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-silver">
              Get <span className="display-serif text-chrome-gradient">free access</span>
            </h2>
          </Reveal>
          <Reveal delay={0.14}>
            <p className="mx-auto mt-5 max-w-lg text-[17px] leading-relaxed text-silver/55">
              Entrepreneurship inspiration, a look inside the community, and
              updates on the launch. No spam — just the good stuff.
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email.trim()) setSent(true);
              }}
              className="mx-auto mt-10 max-w-xl"
            >
              <div className="flex flex-col gap-3 rounded-card border border-silver/10 bg-silver/[0.04] p-3 backdrop-blur sm:flex-row sm:rounded-pill sm:p-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setSent(false);
                  }}
                  placeholder="you@email.com"
                  className="h-12 flex-1 rounded-pill bg-transparent px-5 text-[15px] text-silver placeholder:text-silver/30 outline-none"
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 420, damping: 24 }}
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-pill bg-chrome px-7 text-[15px] font-medium text-ink transition-colors duration-300 hover:bg-chrome-soft"
                >
                  {sent ? (
                    <>
                      You&apos;re on the list
                      <Check size={16} strokeWidth={3} />
                    </>
                  ) : (
                    <>
                      Get Free Access
                      <ArrowRight
                        size={16}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </>
                  )}
                </motion.button>
              </div>
              <p className="mt-4 text-[12.5px] text-silver/32">
                No credit card required. Unsubscribe anytime.
              </p>
            </form>
          </Reveal>

          <Reveal delay={0.28}>
            <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[13.5px] text-silver/40">
              {[
                "Entrepreneurship inspiration",
                "A look inside the community",
                "Updates and launch news",
              ].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-chrome/70" />
                  {item}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
