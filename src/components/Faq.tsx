"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { faqs } from "@/lib/data";
import { Reveal } from "./Reveal";
import { SectionLabel } from "./ui";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="light-section relative bg-silver py-24 text-ink lg:py-32">
      <div className="container-x grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <SectionLabel index="05" title="Questions" tone="light" />
            <h2 className="mt-6 text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.03] tracking-[-0.04em]">
              Frequently
              <br />
              <span className="display-serif">asked</span>
            </h2>
            <p className="mt-6 max-w-sm text-[16px] leading-relaxed text-ink/70">
              Still deciding? Grab a free pass to the newsletter and see what
              the community is about first.
            </p>
          </Reveal>
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={faq.q} delay={i * 0.05}>
                <div
                  className={`overflow-hidden rounded-card border transition-colors duration-500 ${
                    isOpen
                      ? "border-ink/12 bg-white"
                      : "border-ink/8 bg-white/55 hover:border-ink/14"
                  }`}
                >
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-6 px-7 py-6 text-left sm:px-9"
                  >
                    <span className="text-[16.5px] font-semibold tracking-[-0.02em] sm:text-[18px]">
                      {faq.q}
                    </span>
                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
                        isOpen ? "bg-ink text-silver" : "bg-ink/8 text-ink/60"
                      }`}
                    >
                      <Plus size={16} />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <p className="px-7 pb-7 text-[15.5px] leading-relaxed text-ink/60 sm:px-9 sm:pr-16">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
