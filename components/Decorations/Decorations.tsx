'use client';

import { useEffect } from 'react';

import { usePathname } from '@/i18n/navigation';

import { destroy, init } from './decEffects';
import { startHeadRules } from './Head_Rule';

declare global {
  interface Window {
    DecEffects?: { init: typeof init; destroy: typeof destroy };
  }
}

/**
 * Decor runtime (8.0 §6) — mounted once in the locale layout. Runs the ported 22.10
 * `docs/8_Effects/Decorations.js` (`./decEffects.ts`): `init(document.body)` on mount and after
 * every client navigation (`usePathname` in the deps; `init` is idempotent — each element is set
 * up once, marked `data-dec`), `destroy()` on unmount. Renders nothing; reduced motion is read by
 * the script itself. Without JS every line is drawn and the tape runs (Decorations.css).
 *
 * Part B (22.10): polaroids inside an interaction root (`[data-ix]`, the Portfolio `.ix-flip` grid)
 * are left alone by AutoReveal, so «поляроїд лягає» (8.0 Motion map) is triggered here: `.is_in`
 * once each enters the viewport (Decorations.css §7 `.dec_polaroid.is_in`). Reduced motion → none.
 *
 * Oksana 16.11.2026 (M-01, M-04): the pink rule under every section head is as long as the heading —
 * `./Head_Rule.ts` measures the longest line on every page (motion or not).
 */
export function Decorations() {
  const pathname = usePathname();

  useEffect(() => {
    window.DecEffects = { init, destroy };
    init(document.body);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      return undefined;
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('is_in');
          io.unobserve(e.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    document
      .querySelectorAll('[data-ix] .dec_polaroid:not(.is_in)')
      .forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  useEffect(() => startHeadRules(), [pathname]);

  useEffect(() => () => destroy(), []);

  return null;
}
