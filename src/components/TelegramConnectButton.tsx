"use client";

import { useState } from "react";
import { ArrowUpRight, LoaderCircle, MessageCircle } from "lucide-react";

export function TelegramConnectButton({ enabled }: { enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [telegramUrl, setTelegramUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createLink() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/telegram/link", {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      const payload = (await response.json()) as {
        telegramUrl?: string;
        error?: string;
      };

      if (!response.ok || !payload.telegramUrl) {
        throw new Error(payload.error ?? "We couldn't create your secure link. Please try again.");
      }

      setTelegramUrl(payload.telegramUrl);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "We couldn't create your secure link. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) {
    return (
      <div className="mt-7">
        <span className="inline-flex min-h-12 items-center gap-2 rounded-pill border border-silver/15 px-6 text-sm font-medium text-silver/50">
          <MessageCircle size={16} />
          Secure access setup in progress
        </span>
        <p className="mt-3 text-sm leading-relaxed text-silver/40">
          The personal Telegram connection will appear here once the bot is configured.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-7">
      {telegramUrl ? (
        <a
          href={telegramUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-12 items-center gap-2 rounded-pill bg-[linear-gradient(180deg,#ffffff_0%,#e7ecf3_46%,#c2cad5_100%)] px-6 text-sm font-medium text-ink transition hover:brightness-[1.06]"
        >
          Open Telegram
          <ArrowUpRight size={15} />
        </a>
      ) : (
        <button
          type="button"
          onClick={createLink}
          disabled={busy}
          className="inline-flex min-h-12 items-center gap-2 rounded-pill bg-[linear-gradient(180deg,#ffffff_0%,#e7ecf3_46%,#c2cad5_100%)] px-6 text-sm font-medium text-ink transition hover:brightness-[1.06] disabled:cursor-wait disabled:opacity-65"
        >
          {busy ? <LoaderCircle className="animate-spin" size={16} /> : <MessageCircle size={16} />}
          {busy ? "Creating your secure link" : "Connect Telegram"}
        </button>
      )}

      {telegramUrl && (
        <p className="mt-3 text-sm leading-relaxed text-silver/40">
          This personal link expires after 10 minutes. If it expires, create another one here.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm leading-relaxed text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}
