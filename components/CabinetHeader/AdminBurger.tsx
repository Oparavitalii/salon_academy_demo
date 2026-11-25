'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { Link, usePathname } from '@/i18n/navigation';

import { stagger, useBurgerPanel } from '../Header/useBurgerPanel';
import { LanguageRow } from '../LanguageSwitcher/LanguagePill';

type Item = { href: string; label: string; current: boolean };

/**
 * The admin menu on phones and tablets (< 1200 px) — the site's burger (owner 08.11.2026: «Меню в
 * адмінці теж по стилю таке як на головній», the admin's own light colours): the two-line icon that
 * turns into a cross and the full-screen panel with staggered links (burger.css, MobileMenu). The five
 * task sections as the big links, Профіль as a quiet row, Вийти (a server-action form passed in as
 * `children`), the language row at the bottom — the floating pill hides where a burger is
 * (burger.css). From 1200 px the inline nav + «Акаунт» of AdminHeader stay as they were.
 */
export function AdminBurger({
  openLabel,
  closeLabel,
  langLabel,
  items,
  extra,
  children,
}: {
  openLabel: string;
  closeLabel: string;
  langLabel: string;
  items: Item[];
  /** Quieter rows under the sections (Профіль). */
  extra: Item[];
  /** The logout form; its button carries `bm-link bm-link--small`. */
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const headerRef = useRef<HTMLElement | null>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // The header is rendered by the server (AdminHeader): find it once, and mark it open the way
  // MobileMenu does (`.bm-header.is-menuOpen` pins it to the screen and lifts the logo).
  useEffect(() => {
    headerRef.current = burgerRef.current?.closest('header') ?? null;
  }, []);
  useEffect(() => {
    headerRef.current?.classList.toggle('is-menuOpen', open);
  }, [open]);

  // Close on navigation (back / forward included): adjust state during render, no effect.
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useBurgerPanel({ open, setOpen, headerRef, burgerRef, panelRef });

  const close = () => setOpen(false);
  const link = (n: Item, i: number, small = false) => (
    <li key={n.href} className='bm-item' style={stagger(i)}>
      <Link
        href={n.href}
        className={small ? 'bm-link bm-link--small' : 'bm-link'}
        aria-current={n.current ? 'page' : undefined}
        onClick={close}
      >
        {n.label}
      </Link>
    </li>
  );

  return (
    <>
      <button
        ref={burgerRef}
        type='button'
        className='bm-toggle'
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? closeLabel : openLabel}
        onClick={() => setOpen((v) => !v)}
      >
        <span className='bm-icon' aria-hidden='true'>
          <span className='bm-icon__line' />
          <span className='bm-icon__line' />
        </span>
      </button>
      <div
        ref={panelRef}
        id={panelId}
        className={`bm-panel bm-panel--full${open ? ' is-open' : ''}`}
        tabIndex={-1}
        aria-hidden={!open}
        inert={!open}
      >
        <nav aria-label={openLabel}>
          <ul className='bm-list' role='list'>
            {items.map((n, i) => link(n, i))}
            {extra.map((n, i) => link(n, items.length + i, true))}
            <li
              className='bm-item bm-logout'
              style={stagger(items.length + extra.length)}
            >
              {children}
            </li>
          </ul>
        </nav>
        <div
          className='bm-langs'
          style={stagger(items.length + extra.length + 1)}
        >
          <LanguageRow label={langLabel} />
        </div>
      </div>
    </>
  );
}
