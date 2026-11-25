'use client';

import { type RefObject, useEffect } from 'react';

/** Same breakpoint as layout.css: from here the desktop nav shows and the burger hides. */
export const DESKTOP_MQ = '(min-width: 1200px)';

/** Stagger index for an item (`--i`, read by burger.css). */
export const stagger = (i: number) => ({ '--i': i }) as React.CSSProperties;

/**
 * Siblings of every ancestor of `el` up to <body> — i.e. the page behind the menu.
 * Already-inert nodes are skipped so closing never un-inerts something we did not touch.
 */
function pageBehind(el: HTMLElement): HTMLElement[] {
  const out: HTMLElement[] = [];
  let node: HTMLElement | null = el;
  while (node && node !== document.body) {
    const parent: HTMLElement | null = node.parentElement;
    if (!parent) break;
    for (const sib of Array.from(parent.children)) {
      if (sib !== node && sib instanceof HTMLElement && !sib.inert)
        out.push(sib);
    }
    node = parent;
  }
  return out;
}

/**
 * The full-screen burger's behaviour while it is open — shared by the site header (MobileMenu) and
 * the admin header (AdminBurger, owner 08.11.2026: «меню в адмінці по стилю таке як на головній»):
 * scroll lock, the page behind made inert, focus into the panel, Escape, a focus trap over the
 * burger + panel, and closing when the window crosses into the desktop width.
 */
export function useBurgerPanel({
  open,
  setOpen,
  headerRef,
  burgerRef,
  panelRef,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  headerRef: RefObject<HTMLElement | null>;
  burgerRef: RefObject<HTMLButtonElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
}) {
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const panel = panelRef.current;
    const burger = burgerRef.current;
    html.classList.add('bm-lock');
    const behind = headerRef.current ? pageBehind(headerRef.current) : [];
    behind.forEach((el) => (el.inert = true));

    const focusables = () =>
      panelRef.current
        ? Array.from(
            panelRef.current.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
            ),
          ).filter((el) => el.getClientRects().length > 0)
        : [];
    // The panel itself takes focus (tabIndex -1), not its first link: Safari drew the focus frame round
    // «САЛОН» on every tap open (owner 23.11 «прибрати такі рамки»). Tab still walks the links.
    (panel ?? focusables()[0])?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        burgerRef.current?.focus({ preventScroll: true });
        return;
      }
      // Tab / Shift+Tab cycle inside burger + panel only.
      if (e.key !== 'Tab' || !burgerRef.current) return;
      const ring = [burgerRef.current, ...focusables()];
      const first = ring[0];
      const last = ring[ring.length - 1];
      const current = document.activeElement as HTMLElement | null;
      const inside = current !== null && ring.includes(current);
      if (e.shiftKey && (current === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (current === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);

    // Crossing into desktop width hides the panel via CSS — it must not stay "open".
    const mq = window.matchMedia(DESKTOP_MQ);
    const onMq = () => mq.matches && setOpen(false);
    mq.addEventListener('change', onMq);

    return () => {
      html.classList.remove('bm-lock');
      behind.forEach((el) => (el.inert = false));
      document.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onMq);
      // Focus left inside the now-inert panel (or dropped to <body>) goes back to the burger.
      const a = document.activeElement;
      if (!a || a === document.body || panel?.contains(a)) {
        burger?.focus({ preventScroll: true });
      }
    };
  }, [open, setOpen, headerRef, burgerRef, panelRef]);
}
