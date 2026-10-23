"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  CalendarClock,
  MessageCircle,
  Radio,
  Video,
} from "lucide-react";
import type { LiveCallsState, LivestreamFeed } from "@/lib/whop-livestream";
import { Reveal } from "./Reveal";
import { SectionLabel } from "./ui";

/**
 * The live calls section of the members area.
 *
 * A live call only shows up when one is actually on air. When nothing is
 * live the section stays quiet and points members at the dedicated live
 * calls page, which is where the room and the live chat live.
 *
 * WHOP owns the stream. This component reads WHOP's livestream feed and
 * renders whatever is on air right now.
 */

const POLL_INTERVAL_MS = 20_000;

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "America/New_York",
});

const TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/New_York",
});

function formatDate(value: string | null): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return DATE_FORMAT.format(parsed);
}

function formatTime(value: string | null): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return TIME_FORMAT.format(parsed);
}

/** "1h 24m" style elapsed time for a call that is on air. */
function formatElapsed(startedAt: string | null, now: number): string {
  if (!startedAt) return "";
  const started = new Date(startedAt).getTime();
  if (Number.isNaN(started)) return "";

  const seconds = Math.max(0, Math.floor((now - started) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${String(rest).padStart(2, "0")}s`;
  return `${rest}s`;
}

export function LiveCalls({ initial }: { initial: LiveCallsState }) {
  const [state, setState] = useState<LiveCallsState>(initial);
  const [now, setNow] = useState(() => Date.now());
  const wasLive = useRef(Boolean(initial.live));

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      try {
        const response = await fetch("/api/live-calls", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) return;
        const next = (await response.json()) as LiveCallsState;
        if (!cancelled) setState(next);
      } catch {
        // WHOP or the network blinked. Keep the last good state on screen.
      }
    };

    const poll = setInterval(tick, POLL_INTERVAL_MS);
    const clock = setInterval(() => setNow(Date.now()), 1000);

    return () => {
      cancelled = true;
      clearInterval(poll);
      clearInterval(clock);
    };
  }, []);

  // A call that just went live should be obvious.
  useEffect(() => {
    if (state.live && !wasLive.current) {
      setNow(Date.now());
    }
    wasLive.current = Boolean(state.live);
  }, [state.live]);

  const openRoom = useCallback(() => {
    if (!state.roomUrl) return;
    window.open(state.roomUrl, "_blank", "noopener,noreferrer");
  }, [state.roomUrl]);

  const nextCall = useMemo<LivestreamFeed | null>(
    () => state.upcoming[0] ?? null,
    [state.upcoming],
  );

  return (
    <section id="live-calls" className="relative scroll-mt-28">
      <Reveal>
        <SectionLabel index="08" title="Live calls" />
        <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-xl text-[clamp(1.9rem,3.6vw,2.9rem)] font-semibold leading-[1.06] tracking-[-0.035em] text-silver">
            When we go live, it lands{" "}
            <span className="display-serif text-chrome-gradient">right here</span>
          </h2>
          <p className="max-w-sm text-[15px] leading-relaxed text-silver/50">
            Live calls run on WHOP with your Level Up Pro membership. This page
            picks up the stream automatically the moment it goes on air.
          </p>
        </div>
      </Reveal>

      <div className="mt-10">
        {state.live ? (
          <LiveNowPanel
            stream={state.live}
            elapsed={formatElapsed(state.live.started_at, now)}
            roomUrl={state.roomUrl}
          />
        ) : (
          <QuietPanel
            nextCall={nextCall}
            connected={state.connected}
            onOpenRoom={openRoom}
          />
        )}
      </div>
    </section>
  );
}

function LiveNowPanel({
  stream,
  elapsed,
  roomUrl,
}: {
  stream: LivestreamFeed;
  elapsed: string;
  roomUrl: string | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26, filter: "blur(5px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden rounded-card border border-chrome/30 bg-silver/[0.04] p-3 shadow-[0_30px_90px_-40px_rgba(200,215,235,0.35)]"
    >
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
        <span className="inline-flex items-center gap-2.5 rounded-pill border border-[#ff3b30]/40 bg-[#ff3b30]/12 px-3.5 py-1.5 text-[12px] font-semibold tracking-[0.16em] uppercase text-[#ff8a82]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff3b30] opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff3b30]" />
          </span>
          Live now
        </span>
        <h3 className="min-w-0 flex-1 truncate text-[17px] font-medium tracking-[-0.02em] text-silver">
          {stream.title}
        </h3>
        {elapsed ? (
          <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-silver/45">
            <Radio size={12} />
            {elapsed}
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr]">
        <div className="relative overflow-hidden rounded-tile border border-silver/10 bg-ink">
          <div className="aspect-video w-full">
            {roomUrl ? (
              <iframe
                src={roomUrl}
                title="Level Up Society live room"
                className="h-full w-full border-0"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center bg-silver/[0.04]"
                style={
                  stream.thumbnail_url
                    ? {
                        backgroundImage: `linear-gradient(180deg, rgba(8,9,11,0.25), rgba(8,9,11,0.85)), url(${stream.thumbnail_url})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : undefined
                }
              >
                <p className="px-8 text-center text-[15px] text-silver/60">
                  The live room is opening on WHOP.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-6 rounded-tile border border-silver/10 bg-silver/[0.03] p-7">
          <div>
            <p className="text-[15px] leading-relaxed text-silver/60">
              You are in. The room is live with the full Level Up Pro crew, and
              you can jump in with your questions any time.
            </p>
            <ul className="mt-6 space-y-3 text-[14px] text-silver/50">
              <li className="flex items-center gap-3">
                <Video size={15} className="shrink-0 text-chrome/70" />
                Stream runs on WHOP with your membership
              </li>
              <li className="flex items-center gap-3">
                <MessageCircle size={15} className="shrink-0 text-chrome/70" />
                Live chat stays open the whole call
              </li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/members/live-calls"
              className="group inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-pill bg-[linear-gradient(180deg,#ffffff_0%,#e7ecf3_46%,#c2cad5_100%)] px-5 text-sm font-medium text-ink shadow-[0_14px_44px_-14px_rgba(214,226,240,0.75)] transition-[filter] duration-300 hover:brightness-105"
            >
              Enter the live room
              <ArrowUpRight
                size={15}
                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
            {roomUrl ? (
              <a
                href={roomUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-pill border border-silver/18 px-5 text-sm font-medium text-silver transition-colors duration-300 hover:border-chrome/60 hover:text-chrome"
              >
                Open on WHOP
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * The quiet state.
 *
 * When nothing is on air we do not fake a call. We say so plainly, show when
 * the next one is, and send the member to the live calls page where the room
 * and chat live.
 */
function QuietPanel({
  nextCall,
  connected,
  onOpenRoom,
}: {
  nextCall: LivestreamFeed | null;
  connected: boolean;
  onOpenRoom: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-card border border-silver/10 bg-silver/[0.03] p-10 sm:p-12">
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-12%] top-[-40%] h-72 w-72 rounded-full bg-chrome/6 blur-[110px]"
      />
      <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div>
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-tile border border-silver/10 bg-ink text-chrome">
            <CalendarClock size={22} strokeWidth={1.7} />
          </span>
          <h3 className="mt-6 text-[22px] font-semibold tracking-[-0.03em] text-silver">
            No call is live right now
          </h3>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-silver/50">
            {connected
              ? "Calls run on WHOP. The moment the host goes live, the room appears here on its own — no refresh needed."
              : "Calls run on WHOP. We are syncing with WHOP now, and the room will appear the moment a call goes live."}
          </p>

          {nextCall ? (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-pill border border-chrome/25 bg-chrome/10 px-4 py-2 font-mono text-[12px] text-chrome">
                Next · {formatDate(nextCall.scheduled_at)} ·{" "}
                {formatTime(nextCall.scheduled_at)}
              </span>
              <span className="truncate text-[14px] text-silver/45">
                {nextCall.title}
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/members/live-calls"
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-pill bg-[linear-gradient(180deg,#ffffff_0%,#e7ecf3_46%,#c2cad5_100%)] px-6 text-sm font-medium text-ink shadow-[0_14px_44px_-14px_rgba(214,226,240,0.75)] transition-[filter] duration-300 hover:brightness-105"
          >
            Go to live calls
            <ArrowUpRight
              size={15}
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
          <button
            type="button"
            onClick={onOpenRoom}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-pill border border-silver/18 px-6 text-sm font-medium text-silver transition-colors duration-300 hover:border-chrome/60 hover:text-chrome"
          >
            Open the WHOP live room
          </button>
          <p className="text-center text-[13px] text-silver/35">
            The live calls page has the room and the live chat.
          </p>
        </div>
      </div>
    </div>
  );
}
