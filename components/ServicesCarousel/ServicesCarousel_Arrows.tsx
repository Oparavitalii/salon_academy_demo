'use client';

/**
 * ← → buttons for the SERVICES row: scroll by one card and wrap around at the ends (never a
 * disabled button — Release floor F3), so «←» on the first card goes to the last one.
 */
export function ServicesCarousel_Arrows({
  target,
  prev,
  next,
}: {
  target: string;
  prev: string;
  next: string;
}) {
  const move = (dir: 1 | -1) => {
    const el = document.getElementById(target);
    if (!el) return;
    const card = el.querySelector<HTMLElement>('li');
    const step = card ? card.offsetWidth + 12 : el.clientWidth * 0.8;
    const max = el.scrollWidth - el.clientWidth;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)')
      .matches;
    const behavior: ScrollBehavior = smooth ? 'smooth' : 'auto';
    if (dir === 1 && el.scrollLeft >= max - 2)
      el.scrollTo({ left: 0, behavior });
    else if (dir === -1 && el.scrollLeft <= 2)
      el.scrollTo({ left: max, behavior });
    else el.scrollBy({ left: dir * step, behavior });
  };

  return (
    <div className='svc_carousel_arrows'>
      <button
        type='button'
        className='svc_arrow'
        aria-label={prev}
        aria-controls={target}
        onClick={() => move(-1)}
      >
        <svg viewBox='0 0 24 24' width='20' height='20' aria-hidden='true'>
          <path d='M15 5l-7 7 7 7' />
        </svg>
      </button>
      <button
        type='button'
        className='svc_arrow'
        aria-label={next}
        aria-controls={target}
        onClick={() => move(1)}
      >
        <svg viewBox='0 0 24 24' width='20' height='20' aria-hidden='true'>
          <path d='M9 5l7 7-7 7' />
        </svg>
      </button>
    </div>
  );
}
