"use client";

import { useEffect, useRef, useState } from "react";

export function CloudflareLivePlayer({
  manifestUrl,
  title,
}: {
  manifestUrl: string;
  title: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let disposed = false;
    let destroyHls: (() => void) | null = null;

    const attach = async () => {
      const { default: Hls } = await import("hls.js");
      if (disposed) return;

      if (Hls.isSupported()) {
        const hls = new Hls({
          lowLatencyMode: true,
          // Let Cloudflare's LL-HLS PART-HOLD-BACK control the live edge.
          // Setting liveSyncDurationCount here makes hls.js count full target
          // segments and can add several seconds of avoidable delay.
          maxLiveSyncPlaybackRate: 1.25,
        });
        destroyHls = () => hls.destroy();

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal || disposed) return;

          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
            return;
          }

          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
            return;
          }

          setUnavailable(true);
        });

        hls.on(Hls.Events.MANIFEST_PARSED, () => setUnavailable(false));
        hls.loadSource(manifestUrl);
        hls.attachMedia(video);
        return;
      }

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = manifestUrl;
        return;
      }

      setUnavailable(true);
    };

    void attach().catch((error: unknown) => {
      console.error("[cloudflare] Could not initialize the low-latency player:", error);
      if (!disposed) setUnavailable(true);
    });

    return () => {
      disposed = true;
      destroyHls?.();
      video.removeAttribute("src");
      video.load();
    };
  }, [manifestUrl]);

  if (unavailable) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-ink px-6 text-center text-[14px] text-silver/60">
        The live video could not load. Refresh the page to reconnect.
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      aria-label={title}
      autoPlay
      controls
      muted
      playsInline
      preload="auto"
      className="absolute inset-0 h-full w-full bg-black object-contain"
    />
  );
}
