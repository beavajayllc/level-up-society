"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft,
  CalendarClock,
  MessageCircle,
  Radio,
  Send,
  Video,
} from "lucide-react";
import type { LiveCallsState } from "@/lib/whop-livestream";
import type { ChatMessage, ChatState } from "@/lib/whop-chat";
import { CloudflareLivePlayer } from "./CloudflareLivePlayer";
import { Reveal } from "./Reveal";
import { Glow, SectionLabel } from "./ui";

/**
 * The live calls room.
 *
 * This page is the members' home during a call: Cloudflare serves the video
 * inline, and WHOP remains the membership and chat provider.
 */

const LIVE_POLL_MS = 15_000;
const CHAT_POLL_MS = 2_500;
const PLAYER_TOKEN_REFRESH_MS = 45 * 60 * 1000;
const EMPTY_CHAT: ChatState = {
  connected: false,
  channelId: null,
  messages: [],
  requiresReauthorization: false,
  unavailable: false,
};

type PlayerStatus =
  | "idle"
  | "loading"
  | "ready"
  | "setup"
  | "offline"
  | "unavailable"
  | "not_authorized";

const TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/New_York",
});

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "America/New_York",
});

function formatElapsed(startedAt: string | null, now: number): string {
  if (!startedAt) return "";
  const started = new Date(startedAt).getTime();
  if (Number.isNaN(started)) return "";
  const seconds = Math.max(0, Math.floor((now - started) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${String(seconds % 60).padStart(2, "0")}s`;
}

function messageTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return TIME_FORMAT.format(parsed);
}

export function LiveCallsRoom({
  initial,
  memberName,
}: {
  initial: LiveCallsState;
  memberName: string;
}) {
  const [state, setState] = useState<LiveCallsState>(initial);
  const [manifestUrl, setManifestUrl] = useState<string | null>(null);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>(
    initial.cloudflareStreamStatus === "live" ? "loading" : "idle",
  );
  const [chat, setChat] = useState<ChatState>(EMPTY_CHAT);
  const [now, setNow] = useState(() => Date.now());
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const isLive =
    Boolean(state.live) || state.cloudflareStreamStatus === "live";
  const visibleChat = isLive ? chat : EMPTY_CHAT;
  const visiblePlayerStatus: PlayerStatus =
    state.cloudflareStreamStatus === "live"
      ? playerStatus
      : state.cloudflareStreamStatus === "not_configured"
        ? "setup"
        : state.cloudflareStreamStatus;

  useEffect(() => {
    let cancelled = false;

    const pullLive = async () => {
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

    const liveTimer = setInterval(pullLive, LIVE_POLL_MS);
    const clock = setInterval(() => setNow(Date.now()), 1000);

    return () => {
      cancelled = true;
      clearInterval(liveTimer);
      clearInterval(clock);
    };
  }, []);

  useEffect(() => {
    if (!isLive) {
      return;
    }

    let cancelled = false;

    const pullChat = async () => {
      try {
        const response = await fetch("/api/live-chat", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        if (response.status === 401 || response.status === 403) {
          const next = (await response.json().catch(() => null)) as
            | ChatState
            | null;
          if (!cancelled) {
            setChat({
              connected: false,
              channelId: null,
              messages: [],
              requiresReauthorization:
                next?.requiresReauthorization ?? false,
              unavailable: next?.unavailable ?? true,
            });
          }
          return;
        }

        if (!response.ok) return;
        const next = (await response.json()) as ChatState;
        if (!cancelled) setChat(next);
      } catch {
        // Keep whatever we already have.
      }
    };

    void pullChat();
    const chatTimer = setInterval(() => void pullChat(), CHAT_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(chatTimer);
    };
  }, [isLive]);

  useEffect(() => {
    if (state.cloudflareStreamStatus !== "live") {
      return;
    }

    let cancelled = false;

    const refreshPlayer = async () => {
      setPlayerStatus((current) => (current === "ready" ? current : "loading"));

      try {
        const response = await fetch("/api/live-stream", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          if (cancelled) return;

          if (response.status === 401 || response.status === 403) {
            setManifestUrl(null);
            setPlayerStatus("not_authorized");
          } else if (payload?.error === "stream_not_live") {
            setManifestUrl(null);
            setPlayerStatus("offline");
          } else if (payload?.error === "stream_not_configured") {
            setManifestUrl(null);
            setPlayerStatus("setup");
          } else {
            setPlayerStatus("unavailable");
          }
          return;
        }

        const payload = (await response.json()) as { manifestUrl?: string };
        if (!payload.manifestUrl) {
          if (!cancelled) setPlayerStatus("unavailable");
          return;
        }

        if (!cancelled) {
          setManifestUrl(payload.manifestUrl);
          setPlayerStatus("ready");
        }
      } catch {
        if (!cancelled) setPlayerStatus("unavailable");
      }
    };

    void refreshPlayer();
    const timer = setInterval(refreshPlayer, PLAYER_TOKEN_REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [state.cloudflareStreamStatus]);

  // Keep the newest message in view.
  useEffect(() => {
    const node = scroller.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [chat.messages.length]);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setSendError(null);

    try {
      const response = await fetch("/api/live-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        if (payload?.error === "chat_auth_required") {
          setChat((current) => ({
            ...current,
            connected: false,
            requiresReauthorization: true,
          }));
          setSendError("Reconnect your Whop account to use live chat.");
        } else {
          setSendError(
            payload?.error === "chat_unavailable"
              ? "The live room chat is not available right now."
              : "That message did not send. Try again.",
          );
        }
        return;
      }

      const payload = (await response.json()) as { message: ChatMessage };
      setChat((current) => ({
        ...current,
        connected: true,
        messages: [...current.messages, payload.message],
      }));
      setDraft("");
    } catch {
      setSendError("That message did not send. Try again.");
    } finally {
      setSending(false);
    }
  }, [draft, sending]);

  const nextCall = state.upcoming[0] ?? null;

  return (
    <main className="relative flex-1 overflow-hidden bg-ink">
      <Glow className="right-[-10%] top-[-10%] h-[520px] w-[520px]" opacity={0.08} />

      <div className="container-x relative py-16 lg:py-20">
        <Link
          href="/members"
          className="inline-flex items-center gap-2 text-[13px] text-silver/45 transition-colors duration-300 hover:text-chrome"
        >
          <ArrowLeft size={14} />
          Back to the members area
        </Link>

        <Reveal>
          <SectionLabel index="08" title="Live calls" tone="light" />
          <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
            <h1 className="max-w-xl text-[clamp(1.9rem,3.6vw,2.9rem)] font-semibold leading-[1.06] tracking-[-0.035em] text-silver">
              When we go live, it lands{" "}
              <span className="display-serif text-chrome-gradient">right here</span>
            </h1>
          </div>
        </Reveal>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {isLive ? (
            <span className="inline-flex items-center gap-2.5 rounded-pill border border-[#ff3b30]/40 bg-[#ff3b30]/12 px-4 py-2 text-[12px] font-semibold tracking-[0.16em] uppercase text-[#ff8a82]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff3b30] opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff3b30]" />
              </span>
              Live now
            </span>
          ) : (
            <span className="inline-flex items-center gap-2.5 rounded-pill border border-silver/12 bg-silver/4 px-4 py-2 text-[13px] text-silver/50">
              <CalendarClock size={14} className="text-chrome/70" />
              {nextCall
                ? `Next call ${DATE_FORMAT.format(new Date(nextCall.scheduled_at ?? ""))} · ${TIME_FORMAT.format(new Date(nextCall.scheduled_at ?? ""))}`
                : "Live calls are announced here"}
            </span>
          )}
          {!isLive ? (
            <span className="inline-flex items-center gap-2.5 rounded-pill border border-silver/12 bg-silver/4 px-4 py-2 text-[13px] text-silver/50">
              No call is live right now
            </span>
          ) : null}
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-[1.55fr_1fr]">
          <div className="overflow-hidden rounded-card border border-chrome/20 bg-silver/[0.04] p-3 shadow-[0_34px_90px_-46px_rgba(200,215,235,0.4)]">
            <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
              <h2 className="min-w-0 flex-1 truncate text-[16px] font-medium tracking-[-0.02em] text-silver">
                {state.live?.title ??
                  (isLive ? "Level Up Pro live call" : "The live stage")}
              </h2>
              {state.live ? (
                <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-silver/45">
                  <Radio size={12} />
                  {formatElapsed(state.live.started_at, now)}
                </span>
              ) : null}
            </div>

            <div className="overflow-hidden rounded-tile border border-silver/10 bg-ink">
              <div className="relative aspect-video w-full">
                {isLive ? (
                  <div className="absolute inset-0">
                    {manifestUrl && visiblePlayerStatus === "ready" ? (
                      <CloudflareLivePlayer
                        key={manifestUrl}
                        manifestUrl={manifestUrl}
                        title="Level Up Pro live call"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-silver/[0.03] px-6 text-center sm:px-8">
                        <span className="inline-flex h-16 w-16 items-center justify-center rounded-tile border border-silver/10 bg-ink/80 text-chrome">
                          <Video size={24} strokeWidth={1.6} />
                        </span>
                        <p className="max-w-md text-[15px] leading-relaxed text-silver/65">
                          {visiblePlayerStatus === "setup"
                            ? "The on-site player is being connected. Please check back shortly."
                            : visiblePlayerStatus === "offline"
                              ? "The video feed has stopped. The page will reconnect when the host is back on air."
                              : visiblePlayerStatus === "not_authorized"
                                ? "Your Level Up Pro access needs to be refreshed. Sign in again to watch."
                                : visiblePlayerStatus === "unavailable"
                                  ? "We can’t reach the live video right now. This page will keep checking for the stream."
                                  : "Connecting to the live video…"}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 bg-silver/[0.03] px-8 text-center">
                    <Image
                      src="/brand/lus-mark-hero.webp"
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 55vw, 90vw"
                      className="pointer-events-none object-contain p-6 opacity-[0.12] sm:p-10"
                    />
                    <span className="relative inline-flex h-16 w-16 items-center justify-center rounded-tile border border-silver/10 bg-ink/80 text-chrome">
                      <Video size={24} strokeWidth={1.6} />
                    </span>
                    <p className="relative max-w-sm text-[15px] leading-relaxed text-silver/55">
                      Nothing is on air right now. The live video will appear
                      here automatically when the host goes live.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <ChatPanel
            chat={visibleChat}
            isLive={isLive}
            draft={draft}
            sending={sending}
            sendError={sendError}
            memberName={memberName}
            onDraftChange={setDraft}
            onSend={send}
            scroller={scroller}
          />
        </div>

        {!isLive ? (
          <section className="mt-12">
            <h3 className="text-[13px] font-semibold tracking-[0.16em] uppercase text-silver/40">
              Latest calls
            </h3>
            {state.recordings.length > 0 ? (
              <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {state.recordings.map((recording) => (
                  <li
                    key={recording.id}
                    className="overflow-hidden rounded-card border border-silver/10 bg-silver/[0.03]"
                  >
                    <div className="aspect-video w-full bg-ink">
                      {recording.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={recording.thumbnail_url}
                          alt=""
                          className="h-full w-full object-cover opacity-80"
                        />
                      ) : null}
                    </div>
                    <div className="p-5">
                      <p className="truncate text-[15px] font-medium text-silver">
                        {recording.title}
                      </p>
                      <p className="mt-1 text-[12px] text-silver/40">
                        {DATE_FORMAT.format(
                          new Date(recording.ended_at ?? recording.started_at ?? ""),
                        )}
                        {" · "}
                        {TIME_FORMAT.format(
                          new Date(recording.ended_at ?? recording.started_at ?? ""),
                        )}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-[15px] text-silver/40">
                No calls recorded yet.
              </p>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}

function ChatPanel({
  chat,
  isLive,
  draft,
  sending,
  sendError,
  memberName,
  onDraftChange,
  onSend,
  scroller,
}: {
  chat: ChatState;
  isLive: boolean;
  draft: string;
  sending: boolean;
  sendError: string | null;
  memberName: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  scroller: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-card border border-chrome/20 bg-silver/[0.04]">
      <div className="flex items-center gap-3 border-b border-silver/8 px-5 py-4">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-tile border border-silver/10 bg-ink text-chrome">
          <MessageCircle size={16} strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-silver">Live chat</p>
          <p className="text-[12px] text-silver/40">
            {chat.connected
              ? `${chat.messages.length} message${chat.messages.length === 1 ? "" : "s"}`
              : chat.requiresReauthorization
                ? "Reconnect Whop to join the conversation"
                : chat.unavailable
                  ? "Live chat is temporarily unavailable"
                  : "Talk with everyone on the call"}
          </p>
        </div>
      </div>

      <div
        ref={scroller}
        className="flex-1 space-y-4 overflow-y-auto px-5 py-5"
        style={{ maxHeight: "28rem" }}
      >
        {chat.messages.length > 0 ? (
          chat.messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex gap-3"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-silver/10 bg-ink text-[11px] font-semibold text-chrome">
                {message.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={message.avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  message.author.slice(0, 2).toUpperCase()
                )}
              </span>
              <div className="min-w-0">
                <p className="flex items-baseline gap-2">
                  <span className="text-[13px] font-medium text-silver">
                    {message.author}
                  </span>
                  <span className="font-mono text-[11px] text-silver/30">
                    {messageTime(message.createdAt)}
                  </span>
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words text-[14px] leading-relaxed text-silver/65">
                  {message.content}
                </p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-3 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-tile border border-silver/10 bg-ink text-chrome/70">
              <MessageCircle size={19} strokeWidth={1.6} />
            </span>
            <p className="max-w-[16rem] text-[14px] leading-relaxed text-silver/45">
              {chat.connected
                ? "No messages yet. Say hello and get it started."
                : chat.requiresReauthorization
                  ? "Reconnect your Whop account to turn on live chat."
                  : chat.unavailable
                    ? "We couldn’t connect to the live chat. Refresh the page and try again."
                    : "The live chat picks up as soon as the call goes live."}
            </p>
            {chat.requiresReauthorization ? (
              <a
                href="/api/auth/login?next=%2Fmembers%2Flive-calls"
                className="text-[13px] font-medium text-chrome underline underline-offset-4"
              >
                Reconnect Whop
              </a>
            ) : null}
          </div>
        )}
      </div>

      <div className="border-t border-silver/8 p-4">
        {sendError ? (
          <p className="mb-3 text-[12px] text-[#ff8a82]">{sendError}</p>
        ) : null}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder={
              isLive ? `Say something, ${memberName}` : "Chat opens when the call is live"
            }
            disabled={!isLive || !chat.connected || sending}
            className="h-11 min-w-0 flex-1 rounded-pill border border-silver/12 bg-ink px-5 text-[14px] text-silver outline-none transition-colors duration-300 placeholder:text-silver/30 focus:border-chrome/45 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={
              !isLive || !chat.connected || sending || draft.trim().length === 0
            }
            aria-label="Send message"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-[linear-gradient(180deg,#ffffff_0%,#e7ecf3_46%,#c2cad5_100%)] text-ink transition-[filter,opacity] duration-300 hover:brightness-105 disabled:opacity-35"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
