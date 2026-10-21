"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { ArrowDown } from "lucide-react";
import { journey } from "@/lib/data";
import { Reveal } from "./Reveal";
import { SectionLabel } from "./ui";

export function Journey() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 75%", "end 60%"],
  });
  const lineHeight = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 26,
    restDelta: 0.001,
  });
  const glowY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="education" className="relative overflow-x-clip bg-ink py-24 lg:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-1/4 h-[600px] w-[600px] rounded-full bg-gold/8 blur-[150px]"
      />

      <div className="container-x grid gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <SectionLabel index="02" title="Education" />
            <h2 className="mt-6 text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-cream">
              From your first idea to your{" "}
              <span className="display-serif text-gold">next chapter</span>
            </h2>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-cream/55">
              A path you can actually follow. Each stage builds on the last, so
              momentum compounds instead of resetting.
            </p>
            <div className="mt-10 inline-flex items-center gap-3 rounded-pill border border-cream/12 bg-cream/4 px-5 py-3 text-[13px] text-cream/55">
              <ArrowDown size={15} className="text-gold" />
              Scroll to see the path
            </div>
          </Reveal>
        </div>

        <div ref={ref} className="relative">
          {/* progress rail */}
          <div
            aria-hidden
            className="absolute left-[27px] top-4 bottom-4 w-px bg-cream/10 md:left-20"
          >
            <motion.div
              style={{ height: lineHeight }}
              className="w-px bg-gradient-to-b from-gold via-gold to-gold-soft"
            />
            <motion.div
              style={{ top: glowY }}
              className="absolute -left-[3px] h-[7px] w-[7px] -translate-y-1/2 rounded-full bg-gold shadow-[0_0_18px_4px_rgba(247,197,72,0.6)]"
            />
          </div>

          <div className="flex flex-col gap-6">
            {journey.map((step, i) => (
              <Reveal key={step.index} delay={i * 0.08}>
                <motion.div
                  whileHover={{ x: 6 }}
                  transition={{ type: "spring", stiffness: 280, damping: 24 }}
                  className="group relative ml-0 rounded-card border border-cream/8 bg-cream/[0.035] p-7 transition-colors duration-500 hover:border-gold/35 hover:bg-cream/[0.06] sm:p-8 md:ml-20"
                >
                  <div className="flex items-start gap-5">
                    <span className="mt-0.5 flex h-14 w-14 shrink-0 items-center justify-center rounded-tile border border-cream/10 bg-ink font-mono text-[15px] text-gold transition-all duration-500 group-hover:border-gold group-hover:bg-gold group-hover:text-ink md:absolute md:-left-7 md:top-8 md:mt-0">
                      {step.index}
                    </span>
                    <div className="md:pl-14">
                      <h3 className="text-[23px] font-semibold tracking-[-0.03em] text-cream">
                        {step.title}
                      </h3>
                      <p className="mt-2.5 text-[15.5px] leading-relaxed text-cream/55">
                        {step.body}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
