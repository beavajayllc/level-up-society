"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView } from "motion/react";
import { Check, Sparkles } from "lucide-react";
import { membershipFeatures } from "@/lib/data";
import { Reveal, Stagger, StaggerItem } from "./Reveal";
import { SectionLabel } from "./ui";
import { PillButton } from "./ui";

function CountUp({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, target, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setValue(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, target]);

  return <span ref={ref}>{value}</span>;
}

export function Pricing() {
  return (
    <section id="memberships" className="relative overflow-hidden bg-ink py-24 lg:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[760px] w-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-[160px]" />
      </div>

      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal className="flex justify-center">
            <SectionLabel index="04" title="Memberships" />
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="mt-6 text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-[1.03] tracking-[-0.04em] text-cream">
              Find your place
              <br />
              <span className="display-serif text-gold">in the Society</span>
            </h2>
          </Reveal>
          <Reveal delay={0.14}>
            <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-cream/55">
              One membership, everything included — the education, the training
              and the people that help you build a business and a life you love.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -8 }}
            className="relative mx-auto mt-16 max-w-3xl"
          >
            <div
              aria-hidden
              className="absolute -inset-3 -z-10 rounded-[3.25rem] bg-gradient-to-br from-gold/25 via-transparent to-gold/10 blur-2xl"
            />

            <div className="overflow-hidden rounded-card-lg border border-gold/25 bg-gradient-to-b from-ink-2 to-ink">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cream/8 px-8 py-6 sm:px-12">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-tile bg-gold/15 text-gold">
                    <Sparkles size={19} />
                  </span>
                  <div>
                    <p className="text-lg font-semibold tracking-[-0.02em] text-cream">
                      Level Up Pro
                    </p>
                    <p className="text-[13px] text-cream/45">
                      The complete membership
                    </p>
                  </div>
                </div>
                <span className="rounded-pill border border-gold/30 bg-gold/10 px-4 py-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-gold">
                  Opening soon
                </span>
              </div>

              <div className="grid gap-10 px-8 py-10 sm:px-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
                <div>
                  <div className="flex items-end gap-2">
                    <span className="text-[64px] font-semibold leading-none tracking-[-0.05em] text-cream">
                      $<CountUp target={97} />
                    </span>
                    <span className="pb-2 text-lg text-cream/45">/mo</span>
                  </div>
                  <p className="mt-4 text-[15px] leading-relaxed text-cream/50">
                    Business education and personal growth, community access,
                    credit repair and business funding support, plus live
                    sessions and entrepreneur calls.
                  </p>
                  <div className="mt-8">
                    <PillButton href="#waitlist" size="lg" className="w-full">
                      Join the waitlist
                    </PillButton>
                    <p className="mt-4 text-center text-[12.5px] text-cream/35">
                      Renews monthly · Cancel any time
                    </p>
                  </div>

                  <div className="mt-10 flex items-center gap-4 border-t border-cream/8 pt-8">
                    <div className="flex -space-x-2.5">
                      {["MA", "JR", "TC", "DK"].map((initials, i) => (
                        <span
                          key={initials}
                          className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink text-[11px] font-bold text-ink ring-2 ring-ink ${
                            ["bg-gold", "bg-gold-soft", "bg-cream", "bg-gold-deep"][i]
                          }`}
                        >
                          {initials}
                        </span>
                      ))}
                    </div>
                    <p className="text-[13px] leading-snug text-cream/45">
                      Join{" "}
                      <span className="font-semibold text-cream">1,240+</span>{" "}
                      entrepreneurs already inside
                    </p>
                  </div>
                </div>

                <Stagger className="flex flex-col gap-3.5">
                  {membershipFeatures.map((feature) => (
                    <StaggerItem key={feature}>
                      <div className="flex items-start gap-3.5 rounded-2xl border border-cream/8 bg-cream/[0.035] px-5 py-4 transition-colors duration-400 hover:border-gold/25 hover:bg-cream/[0.06]">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/18">
                          <Check size={11} className="text-gold" strokeWidth={3} />
                        </span>
                        <p className="text-[14.5px] leading-snug text-cream/72">
                          {feature}
                        </p>
                      </div>
                    </StaggerItem>
                  ))}
                </Stagger>
              </div>
            </div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}
