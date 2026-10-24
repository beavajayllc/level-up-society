"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import { Menu, X } from "lucide-react";
import { navLinks } from "@/lib/data";
import { checkoutHref } from "@/lib/checkout";
import { LogoMark, PillButton } from "./ui";

export function NavClient({ isSignedIn }: { isSignedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 28,
    restDelta: 0.001,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="fixed inset-x-0 top-0 z-50"
      >
        <div
          className={`transition-all duration-500 ${
            scrolled
              ? "border-b border-silver/8 bg-ink/95"
              : "border-b border-transparent bg-transparent"
          }`}
        >
          <nav className="container-x flex h-[74px] items-center justify-between gap-6">
            <a href="#top" className="shrink-0" aria-label="Level Up Society home">
              <LogoMark priority />
            </a>

            <div className="hidden items-center gap-1 md:flex">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="group relative rounded-pill px-4 py-2 text-sm text-silver/65 transition-colors duration-300 hover:text-silver"
                >
                  {link.label}
                  <span className="absolute inset-x-4 bottom-1 h-px scale-x-0 bg-chrome transition-transform duration-300 group-hover:scale-x-100" />
                </a>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {isSignedIn ? (
                <form action="/api/auth/logout" method="POST" className="hidden sm:block">
                  <button
                    type="submit"
                    className="rounded-pill px-4 py-2 text-sm text-silver/70 transition-colors duration-300 hover:text-silver"
                  >
                    Sign out
                  </button>
                </form>
              ) : (
                <a
                  href="/api/auth/login?next=%2Fmembers"
                  className="hidden rounded-pill px-4 py-2 text-sm text-silver/70 transition-colors duration-300 hover:text-silver sm:inline-flex"
                >
                  Member sign in
                </a>
              )}
              <PillButton href={checkoutHref()} size="sm" className="hidden sm:inline-flex">
                Join the Society
              </PillButton>
              <button
                onClick={() => setOpen(true)}
                aria-label="Open menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-silver/15 text-silver transition-colors hover:bg-silver/10 md:hidden"
              >
                <Menu size={18} />
              </button>
            </div>
          </nav>
        </div>
        <motion.div
          style={{ scaleX: progress }}
          className="h-[2px] origin-left bg-gradient-to-r from-chrome-deep via-chrome to-chrome-soft"
        />
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-ink/97 md:hidden"
          >
            <div className="container-x flex h-[74px] items-center justify-between">
              <LogoMark />
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-silver/15 text-silver"
              >
                <X size={18} />
              </button>
            </div>
            <div className="container-x flex flex-col gap-1 pt-8">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i + 0.1, duration: 0.5 }}
                  className="rounded-2xl border border-silver/8 px-5 py-4 text-2xl font-semibold tracking-[-0.02em] text-silver"
                >
                  {link.label}
                </motion.a>
              ))}
              {isSignedIn ? (
                <motion.form
                  action="/api/auth/logout"
                  method="POST"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.06 * navLinks.length + 0.1,
                    duration: 0.5,
                  }}
                  className="mt-6"
                >
                  <button
                    type="submit"
                    className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-pill border border-silver/18 px-8 text-[15px] font-medium tracking-[-0.01em] text-silver transition-colors duration-300 hover:border-chrome/60 hover:bg-chrome/5 hover:text-chrome"
                  >
                    Sign out
                  </button>
                </motion.form>
              ) : (
                <motion.a
                  href="/api/auth/login?next=%2Fmembers"
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.06 * navLinks.length + 0.1,
                    duration: 0.5,
                  }}
                  className="mt-6 inline-flex h-14 items-center justify-center gap-2 rounded-pill border border-silver/18 px-8 text-[15px] font-medium tracking-[-0.01em] text-silver transition-colors duration-300 hover:border-chrome/60 hover:bg-chrome/5 hover:text-chrome"
                >
                  Member sign in
                </motion.a>
              )}
              <PillButton href={checkoutHref()} size="lg" className="mt-3 w-full">
                Join the Society
              </PillButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
