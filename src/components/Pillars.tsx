"use client";

import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { pillars } from "@/lib/data";
import { Reveal, Stagger, StaggerItem } from "./Reveal";
import { SectionLabel } from "./ui";

const spans = [
  "lg:col-span-3",
  "lg:col-span-3",
  "lg:col-span-2",
  "lg:col-span-2",
  "lg:col-span-2",
];

export function Pillars() {
  return (
    <section id="platform" className="relative bg-cream py-24 text-ink lg:py-32">
      <div className="container-x">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-end">
          <Reveal>
            <SectionLabel index="01" title="The experience" tone="light" />
            <h2 className="mt-6 text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.04em]">
              Everything you need to{" "}
              <span className="display-serif">actually level up</span>
            </h2>
          </Reveal>
          <Reveal delay={0.12} className="lg:pb-3 lg:pl-8">
            <p className="max-w-md text-[17px] leading-relaxed text-ink/60">
              One membership, no piecemeal purchases. Education, training,
              credit and funding support, and a room full of people who get it
              — all in one place.
            </p>
          </Reveal>
        </div>

        <Stagger className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {pillars.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <StaggerItem
                key={pillar.id}
                className={`sm:col-span-1 ${spans[i]}`}
              >
                <motion.article
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className="group relative flex h-full flex-col overflow-hidden rounded-card border border-ink/8 bg-white/70 p-7 backdrop-blur transition-colors duration-500 hover:border-ink/15 sm:p-8"
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gold/0 blur-3xl transition-all duration-700 group-hover:bg-gold/45"
                  />

                  <div className="relative flex items-start justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-tile bg-ink text-cream transition-transform duration-500 group-hover:scale-105 group-hover:bg-gold group-hover:text-ink">
                      <Icon size={21} strokeWidth={1.8} />
                    </span>
                    <span className="font-mono text-[13px] text-ink/25">
                      {pillar.index}
                    </span>
                  </div>

                  <h3 className="relative mt-7 text-[22px] font-semibold tracking-[-0.025em]">
                    {pillar.title}
                  </h3>
                  <p className="relative mt-3 flex-1 text-[15px] leading-relaxed text-ink/58">
                    {pillar.body}
                  </p>

                  <span className="relative mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink/40 transition-colors duration-300 group-hover:text-ink">
                    Learn more
                    <ArrowUpRight
                      size={14}
                      className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </span>
                </motion.article>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
