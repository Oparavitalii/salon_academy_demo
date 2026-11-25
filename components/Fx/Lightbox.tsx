'use client';

import { useEffect } from 'react';

import { usePathname } from '@/i18n/navigation';

/**
 * Lightbox (T-06, owner 31.10.2026 «галереї не мають зараз при натисканні слайдів»): one site-wide
 * full-screen slideshow for every photo set marked `[data-gallery]` (optional `data-gallery-label`).
 * A click on a photo opens it; ✕ · ‹ › · swipe · Esc / ← → · tap on the scrim; focus trapped and
 * returned; page scroll locked while open; neighbours preloaded. Event delegation on `document`, so
 * it needs no per-page wiring and survives client navigation. The Portfolio grid keeps its own
 * `.ix-flip` viewer (components/Interactions). Styles: app/styles/lightbox.css.
 * Skipped: decorative images (`alt=""`, inside `aria-hidden`), images < 120 px, images inside a link
 * (they keep navigating) unless the link carries `data-gallery-link`.
 */

const UI: Record<
  string,
  { close: string; prev: string; next: string; label: string }
> = {
  uk: {
    close: 'Закрити',
    prev: 'Попереднє',
    next: 'Наступне',
    label: 'Галерея',
  },
  pl: {
    close: 'Zamknij',
    prev: 'Poprzednie',
    next: 'Następne',
    label: 'Galeria',
  },
  en: { close: 'Close', prev: 'Previous', next: 'Next', label: 'Gallery' },
};
const ui = () => UI[document.documentElement.lang?.slice(0, 2)] ?? UI.uk;
const MIN = 96; // master avatars are 96–112 px
const SWIPE = 40;

type Slide = {
  thumb: HTMLImageElement;
  src: string;
  caption: string;
  alt: string;
};

function eligible(img: HTMLImageElement, root: Element): boolean {
  if (!img.alt.trim() || img.closest('[aria-hidden="true"]')) return false;
  const a = img.closest('a[href]');
  if (a && root.contains(a) && !a.hasAttribute('data-gallery-link'))
    return false;
  const r = img.getBoundingClientRect();
  return r.width >= MIN || r.height >= MIN; // hidden (filtered / display:none) → 0 × 0
}

/** The sharpest srcset candidate the screen can use; falls back to currentSrc / src. */
function bigSrc(img: HTMLImageElement): string {
  const want = window.innerWidth * (window.devicePixelRatio || 1);
  const set = (img.getAttribute('srcset') || '')
    .split(/,\s+/)
    .map((s) => {
      const [url, w] = s.trim().split(/\s+/);
      return { url, w: parseInt(w || '0', 10) };
    })
    .filter((c) => c.url && c.w)
    .sort((a, b) => a.w - b.w);
  if (!set.length) return img.currentSrc || img.src;
  const hit = set.find((c) => c.w >= want) ?? set[set.length - 1];
  return new URL(hit.url, location.href).href;
}

function slidesOf(root: Element): Slide[] {
  return Array.from(root.querySelectorAll('img'))
    .filter((img) => eligible(img, root))
    .map((img) => {
      const cap = img
        .closest('figure')
        ?.querySelector('figcaption')
        ?.textContent?.trim();
      return {
        thumb: img,
        src: bigSrc(img),
        caption: cap || img.alt,
        alt: img.alt,
      };
    });
}

function labelOf(root: Element): string {
  // the section heading names the set; an inner h3 (a card title) does not
  return (
    root.getAttribute('data-gallery-label') ||
    root.closest('section')?.querySelector('h2')?.textContent?.trim() ||
    root.querySelector('h2, h3')?.textContent?.trim() ||
    ui().label
  );
}

/** Builds the dialog once and wires its controls; returns open / close. */
function createViewer() {
  const reduced = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = document.createElement('div');
  el.className = 'lb';
  el.hidden = true;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  const button = (cls: string, text: string) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `lb__btn ${cls}`;
    b.textContent = text;
    return b;
  };
  const closeBtn = button('lb__close', '✕');
  const prevBtn = button('lb__nav lb__prev', '‹');
  const nextBtn = button('lb__nav lb__next', '›');
  const stage = document.createElement('div');
  stage.className = 'lb__stage';
  const pic = document.createElement('img');
  pic.className = 'lb__img';
  pic.decoding = 'async';
  pic.alt = '';
  stage.appendChild(pic);
  const bar = document.createElement('div');
  bar.className = 'lb__bar';
  const cap = document.createElement('p');
  cap.className = 'lb__cap';
  const count = document.createElement('span');
  count.className = 'lb__count';
  count.setAttribute('aria-live', 'polite');
  bar.append(cap, count);
  el.append(stage, prevBtn, nextBtn, bar, closeBtn);
  document.body.appendChild(el);

  let slides: Slide[] = [];
  let i = 0;
  let opener: HTMLImageElement | null = null;
  const html = document.documentElement;

  function show(dir: number) {
    const s = slides[i];
    pic.src = s.src;
    pic.alt = s.alt;
    cap.textContent = s.caption;
    count.textContent = `${i + 1} / ${slides.length}`;
    const many = slides.length > 1;
    prevBtn.hidden = nextBtn.hidden = !many;
    count.hidden = !many;
    if (dir && !reduced() && pic.animate)
      pic.animate(
        [
          { transform: `translateX(${dir * 48}px)`, opacity: 0 },
          { transform: 'none', opacity: 1 },
        ],
        { duration: 260, easing: 'cubic-bezier(.2,.7,.2,1)' },
      );
    // preload the neighbours
    for (const d of [1, -1]) {
      const n = slides[(i + d + slides.length) % slides.length];
      if (n && n !== s) new Image().src = n.src;
    }
  }
  function step(d: number) {
    if (slides.length < 2) return;
    i = (i + d + slides.length) % slides.length;
    show(d);
  }
  function open(list: Slide[], at: number, label: string) {
    slides = list;
    i = at;
    opener = list[at].thumb;
    const t = ui();
    el.setAttribute('aria-label', label);
    closeBtn.setAttribute('aria-label', t.close);
    prevBtn.setAttribute('aria-label', t.prev);
    nextBtn.setAttribute('aria-label', t.next);
    show(0);
    el.hidden = false;
    html.classList.add('lb-open');
    requestAnimationFrame(() => el.classList.add('is-open'));
    closeBtn.focus({ preventScroll: true });
  }
  function close() {
    if (el.hidden) return;
    el.hidden = true;
    el.classList.remove('is-open');
    html.classList.remove('lb-open');
    const back = opener;
    opener = null;
    if (back?.isConnected) {
      // an <img> is not focusable on its own: make it so for the return trip only
      if (!back.hasAttribute('tabindex')) {
        back.setAttribute('tabindex', '-1');
        back.addEventListener('blur', () => back.removeAttribute('tabindex'), {
          once: true,
        });
      }
      back.focus({ preventScroll: true });
    }
  }

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(1));
  let swiped = false;
  el.addEventListener('click', (e) => {
    if (swiped) {
      swiped = false;
      return;
    }
    if (e.target === el || e.target === stage || e.target === bar) close();
  });
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'Tab') {
      const f = Array.from(el.querySelectorAll<HTMLElement>('button')).filter(
        (b) => !b.hidden,
      );
      const first = f[0];
      const last = f[f.length - 1];
      if (!el.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  // swipe (touch / pen); a horizontal drag past the threshold changes the photo
  let x0: number | null = null;
  let y0 = 0;
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' || !e.isPrimary) return;
    x0 = e.clientX;
    y0 = e.clientY;
  });
  el.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    const dy = e.clientY - y0;
    x0 = null;
    if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy)) {
      swiped = true;
      setTimeout(() => (swiped = false), 400);
      step(dx < 0 ? 1 : -1);
    }
  });
  el.addEventListener('pointercancel', () => (x0 = null));

  return { open, close, isOpen: () => !el.hidden, el };
}

let viewer: ReturnType<typeof createViewer> | null = null;

/** Document click → the gallery photo under the pointer, or null. */
function photoAt(
  e: MouseEvent,
): { root: Element; img: HTMLImageElement } | null {
  const target = e.target as Element | null;
  const root = target?.closest?.('[data-gallery]');
  if (!root || !target) return null;
  let img = target.closest('img');
  if (!img) {
    // an overlay (tape, gradient, badge) above the photo — but never a control
    if (
      target.closest('a[href], button, input, select, textarea, label, summary')
    )
      return null;
    img =
      (document
        .elementsFromPoint(e.clientX, e.clientY)
        .find((n) => n instanceof HTMLImageElement && root.contains(n)) as
        | HTMLImageElement
        | undefined) ?? null;
  }
  if (!img || !root.contains(img) || !eligible(img, root)) return null;
  return { root, img };
}

function onClick(e: MouseEvent) {
  if (
    e.defaultPrevented ||
    e.button > 0 ||
    e.metaKey ||
    e.ctrlKey ||
    e.shiftKey ||
    e.altKey
  )
    return;
  const hit = photoAt(e);
  if (!hit) return;
  const list = slidesOf(hit.root);
  const at = list.findIndex((s) => s.thumb === hit.img);
  if (at < 0) return;
  e.preventDefault();
  viewer ??= createViewer();
  viewer.open(list, at, labelOf(hit.root));
}

/** Renders nothing; one document listener opens `[data-gallery]` photos full screen. */
export function Lightbox() {
  const pathname = usePathname();
  useEffect(() => {
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
  // a route change closes an open viewer (its photos left the page)
  useEffect(() => {
    if (viewer?.isOpen()) viewer.close();
  }, [pathname]);
  return null;
}
