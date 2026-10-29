"use client";

import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import { forYou, notForYou } from "@/lib/data";
import { Reveal, Stagger, StaggerItem } from "./Reveal";
import { SectionLabel } from "./ui";

export function Philosophy() {
  return (
    <section id="why" className="light-section relative bg-silver-2 py-24 text-ink lg:py-32">
      <div className="container-x">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal className="flex justify-center">
            <SectionLabel index="03" title="Why we built it" tone="light" />
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="mt-6 text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-[1.03] tracking-[-0.04em]">
              You can build your own path
              <br />
              <span className="display-serif">without walking it alone</span>
            </h2>
          </Reveal>
          <Reveal delay={0.14}>
            <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-ink/58">
              Level Up Society is about growing in business and in life. Bring
              your ideas, your ambitions and the challenges you&apos;re working
              through. Surround yourself with people who value learning,
              meaningful connections and steady progress — not overnight success.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-card border border-ink/8 bg-white p-8 sm:p-10">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-silver">
                  <Check size={17} strokeWidth={2.6} />
                </span>
                <h3 className="text-[13px] font-bold tracking-[0.16em] uppercase">
                  This is for you if
                </h3>
              </div>
              <Stagger className="mt-7 flex flex-col gap-4">
                {forYou.map((item) => (
                  <StaggerItem key={item}>
                    <div className="flex items-start gap-3.5">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-chrome" />
                      <p className="text-[15.5px] leading-relaxed text-ink/70">
                        {item}
                      </p>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="h-full rounded-card border border-ink/8 bg-ink p-8 text-silver sm:p-10"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-silver/10 text-silver/60">
                  <X size={17} strokeWidth={2.6} />
                </span>
                <h3 className="text-[13px] font-bold tracking-[0.16em] uppercase text-silver/70">
                  This isn&apos;t for you if
                </h3>
              </div>
              <Stagger className="mt-7 flex flex-col gap-4" delay={0.1}>
                {notForYou.map((item) => (
                  <StaggerItem key={item}>
                    <div className="flex items-start gap-3.5">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-silver/25" />
                      <p className="text-[15.5px] leading-relaxed text-silver/60">
                        {item}
                      </p>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            </motion.div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
