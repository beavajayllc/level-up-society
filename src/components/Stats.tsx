"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "motion/react";
import { socialProof } from "@/lib/data";
import { Stagger, StaggerItem } from "./Reveal";

function StatValue({ value, suffix }: { value: string; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const numeric = Number(value);
  const counts = !Number.isNaN(numeric);
  const [display, setDisplay] = useState(counts ? "0" : value);

  useEffect(() => {
    if (!inView || !counts) return;
    const controls = animate(0, numeric, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(String(Math.round(latest))),
    });
    return () => controls.stop();
  }, [inView, numeric, counts]);

  return (
    <span ref={ref}>
      {counts ? display : value}
      {suffix}
    </span>
  );
}

export function Stats() {
  return (
    <section className="relative border-t border-silver/8 bg-ink-2 py-16">
      <Stagger className="container-x grid grid-cols-2 gap-10 lg:grid-cols-4">
        {socialProof.map((stat) => (
          <StaggerItem key={stat.label} className="text-center lg:text-left">
            <p className="text-[38px] font-semibold leading-none tracking-[-0.045em] text-silver sm:text-[46px]">
              <StatValue value={stat.value} suffix={stat.suffix} />
            </p>
            <p className="mt-2.5 text-[13px] tracking-[0.06em] text-silver/38">
              {stat.label}
            </p>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
