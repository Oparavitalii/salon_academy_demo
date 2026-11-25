'use client';

import { useEffect, useRef, useState } from 'react';

import { ReadMore } from '../ReadMore/ReadMore';

type Item = { author: string; source: string; text: string; lang: string };

type Props = {
  id: string;
  label: string;
  prev: string;
  next: string;
  goTo: string;
  more: string;
  less: string;
  items: Item[];
};

/**
 * Testimonial9 track: one card per view on a scroll-snap strip (swipe, trackpad, keyboard on the
 * focusable track — all without JS). This client part adds the arrows and a «1 / 12» counter with a
 * progress line (Release floor F6: each arrow scrolls the track), kept in sync with the scroll.
 */
export function ReviewSlider({
  id,
  label,
  prev,
  next,
  goTo,
  more,
  less,
  items,
}: Props) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  // Slides at least 60 % in view — 2 at 1440 px, 1 on a phone. Off-screen slides hide «Читати повністю».
  const [inView, setInView] = useState<Set<number>>(() => new Set([0]));

  useEffect(() => {
    const el = track.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(
      (entries) =>
        setInView((prev) => {
          const next = new Set(prev);
          for (const e of entries) {
            const i = Number((e.target as HTMLElement).dataset.i);
            if (e.intersectionRatio >= 0.6) next.add(i);
            else next.delete(i);
          }
          return next;
        }),
      { root: el, threshold: [0, 0.6, 1] },
    );
    el.querySelectorAll<HTMLElement>('[data-i]').forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [items.length]);

  useEffect(() => {
    const el = track.current;
    if (!el) return undefined;
    const onScroll = () => {
      const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
      setActive(Math.min(items.length - 1, Math.max(0, i)));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [items.length]);

  const show = (i: number) => {
    const el = track.current;
    if (!el) return;
    const n = (i + items.length) % items.length;
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    el.scrollTo({
      left: n * el.clientWidth,
      behavior: reduce ? 'auto' : 'smooth',
    });
    setActive(n);
  };

  return (
    <div className='review_slider'>
      <div
        ref={track}
        id={id}
        className='review_track'
        tabIndex={0}
        role='region'
        aria-label={label}
      >
        {items.map((r, i) => (
          <article
            key={r.author + i}
            data-i={i}
            className={`card review${inView.has(i) ? ' is_in_view' : ''}`}
            aria-roledescription='slide'
          >
            <p className='review_mark' aria-hidden='true'>
              “
            </p>
            <blockquote className='review_quote'>
              <ReadMore
                paragraphs={[r.text]}
                lang={r.lang}
                more={more}
                less={less}
                lines={5}
              />
            </blockquote>
            <div className='review_who'>
              <span className='avatar avatar_initial' aria-hidden='true'>
                {r.author.charAt(0)}
              </span>
              <span>
                <span className='review_name'>{r.author}</span>
                <span className='review_src meta'>{r.source}</span>
              </span>
            </div>
          </article>
        ))}
      </div>
      <div className='review_nav'>
        <button
          type='button'
          className='arrow'
          aria-label={prev}
          aria-controls={id}
          onClick={() => show(active - 1)}
        >
          ←
        </button>
        {/* Counter + progress line instead of 12 dots (one row on a phone). */}
        <div className='review_counter'>
          <p className='review_count' aria-live='polite' aria-atomic='true'>
            <span className='visually_hidden'>{goTo} </span>
            {active + 1} / {items.length}
          </p>
          <span className='review_progress' aria-hidden='true'>
            <span
              className='review_progress_bar'
              style={{
                width: `${((active + 1) / Math.max(1, items.length)) * 100}%`,
              }}
            />
          </span>
        </div>
        <button
          type='button'
          className='arrow'
          aria-label={next}
          aria-controls={id}
          onClick={() => show(active + 1)}
        >
          →
        </button>
      </div>
    </div>
  );
}
