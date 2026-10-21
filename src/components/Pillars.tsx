"use client";

import Image from "next/image";
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
    <section id="platform" className="relative bg-silver py-24 text-ink lg:py-32">
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
              One membership, no piecemeal purchases. Education, real-world
              skills, funding and credit support, and a room full of people who
              get it — all in one place.
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
                  className="group relative flex h-full flex-col overflow-hidden rounded-card border border-ink/8 bg-white/85 backdrop-blur transition-colors duration-500 hover:border-ink/15"
                >
                  <div
                    aria-hidden
                    className="relative h-[176px] w-full overflow-hidden"
                  >
                    <Image
                      src={pillar.image}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 620px"
                      className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.07]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/20 to-ink/15" />
                  </div>

                  <div className="relative flex flex-1 flex-col px-7 pb-7 pt-14 sm:px-8 sm:pb-8">
                    <span className="absolute -top-7 left-7 flex h-14 w-14 items-center justify-center rounded-tile bg-ink/90 text-silver shadow-[0_14px_34px_-14px_rgba(8,9,11,0.7)] backdrop-blur-sm transition-transform duration-500 group-hover:-translate-y-1 sm:left-8">
                      <Icon size={22} strokeWidth={1.8} />
                    </span>
                    <span className="absolute right-7 top-4 rounded-full bg-white/70 px-2.5 py-1 font-mono text-[12px] text-ink/60 backdrop-blur-sm sm:right-8">
                      {pillar.index}
                    </span>

                    <h3 className="text-[22px] font-semibold tracking-[-0.025em]">
                      {pillar.title}
                    </h3>
                    <p className="mt-3 flex-1 text-[15px] leading-relaxed text-ink/58">
                      {pillar.body}
                    </p>

                    <span className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink/40 transition-colors duration-300 group-hover:text-ink">
                      Learn more
                      <ArrowUpRight
                        size={14}
                        className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </span>
                  </div>
                </motion.article>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
