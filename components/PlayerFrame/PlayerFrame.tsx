'use client';

import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  src: string;
  title: string;
  /** The signed-in student's e-mail, drawn over the video (watermark, 30.10.2026). */
  mark: string;
  labels: { fullscreen: string; exitFullscreen: string };
};

/** How often the watermark moves to a new spot. */
const MOVE_MS = 20_000;

/** A spot as % of the frame; app.css shifts the mark back by the same % so it never leaves the frame. */
const spot = () =>
  ({
    '--mx': (3 + Math.random() * 94).toFixed(1),
    '--my': (5 + Math.random() * 90).toFixed(1),
  }) as React.CSSProperties;

/**
 * Lesson video (VideoEmbed, FR-20) — the Bunny iframe in `.player`.
 *
 * Watermark (30.10.2026): the student's e-mail floats over the frame and jumps to a new spot every
 * 20 s, so a screen recording carries the name of the account it came from. The iframe has no
 * `allowFullScreen`: the Bunny player would go fullscreen inside its own document and leave the
 * mark behind. Our button puts the whole `.player` (iframe + mark) into fullscreen instead; where
 * the Fullscreen API is missing (iPhone Safari) the wrapper is pinned over the viewport with CSS.
 * No `picture-in-picture` in `allow` for the same reason: the PiP window would carry no mark.
 *
 * D-25 (fix round 22.10, WCAG 2.4.7): when Tab moves focus INTO the cross-origin player, Chromium
 * matches neither `iframe:focus` nor `.player:focus-within`, so the iframe gets `is_focused`
 * (ring from app.css) while it is the active element.
 */
export function PlayerFrame({ src, title, mark, labels }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLIFrameElement>(null);
  const [pos, setPos] = useState<React.CSSProperties>({
    '--mx': '4',
    '--my': '6',
  } as React.CSSProperties);
  const [full, setFull] = useState(false);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const frame = ref.current;
    if (!frame) return undefined;
    const sync = () =>
      frame.classList.toggle('is_focused', document.activeElement === frame);
    const soon = () => {
      sync();
      window.setTimeout(sync, 0);
    };
    window.addEventListener('blur', soon);
    window.addEventListener('focus', soon);
    document.addEventListener('focusin', soon);
    return () => {
      window.removeEventListener('blur', soon);
      window.removeEventListener('focus', soon);
      document.removeEventListener('focusin', soon);
    };
  }, []);

  useEffect(() => {
    // first jump soon after load (random spots only on the client — no hydration mismatch)
    const first = window.setTimeout(() => setPos(spot()), 1500);
    const id = window.setInterval(() => setPos(spot()), MOVE_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === wrap.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => {
    if (!pinned) return undefined;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPinned(false);
    document.addEventListener('keydown', onKey);
    document.documentElement.classList.add('player_pinned');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.classList.remove('player_pinned');
    };
  }, [pinned]);

  const toggle = useCallback(() => {
    const el = wrap.current;
    if (!el) return;
    if (pinned) return setPinned(false);
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => setPinned(true));
    } else {
      setPinned(true);
    }
  }, [pinned]);

  const on = full || pinned;

  return (
    <div ref={wrap} className={`player${pinned ? ' is_pinned' : ''}`}>
      <iframe
        ref={ref}
        src={src}
        title={title}
        loading='lazy'
        allow='accelerometer; gyroscope; autoplay; encrypted-media'
      />
      <span className='player_mark' aria-hidden='true' style={pos}>
        {mark}
      </span>
      <button
        type='button'
        className='player_full'
        onClick={toggle}
        aria-pressed={on}
        aria-label={on ? labels.exitFullscreen : labels.fullscreen}
        title={on ? labels.exitFullscreen : labels.fullscreen}
      >
        <svg viewBox='0 0 24 24' width='18' height='18' aria-hidden='true'>
          <path
            d={
              on
                ? 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5'
                : 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5'
            }
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
          />
        </svg>
      </button>
    </div>
  );
}
