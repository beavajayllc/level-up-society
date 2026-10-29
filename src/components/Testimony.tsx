"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { testimonies } from "@/lib/data";

const ROTATE_MS = 6000;

export function Testimony() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback((next: number) => {
    setIndex((next + testimonies.length) % testimonies.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % testimonies.length);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [paused, index]);

  const current = testimonies[index];

  return (
    <div
      className="mt-6 rounded-card border border-silver/8 bg-silver/4 p-5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="grid">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.name}
            initial={{ opacity: 0, x: 32, filter: "blur(6px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -32, filter: "blur(6px)" }}
            transition={{
              duration: reduce ? 0 : 0.55,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="col-start-1 row-start-1"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-chrome to-chrome-deep text-sm font-bold text-ink">
                {current.initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-silver">
                  {current.name}
                </p>
                <p className="text-xs text-silver/70">{current.meta}</p>
              </div>
            </div>
            <p className="mt-3.5 min-h-[96px] text-[14.5px] leading-relaxed text-silver/78">
              {current.quote}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {current.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-pill bg-chrome/12 px-3 py-1 text-[11px] font-medium text-chrome/85"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {testimonies.map((item, i) => (
            <button
              key={item.name}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show testimony from ${item.name}`}
              aria-current={i === index}
              className="group flex h-6 items-center"
            >
              <span
                className={`block h-1.5 rounded-pill transition-all duration-500 ${
                  i === index
                    ? "w-7 bg-chrome"
                    : "w-1.5 bg-chrome/25 group-hover:bg-chrome/50"
                }`}
              />
            </button>
          ))}
        </div>
        <p className="text-[11px] tracking-[0.14em] text-silver/70 tabular-nums">
          {String(index + 1).padStart(2, "0")} / {String(testimonies.length).padStart(2, "0")}
        </p>
      </div>
    </div>
  );
}
