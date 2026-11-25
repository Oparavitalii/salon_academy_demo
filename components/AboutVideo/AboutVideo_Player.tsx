'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  src: string;
  poster: string;
  label: string;
  play: string;
  pause: string;
};

/**
 * The «ABOUT US» clip: attached and played only once the block scrolls into view (no download
 * before), paused when it leaves, never started under reduced motion. The round button toggles it.
 */
export function AboutVideo_Player({ src, poster, label, play, pause }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const userPaused = useRef(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (!v.src) v.src = src;
          if (!reduced && !userPaused.current) v.play().catch(() => {});
        } else if (!v.paused) v.pause();
      },
      { threshold: 0.35 },
    );
    io.observe(v);
    return () => {
      io.disconnect();
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
    };
  }, [src]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (!v.src) v.src = src;
    if (v.paused) {
      userPaused.current = false;
      v.play().catch(() => {});
    } else {
      userPaused.current = true;
      v.pause();
    }
  };

  return (
    <>
      <video
        ref={ref}
        className='about_video_media'
        poster={poster}
        muted
        loop
        playsInline
        preload='none'
        aria-label={label}
      />
      <button
        type='button'
        className='about_video_toggle'
        aria-label={playing ? pause : play}
        aria-pressed={playing}
        onClick={toggle}
      >
        {playing ? (
          <svg viewBox='0 0 24 24' width='26' height='26' aria-hidden='true'>
            <path d='M8 5h3v14H8zM13 5h3v14h-3z' />
          </svg>
        ) : (
          <svg viewBox='0 0 24 24' width='26' height='26' aria-hidden='true'>
            <path d='M8 5v14l11-7z' />
          </svg>
        )}
      </button>
    </>
  );
}
