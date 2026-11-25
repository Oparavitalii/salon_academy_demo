'use client';

import { useEffect } from 'react';

import { usePathname } from '@/i18n/navigation';

/**
 * Interactions layer (7.0_Ui-Kit §5b, B-60) — a port of `docs/7_Ui-Kit/Interactions.js` (dark
 * re-run 19.10.2026). Same contract and class names: `html.ix-js`, `[data-ix]`, `.ix-flip__*`,
 * `[data-filter]` / `[data-tags]` / `aria-pressed`, `.ix-fill__w.is-on`.
 *   flip — Portfolio / CourseGallery: chips filter the grid (FLIP, toggles `hidden`, never
 *          unmounts); a tile opens a full slide that flies out of the grid; Esc / ← → / swipe;
 *          focus trapped and returned; the page scroll is locked only while the dialog is open.
 *   fill — words of the quote light up with the scroll progress; skipped under reduced motion.
 * `.ix-dim`, `.ix-mask`, `.ix-coverflow` are CSS-only. `.ix-gallery` is retired (SalonTeaser).
 * Without JS nothing is hidden: every rest-state rule is scoped to `html.ix-js`.
 * Mounted once in the locale layout; re-scans `[data-ix]` after every client navigation and drops
 * the slideshow stages whose root left the page (the only addition to the source logic).
 */

type IxElement = HTMLElement & { __ixDone?: boolean };

// Lightbox button labels per <html lang> (Release floor F2, 20.10.2026); a data-* attribute on
// the root still wins.
const UI: Record<string, { close: string; prev: string; next: string }> = {
  uk: { close: 'Закрити', prev: 'Попереднє', next: 'Наступне' },
  pl: { close: 'Zamknij', prev: 'Poprzednie', next: 'Następne' },
  en: { close: 'Close', prev: 'Previous', next: 'Next' },
};
const ui = () => UI[document.documentElement.lang] ?? UI.uk;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/* flip stages live on <body>; drop the ones whose root left the page (client navigation). */
let stages: { root: HTMLElement; stage: HTMLElement }[] = [];
function sweepStages() {
  stages = stages.filter(({ root, stage }) => {
    if (root.isConnected) return true;
    if (!stage.hidden) document.documentElement.style.overflow = '';
    stage.remove();
    return false;
  });
}

/* one rAF scroll loop for scroll-progress blocks (module scope: one per page load).
   Entries whose element left the DOM (client navigation) are dropped on the next frame,
   and their IntersectionObserver is disconnected — the loop does not grow per visit. */
type LoopEntry = {
  el: HTMLElement;
  update: () => void;
  io?: IntersectionObserver;
};
let loop: LoopEntry[] = [];
let ticking = false;
let listening = false;
function frame() {
  ticking = false;
  loop = loop.filter((entry) => {
    if (entry.el.isConnected) return true;
    entry.io?.disconnect();
    return false;
  });
  for (const entry of loop) entry.update();
}
function schedule() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(frame);
  }
}
function listen() {
  if (listening) return;
  listening = true;
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
}

/* split text nodes into word spans (keeps inline tags such as <em>) */
function splitWords(el: HTMLElement, cls: string): number {
  let i = 0;
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  for (const node of nodes) {
    if (!node.nodeValue?.trim()) continue;
    const frag = document.createDocumentFragment();
    for (const part of node.nodeValue.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        frag.appendChild(document.createTextNode(part));
        continue;
      }
      const w = document.createElement('span');
      w.className = `${cls}__w`;
      w.textContent = part;
      w.style.setProperty('--i', String(i++));
      frag.appendChild(w);
    }
    node.parentNode?.replaceChild(frag, node);
  }
  return i;
}

/* progress of an element through the viewport */
function progress(el: HTMLElement, from: number, to: number): number {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight || 1;
  return clamp((vh * from - r.top) / (vh * (from - to) || 1), 0, 1);
}

const handlers: Record<string, (el: HTMLElement, reduce: boolean) => void> = {
  /* ================= flip: filter shuffle + grid → slideshow ================= */
  flip(root) {
    const doc = document.documentElement;
    const items = Array.from(
      root.querySelectorAll<HTMLElement>('.ix-flip__item'),
    );
    if (!items.length) return;
    const chips = Array.from(
      root.querySelectorAll<HTMLElement>('[data-filter]'),
    );
    const live = root.querySelector('.ix-flip__live');
    const canAnimate =
      typeof Element !== 'undefined' && 'animate' in Element.prototype;
    const reduced = () =>
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const css = (name: string, fallback: string) =>
      getComputedStyle(doc).getPropertyValue(name).trim() || fallback;
    const ms = (v: string) => {
      const n = parseFloat(v);
      return /ms$/.test(v) ? n : n * 1000;
    };
    const dur = () => ms(css('--ix-dur', '700ms'));
    const ease = () => css('--ix-ease', 'cubic-bezier(0.16, 1, 0.3, 1)');
    const motion = () => canAnimate && !reduced();
    const say = (text: string) => {
      if (live) live.textContent = text;
    };

    /* -- filter (First → toggle hidden → Last → Invert → Play) -- */
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const f = chip.getAttribute('data-filter');
        chips.forEach((c) =>
          c.setAttribute('aria-pressed', String(c === chip)),
        );
        const first = new Map<HTMLElement, DOMRect>();
        items.forEach((it) => {
          if (!it.hidden) first.set(it, it.getBoundingClientRect());
        });
        let shown = 0;
        items.forEach((it) => {
          const tags = (it.getAttribute('data-tags') || '').split(/\s+/);
          it.hidden = !(f === '*' || (f !== null && tags.indexOf(f) > -1));
          if (!it.hidden) shown++;
        });
        say(`${chip.textContent?.trim() ?? ''}: ${shown}`);
        if (!motion()) return;
        items.forEach((it) => {
          if (it.hidden) return;
          const last = it.getBoundingClientRect();
          const was = first.get(it);
          if (was) {
            const dx = was.left - last.left;
            const dy = was.top - last.top;
            if (dx || dy)
              it.animate(
                [
                  { transform: `translate(${dx}px,${dy}px)` },
                  { transform: 'none' },
                ],
                { duration: dur() * 0.8, easing: ease() },
              );
          } else {
            it.animate(
              [
                { opacity: 0, transform: 'scale(.92)' },
                { opacity: 1, transform: 'none' },
              ],
              { duration: dur() * 0.6, easing: ease(), delay: 80 },
            );
          }
        });
      });
    });

    /* -- slideshow stage, built once per root -- */
    const stage = document.createElement('div');
    stage.className = 'ix-flip__stage';
    stage.hidden = true;
    stage.setAttribute('role', 'dialog');
    stage.setAttribute('aria-modal', 'true');
    stage.setAttribute('aria-label', root.getAttribute('data-label') || 'Фото');
    const btn = (cls: string, label: string, text: string, stepBy?: number) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = cls;
      b.setAttribute('aria-label', label);
      if (stepBy !== undefined) b.setAttribute('data-step', String(stepBy));
      b.textContent = text;
      return b;
    };
    const closeBtn = btn(
      'ix-flip__btn ix-flip__close',
      root.getAttribute('data-close') || ui().close,
      '✕',
    );
    const slide = document.createElement('figure');
    slide.className = 'ix-flip__slide';
    // The slide image joins the DOM on first open — an empty <img> (no src) never sits in the page.
    const img = document.createElement('img');
    img.alt = '';
    const bar = document.createElement('div');
    bar.className = 'ix-flip__bar';
    const cap = document.createElement('p');
    cap.className = 'ix-flip__cap';
    const count = document.createElement('span');
    count.className = 'ix-flip__count';
    count.setAttribute('aria-live', 'polite');
    bar.append(
      btn('ix-flip__btn', root.getAttribute('data-prev') || ui().prev, '←', -1),
      cap,
      count,
      btn('ix-flip__btn', root.getAttribute('data-next') || ui().next, '→', 1),
    );
    stage.append(closeBtn, slide, bar);
    document.body.appendChild(stage);
    stages.push({ root, stage });
    let current = -1;
    let opener: HTMLElement | null = null;
    const visible = () => items.filter((it) => !it.hidden);

    function fill(it: HTMLElement) {
      const a = it.querySelector<HTMLAnchorElement>('.ix-flip__link');
      if (!a) return;
      const thumb = a.querySelector('img');
      const list = visible();
      img.src = a.getAttribute('href') || '';
      img.alt = thumb ? thumb.alt : '';
      if (!img.isConnected) slide.appendChild(img);
      cap.textContent =
        a.getAttribute('data-caption') || (thumb ? thumb.alt : '');
      count.textContent = `${list.indexOf(it) + 1} / ${list.length}`;
    }
    const boxTo = (a: DOMRect, b: DOMRect) =>
      `translate(${a.left - b.left}px,${a.top - b.top}px) scale(${a.width / b.width},${a.height / b.height})`;
    function flyFrom(thumb: Element | null) {
      // Invert from the tile's box, Play to the slide's box
      if (!thumb) return;
      const a = thumb.getBoundingClientRect();
      const b = img.getBoundingClientRect();
      if (!b.width || !b.height) return;
      img.animate(
        [
          { transform: boxTo(a, b), transformOrigin: '0 0' },
          { transform: 'none', transformOrigin: '0 0' },
        ],
        { duration: dur(), easing: ease() },
      );
    }
    function open(it: HTMLElement) {
      opener = it.querySelector<HTMLElement>('.ix-flip__link');
      current = visible().indexOf(it);
      fill(it);
      stage.hidden = false;
      doc.style.overflow = 'hidden';
      const go = () => {
        stage.classList.add('is-open');
        if (motion()) {
          it.classList.add('is-flying');
          flyFrom(it.querySelector('img'));
          setTimeout(() => it.classList.remove('is-flying'), dur());
        }
        closeBtn.focus({ preventScroll: true });
      };
      if (img.complete && img.naturalWidth) requestAnimationFrame(go);
      else
        img.onload = () => {
          img.onload = null;
          requestAnimationFrame(go);
        };
    }
    function close() {
      if (stage.hidden) return;
      const it = visible()[current];
      const done = () => {
        stage.hidden = true;
        doc.style.overflow = '';
        if (opener) opener.focus({ preventScroll: true });
      };
      stage.classList.remove('is-open');
      const thumb = it?.querySelector('img');
      if (motion() && thumb) {
        const anim = img.animate(
          [
            { transform: 'none', transformOrigin: '0 0' },
            {
              transform: boxTo(
                thumb.getBoundingClientRect(),
                img.getBoundingClientRect(),
              ),
              transformOrigin: '0 0',
            },
          ],
          { duration: dur() * 0.7, easing: ease() },
        );
        anim.onfinish = done;
      } else done();
    }
    function step(d: number) {
      const list = visible();
      if (!list.length) return;
      current = (current + d + list.length) % list.length;
      const it = list[current];
      opener = it.querySelector<HTMLElement>('.ix-flip__link');
      if (canAnimate)
        img.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: reduced() ? 1 : dur() * 0.5,
          easing: 'ease-out',
        });
      fill(it);
    }

    items.forEach((it) => {
      const a = it.querySelector<HTMLAnchorElement>('.ix-flip__link');
      if (!a) return;
      a.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return; // new tab keeps working
        e.preventDefault();
        open(it);
      });
    });
    closeBtn.addEventListener('click', close);
    stage.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const s = target.closest?.('[data-step]');
      if (s) step(parseInt(s.getAttribute('data-step') || '0', 10));
      // the empty area around the photo closes it too (28.10: the slide covered the whole stage)
      else if (target === stage || target === slide) close();
    });
    stage.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'Tab') {
        // keep focus inside the dialog
        const f = stage.querySelectorAll<HTMLElement>('button');
        const firstB = f[0];
        const lastB = f[f.length - 1];
        if (e.shiftKey && document.activeElement === firstB) {
          e.preventDefault();
          lastB.focus();
        } else if (!e.shiftKey && document.activeElement === lastB) {
          e.preventDefault();
          firstB.focus();
        }
      }
    });
    let x0: number | null = null; // swipe on the slide (touch); the page is locked while open
    stage.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') x0 = e.clientX;
    });
    stage.addEventListener('pointercancel', () => (x0 = null));
    stage.addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
    });
  },

  /* ================= fill (library, verbatim) ================= */
  fill(el, reduce) {
    if (reduce) return;
    const hasIO = 'IntersectionObserver' in window;
    const n = splitWords(el, 'ix-fill');
    const words = el.querySelectorAll('.ix-fill__w');
    const from = parseFloat(el.getAttribute('data-from') || '0.85');
    const to = parseFloat(el.getAttribute('data-to') || '0.35');
    let active = !hasIO;
    let last = -1;
    const update = () => {
      if (!active || !el.isConnected) return;
      const on = Math.round(progress(el, from, to) * n);
      if (on === last) return;
      last = on;
      words.forEach((w, k) => w.classList.toggle('is-on', k < on));
    };
    let io: IntersectionObserver | undefined;
    if (hasIO) {
      io = new IntersectionObserver((en) => {
        active = en[0].isIntersecting;
        schedule();
      });
      io.observe(el);
    }
    loop.push({ el, update, io });
    schedule();
  },
};

function init(root: ParentNode) {
  sweepStages();
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.querySelectorAll<IxElement>('[data-ix]').forEach((el) => {
    if (el.__ixDone) return;
    const fn = handlers[el.getAttribute('data-ix') ?? ''];
    if (!fn) return;
    el.__ixDone = true;
    fn(el, reduce);
  });
  schedule();
}

/** Renders nothing; wires `[data-ix]` blocks on the current page. */
export function Interactions() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.classList.add('ix-js');
    listen();
    init(document);
  }, [pathname]);

  return null;
}
