'use client';

import { useEffect, useRef } from 'react';

type Props = {
  /** Light MP4 (576×1024) — for browsers that play neither HLS natively nor through Media Source Extensions. */
  src: string;
  /** Adaptive HLS master playlist (360p · 540p · 720p · 1080p) — the quality follows the connection (owner 23.11). */
  hls?: string;
  poster: string;
  label: string;
  /** Where in the clip this player starts, 0–1 of its length (the desktop video wall, owner 1.11). */
  start?: number;
  /** A wall column beside the main one: decorative, hidden below 1024 px (and then never downloaded). */
  extra?: boolean;
};

type Connection = { saveData?: boolean; effectiveType?: string };

/**
 * The hero video, on every screen size (owner 31.10). The server renders only the poster (fast first
 * paint, the LCP image); the stream is attached on the client unless the visitor asked for reduced
 * motion or the section is hidden. Muted + playsInline + loop is what iOS Safari needs to autoplay.
 *
 * Quality by connection (owner 23.11: «підвищити якість відео в залежності від інтернету»): Safari (iPhone,
 * Mac) plays the HLS ladder natively and switches levels itself; elsewhere hls.js (light build, loaded only
 * here) does the same, capped to the player's size — a 380 px wall column never pulls 1080p — and held at
 * the lowest level on Save-Data or 2G. No HLS and no MSE → the light MP4.
 */
export function HeroVideo_Player({
  src,
  hls,
  poster,
  label,
  start = 0,
  extra = false,
}: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Hidden section (display: none somewhere up the tree): no download.
    if (v.offsetParent === null) return;

    let alive = true;
    let destroy: (() => void) | undefined;
    const play = () =>
      v.play().catch(() => {
        /* autoplay refused (Low Power Mode) — the poster stays */
      });
    if (start > 0)
      v.addEventListener(
        'loadedmetadata',
        () => {
          v.currentTime = v.duration * start;
        },
        { once: true },
      );

    const conn = (navigator as Navigator & { connection?: Connection })
      .connection;
    const slow = !!conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? '');

    // The cap, chosen before loading: the smallest ladder at least as wide as the player in device pixels
    // (a 380 px wall column → up to 540p, a phone at 3× → up to 1080p); Save-Data / 2G → 360p only. hls.js
    // ignored both capLevelToPlayerSize and autoLevelCapping here (measured 23.11), so the cap is the playlist.
    const need = v.clientWidth * (window.devicePixelRatio || 1);
    const cap = slow ? 360 : need <= 540 ? 540 : need <= 720 ? 720 : 0;
    const stream =
      hls && cap ? hls.replace(/index\.m3u8$/, `index_${cap}.m3u8`) : hls;

    if (!hls) {
      v.src = src;
      play();
    } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
      v.src = stream!;
      play();
    } else {
      import('hls.js/dist/hls.light.mjs')
        .then(({ default: Hls }) => {
          if (!alive) return;
          if (!Hls.isSupported()) {
            v.src = src;
            play();
            return;
          }
          const h = new Hls({ maxBufferLength: 12, startLevel: -1 });
          h.on(Hls.Events.ERROR, (_e, data) => {
            if (!data.fatal) return;
            h.destroy();
            v.src = src;
            play();
          });
          h.attachMedia(v);
          h.loadSource(stream!);
          destroy = () => h.destroy();
          play();
        })
        .catch(() => {
          v.src = src;
          play();
        });
    }
    return () => {
      alive = false;
      destroy?.();
    };
  }, [src, hls, start]);

  return (
    <video
      ref={ref}
      className={extra ? 'hv_video hv_video_extra' : 'hv_video'}
      poster={poster}
      muted
      loop
      playsInline
      preload='none'
      aria-label={extra ? undefined : label}
      aria-hidden={extra || undefined}
    />
  );
}
