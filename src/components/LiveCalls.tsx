"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  CalendarClock,
  MessageCircle,
  Play,
  Radio,
  Video,
} from "lucide-react";
import type { LiveCallsState, LivestreamFeed } from "@/lib/whop-livestream";
import { Reveal, Stagger, StaggerItem } from "./Reveal";
import { SectionLabel } from "./ui";

/**
 * The live calls section of the members area.
 *
 * WHOP owns the stream. This component reads WHOP's livestream feed and
 * renders whatever is on air: WHOP's live room embedded on the page, and
 * finished calls played back here from WHOP's CDN.
 *
 * The feed is polled so a call that goes live shows up on a member's screen
 * without them reloading.
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

/** A short, human label for where a call came from. */
function callLabel(stream: LivestreamFeed): string {
  const date = formatDate(stream.ended_at ?? stream.started_at ?? stream.created_at);
  return date || "Level Up Society";
}

export function LiveCalls({ initial }: { initial: LiveCallsState }) {
  const [state, setState] = useState<LiveCallsState>(initial);
  const [now, setNow] = useState(() => Date.now());
  const [activeIndex, setActiveIndex] = useState(0);
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

  const activeRecording = useMemo(() => {
    const list = state.recordings;
    if (list.length === 0) return null;
    return list[Math.min(activeIndex, list.length - 1)] ?? list[0];
  }, [state.recordings, activeIndex]);

  const openRoom = useCallback(() => {
    if (!state.roomUrl) return;
    window.open(state.roomUrl, "_blank", "noopener,noreferrer");
  }, [state.roomUrl]);

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
            productUrl={state.productUrl}
          />
        ) : activeRecording ? (
          <ReplayPanel
            recordings={state.recordings}
            active={activeRecording}
            activeIndex={state.recordings.indexOf(activeRecording)}
            onSelect={setActiveIndex}
          />
        ) : (
          <EmptyPanel
            upcoming={state.upcoming}
            productUrl={state.productUrl}
            connected={state.connected}
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
  productUrl,
}: {
  stream: LivestreamFeed;
  elapsed: string;
  roomUrl: string | null;
  productUrl: string | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26, filter: "blur(5px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden rounded-card border border-chrome/25 bg-silver/[0.04] p-3 shadow-[0_30px_90px_-40px_rgba(200,215,235,0.35)]"
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
            <a
              href={roomUrl ?? "#live-calls"}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-pill bg-[linear-gradient(180deg,#ffffff_0%,#e7ecf3_46%,#c2cad5_100%)] px-5 text-sm font-medium text-ink shadow-[0_14px_44px_-14px_rgba(214,226,240,0.75)] transition-[filter] duration-300 hover:brightness-105"
            >
              Open the live room
              <ArrowUpRight
                size={15}
                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </a>
            {productUrl ? (
              <a
                href={productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-pill border border-silver/18 px-5 text-sm font-medium text-silver transition-colors duration-300 hover:border-chrome/60 hover:text-chrome"
              >
                Community
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ReplayPanel({
  recordings,
  active,
  activeIndex,
  onSelect,
}: {
  recordings: LivestreamFeed[];
  active: LivestreamFeed;
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="overflow-hidden rounded-card border border-silver/10 bg-silver/[0.035] p-3">
      <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr]">
        <div className="overflow-hidden rounded-tile border border-silver/10 bg-ink">
          <div className="aspect-video w-full">
            <video
              key={active.id}
              controls
              playsInline
              preload="metadata"
              poster={active.thumbnail_url ?? undefined}
              src={active.recording_url ?? undefined}
              className="h-full w-full bg-ink object-contain"
            />
          </div>
        </div>

        <div className="flex flex-col rounded-tile border border-silver/10 bg-silver/[0.03] p-7">
          <span className="inline-flex w-fit items-center gap-2 rounded-pill border border-silver/12 bg-silver/4 px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.16em] uppercase text-silver/50">
            <Play size={11} />
            Latest call
          </span>
          <h3 className="mt-5 text-[20px] font-semibold leading-snug tracking-[-0.025em] text-silver">
            {active.title}
          </h3>
          <p className="mt-2 text-[14px] text-silver/45">
            {callLabel(active)} · {formatTime(active.ended_at ?? active.started_at)}
          </p>
          <p className="mt-5 flex-1 text-[15px] leading-relaxed text-silver/55">
            Every call is recorded. Rewind any session and pick up the part you
            still need, right here on the site.
          </p>
        </div>
      </div>

      {recordings.length > 1 ? (
        <Stagger className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {recordings.map((stream, index) => {
            const isActive = index === activeIndex;
            return (
              <StaggerItem key={stream.id}>
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  className={`group flex w-full items-center gap-4 rounded-tile border p-3 text-left transition-colors duration-300 ${
                    isActive
                      ? "border-chrome/40 bg-chrome/8"
                      : "border-silver/10 bg-silver/[0.02] hover:border-chrome/25 hover:bg-silver/[0.05]"
                  }`}
                >
                  <span className="relative flex h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] bg-ink">
                    {stream.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={stream.thumbnail_url}
                        alt=""
                        className="h-full w-full object-cover opacity-70 transition-opacity duration-300 group-hover:opacity-100"
                      />
                    ) : null}
                    <span className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-ink/70 text-chrome">
                      <Play size={11} />
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium text-silver">
                      {stream.title}
                    </span>
                    <span className="mt-1 block text-[12px] text-silver/40">
                      {callLabel(stream)}
                    </span>
                  </span>
                </button>
              </StaggerItem>
            );
          })}
        </Stagger>
      ) : null}
    </div>
  );
}

function EmptyPanel({
  upcoming,
  productUrl,
  connected,
}: {
  upcoming: LivestreamFeed[];
  productUrl: string | null;
  connected: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-card border border-silver/10 bg-silver/[0.03] p-10 text-center sm:p-14">
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-12%] top-[-30%] h-72 w-72 rounded-full bg-chrome/6 blur-[110px]"
      />
      <div className="relative mx-auto max-w-lg">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-tile border border-silver/10 bg-ink text-chrome">
          <CalendarClock size={22} strokeWidth={1.7} />
        </span>
        <h3 className="mt-6 text-[22px] font-semibold tracking-[-0.03em] text-silver">
          {upcoming.length > 0 ? "The next call is on the calendar" : "No calls on yet"}
        </h3>
        <p className="mt-3 text-[15px] leading-relaxed text-silver/50">
          {upcoming.length > 0
            ? "This one has been scheduled on WHOP. The room switches on by itself when the host goes live."
            : connected
              ? "Calls run on WHOP. As soon as the host goes live, the room appears here on its own — no refresh needed."
              : "Calls run on WHOP. We are syncing with WHOP now, and the room will appear here the moment a call goes live."}
        </p>

        {upcoming.length > 0 ? (
          <ul className="mt-7 space-y-2 text-left">
            {upcoming.map((stream) => (
              <li
                key={stream.id}
                className="flex items-center justify-between gap-4 rounded-tile border border-silver/10 bg-silver/[0.03] px-5 py-4"
              >
                <span className="truncate text-[15px] text-silver/80">
                  {stream.title}
                </span>
                <span className="shrink-0 font-mono text-[12px] text-chrome/70">
                  {formatDate(stream.scheduled_at)} ·{" "}
                  {formatTime(stream.scheduled_at)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {productUrl ? (
          <a
            href={productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-8 inline-flex h-11 items-center gap-2 rounded-pill border border-silver/18 px-5 text-sm font-medium text-silver transition-colors duration-300 hover:border-chrome/60 hover:text-chrome"
          >
            Open the community
            <ArrowUpRight
              size={15}
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </a>
        ) : null}
      </div>
    </div>
  );
}
