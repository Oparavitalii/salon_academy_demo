'use client';

import { useEffect } from 'react';

import { usePathname } from '@/i18n/navigation';

/**
 * AutoReveal — element-level entrance engine (Release_Floor F1, boldness «expressive»).
 *
 * On mount and after every client navigation it walks `main` (the hero section excluded — that one
 * plays the CSS load sequence in motion.css) and marks the content leaves that sit BELOW the
 * viewport: headings, paragraphs, button groups, every card / tile / row / list item, media.
 * A marked leaf gets `data-rv="wait"` (+ `--rv-i`); one IntersectionObserver flips it to `"in"`
 * (stagger recomputed per entering batch and parent, capped) and, once the transition is over,
 * to `"done"` — a state with no motion rules, so hover transforms work again.
 *
 * Only attributes and a CSS variable are written, never `className`, so React re-renders keep them.
 * Elements already in view at mount are never touched (no flash). Reduced motion → nothing runs.
 * JS off → nothing is marked; the hidden state lives under `html.rv-js` in motion.css anyway.
 *
 * The old `.reveal` engine (Reveal.tsx + library.css) keeps everything this engine leaves alone
 * (the first viewport, interaction roots); where a `.reveal` wrapper holds leaves this engine
 * animates, the wrapper is neutralised with `data-rv-host` so the two never stack transforms.
 */

const RV = 'data-rv';
const HOST = 'data-rv-host';
const STAGGER_CAP = 5; // 6 steps × 90 ms → the last item of a batch waits ≤ 450 ms

/** Never walk into these: chrome, decor, live interactions whose transforms we must not fight. */
const SKIP = [
  'header',
  'footer',
  'nav',
  'svg',
  'canvas',
  'script',
  'style',
  'template',
  'dialog',
  '[aria-hidden="true"]',
  '[hidden]',
  '.visually_hidden',
  '[data-rv-skip]',
  '[class*="dec_divider"]',
  '[class*="dec_live"]',
  '[class*="bg-image__"]',
  '[class*="ix-"]:not(section)',
  '[data-ix]:not(section)',
].join(',');

const LEAF_TAGS = new Set([
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'P',
  'BLOCKQUOTE',
  'FIGURE',
  'IMG',
  'PICTURE',
  'VIDEO',
  'IFRAME',
  'TABLE',
  'FORM',
  'DETAILS',
  'LI',
  'DT',
  'DD',
  'BUTTON',
  'A',
  'ARTICLE',
  'ASIDE',
  'ADDRESS',
  'HR',
]);
const MEDIA_TAGS = new Set(['IMG', 'PICTURE', 'VIDEO', 'IFRAME', 'FIGURE']);
const ITEM_CLASS =
  /card|tile|stat|item|badge|door|step|person|price|plan|cell|row|quote|story|member|cert|tier|feature|contact/i;
/** wrappers whose names contain an item word (`sec_head_row`, `price_group`) are not items */
const NOT_ITEM = /head|wrap|inner|grid|list|split|group|filters/i;

const ownText = (el: Element) => {
  for (const n of el.childNodes)
    if (n.nodeType === 3 && n.textContent?.trim()) return true;
  return false;
};

function isMedia(el: Element) {
  if (MEDIA_TAGS.has(el.tagName)) return true;
  const kids = el.children;
  return (
    kids.length === 1 &&
    !ownText(el) &&
    /^(IMG|PICTURE|VIDEO)$/.test(kids[0].tagName)
  );
}

function isButtonGroup(el: Element) {
  const kids = [...el.children];
  return (
    kids.length > 0 &&
    kids.every((k) => k.tagName === 'A' || k.tagName === 'BUTTON')
  );
}

function isGroupItem(el: Element) {
  const parent = el.parentElement;
  if (!parent || parent.children.length < 2) return false;
  const cls = typeof el.className === 'string' ? el.className : '';
  if (!ITEM_CLASS.test(cls) || NOT_ITEM.test(cls)) return false;
  if (/^(UL|OL|DL)$/.test(parent.tagName)) return true;
  if (/grid|flex/.test(getComputedStyle(parent).display)) return true;
  // repeated siblings (price rows in a block-level group) are items too
  const first = el.classList[0];
  return (
    [...parent.children].filter((c) => c.classList.contains(first)).length > 1
  );
}

const isLeaf = (el: Element) =>
  LEAF_TAGS.has(el.tagName) ||
  isMedia(el) ||
  isButtonGroup(el) ||
  isGroupItem(el) ||
  el.children.length === 0;

export function AutoReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains('rv-js')) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const marked = new Set<HTMLElement>();
    const hosts = new Set<HTMLElement>();
    const seen = new WeakSet<Element>();
    const timers = new Set<number>();

    const finish = (el: HTMLElement) => {
      if (el.getAttribute(RV) === 'in') el.setAttribute(RV, 'done');
    };

    const io = new IntersectionObserver(
      (entries) => {
        const groups = new Map<Element | null, HTMLElement[]>();
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          io.unobserve(el);
          const g = groups.get(el.parentElement) ?? [];
          g.push(el);
          groups.set(el.parentElement, g);
        }
        for (const g of groups.values()) {
          g.sort((a, b) => (a.compareDocumentPosition(b) & 4 ? -1 : 1));
          g.forEach((el, i) => {
            const step = Math.min(i, STAGGER_CAP);
            el.style.setProperty('--rv-i', String(step));
            el.setAttribute(RV, 'in');
            const onEnd = (ev: TransitionEvent) => {
              if (ev.target !== el) return;
              el.removeEventListener('transitionend', onEnd);
              finish(el);
            };
            el.addEventListener('transitionend', onEnd);
            const t = window.setTimeout(() => finish(el), 1400 + step * 90);
            timers.add(t);
          });
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0 },
    );

    const mark = (el: HTMLElement, i: number) => {
      el.style.setProperty('--rv-i', String(Math.min(i, STAGGER_CAP)));
      if (isMedia(el)) el.setAttribute('data-rv-media', '');
      el.setAttribute(RV, 'wait');
      marked.add(el);
      io.observe(el);
      // a .reveal inside a leaf we animate would stack two transforms → hand it to us
      el.querySelectorAll<HTMLElement>('.reveal').forEach((r) => {
        r.setAttribute(HOST, '');
        hosts.add(r);
      });
    };

    const scan = () => {
      const main = document.querySelector('main');
      if (!main) return;
      const hero =
        main.querySelector(':scope > section') ?? main.firstElementChild;
      const fold = window.innerHeight;
      const counters = new Map<Element | null, number>();

      // returns true when something inside got marked
      const visit = (el: Element): boolean => {
        if (el === hero || el.matches(SKIP)) return false;
        const node = el as HTMLElement;
        const r = node.getBoundingClientRect();
        const below = r.width > 0 && r.height > 0 && r.top >= fold;
        const isReveal = node.classList.contains('reveal');

        if (isLeaf(el)) {
          if (seen.has(el)) return false;
          seen.add(el); // a leaf seen in view is never marked by a later pass
          if (!below) return false;
          const cs = getComputedStyle(node);
          if (cs.position === 'fixed' || cs.position === 'sticky') return false;
          // an element that already carries its own transform / animation is not ours to move
          if (
            !isReveal &&
            (cs.transform !== 'none' || cs.animationName !== 'none')
          )
            return false;
          const n = counters.get(el.parentElement) ?? 0;
          counters.set(el.parentElement, n + 1);
          mark(node, n);
          return true;
        }

        // a .reveal wrapper partly in view stays with the old engine as one block
        if (isReveal && !below) return false;
        let any = false;
        for (const c of el.children) any = visit(c) || any;
        if (any && isReveal) {
          node.setAttribute(HOST, '');
          hosts.add(node);
        }
        return any;
      };

      for (const c of main.children) visit(c);
    };

    // after Next has restored / reset the scroll for this route
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(scan);
    });
    // streamed / late content (Suspense) gets one more pass
    const late = window.setTimeout(scan, 600);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.clearTimeout(late);
      timers.forEach((t) => window.clearTimeout(t));
      io.disconnect();
      for (const el of marked) {
        el.removeAttribute(RV);
        el.removeAttribute('data-rv-media');
        el.style.removeProperty('--rv-i');
      }
      for (const el of hosts) el.removeAttribute(HOST);
    };
  }, [pathname]);

  return null;
}
