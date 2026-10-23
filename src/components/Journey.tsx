"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { ArrowDown } from "lucide-react";
import { journey, pillars } from "@/lib/data";
import { Reveal } from "./Reveal";
import { Glow, SectionLabel } from "./ui";

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
      <Glow className="right-[-10%] top-1/4 h-[600px] w-[600px]" opacity={0.08} />
      <Glow className="-left-[6%] bottom-[-8%] h-[560px] w-[560px]" opacity={0.08} />

      <div className="container-x grid gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <SectionLabel index="02" title="Education" tone="light" />
            <h2 className="mt-6 text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-silver">
              From your first idea to your{" "}
              <span className="display-serif text-chrome-gradient">next chapter</span>
            </h2>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-silver/55">
              A path you can actually follow. Each stage builds on the last, so
              momentum compounds instead of resetting.
            </p>
            <div className="mt-10 inline-flex items-center gap-3 rounded-pill border border-silver/12 bg-silver/4 px-5 py-3 text-[13px] text-silver/55">
              <ArrowDown size={15} className="text-chrome" />
              Scroll to see the path
            </div>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
              }}
              className="mt-12 border-t border-silver/8 pt-8"
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-silver/30">
                Backed by five pillars
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {pillars.map((pillar) => (
                  <motion.span
                    key={pillar.id}
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      show: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
                      },
                    }}
                    whileHover={{ y: -2 }}
                    className="inline-flex items-center gap-2 rounded-pill border border-silver/10 bg-silver/[0.03] px-3.5 py-2 text-[13px] text-silver/55 transition-colors duration-300 hover:border-chrome/35 hover:text-silver/90"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-chrome/60" />
                    {pillar.title}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </Reveal>
        </div>

        <div ref={ref} className="relative">
          {/* progress rail */}
          <div
            aria-hidden
            className="absolute left-[27px] top-4 bottom-4 w-px bg-silver/10 md:left-20"
          >
            <motion.div
              style={{ height: lineHeight }}
              className="w-px bg-gradient-to-b from-chrome via-chrome to-chrome-soft"
            />
            <motion.div
              style={{ top: glowY }}
              className="absolute -left-[3px] h-[7px] w-[7px] -translate-y-1/2 rounded-full bg-chrome shadow-[0_0_18px_4px_rgba(226,234,244,0.55)]"
            />
          </div>

          <div className="flex flex-col gap-6">
            {journey.map((step, i) => (
              <Reveal key={step.index} delay={i * 0.08}>
                <motion.div
                  whileHover={{ x: 6 }}
                  transition={{ type: "spring", stiffness: 280, damping: 24 }}
                  className="group relative ml-0 rounded-card border border-silver/8 bg-silver/[0.035] p-7 transition-colors duration-500 hover:border-chrome/35 hover:bg-silver/[0.06] sm:p-8 md:ml-20"
                >
                  <div className="flex items-start gap-5">
                    <span className="mt-0.5 flex h-14 w-14 shrink-0 items-center justify-center rounded-tile border border-silver/10 bg-ink font-mono text-[15px] text-chrome transition-all duration-500 group-hover:border-chrome group-hover:bg-chrome group-hover:text-ink md:absolute md:-left-7 md:top-8 md:mt-0">
                      {step.index}
                    </span>
                    <div className="md:pl-14">
                      <h3 className="text-[23px] font-semibold tracking-[-0.03em] text-silver">
                        {step.title}
                      </h3>
                      <p className="mt-2.5 text-[15.5px] leading-relaxed text-silver/55">
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
