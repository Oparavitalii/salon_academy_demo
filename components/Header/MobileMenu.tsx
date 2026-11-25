'use client';

import { useTranslations } from 'next-intl';
import { useId, useRef, useState } from 'react';

import { Link, usePathname } from '@/i18n/navigation';
import { address, contacts } from '@/lib/content/site';
import type { Theme } from '@/lib/theme';

import { stagger, useBurgerPanel } from './useBurgerPanel';
import { LanguageRow } from '../LanguageSwitcher/LanguagePill';

type Item = { href: string; label: string };

type Props = {
  openLabel: string;
  closeLabel: string;
  items: Item[];
  /** «Обрати» and its two choices, repeated in the menu (5.0_Sitemap → MobileMenu). */
  choose: { label: string; items: Item[] } | null;
  cabinet: Item | null;
  active?: string;
  /** Page theme → `<header data-theme>`; the panel inherits it (4.2 § Theme scopes). */
  theme: Theme;
  children: React.ReactNode;
};

/**
 * The header frame + full-screen burger menu (< 1200 px). Server-rendered children sit inside.
 * Ported from kl Skills/Web_Effects/Web_Burger_Menu (variant A `.bm-panel--full`):
 * two-line icon → cross, fade-in panel, staggered links, accent marker, contacts at the bottom.
 */
export function MobileMenu({
  openLabel,
  closeLabel,
  items,
  choose,
  cabinet,
  active,
  theme,
  children,
}: Props) {
  const th = useTranslations('header');
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const hasMenu = items.length > 0 || choose !== null;
  const headerRef = useRef<HTMLElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on navigation (back / forward included): adjust state during render, no effect.
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  // While open: scroll lock, inert page behind, focus into the panel, Escape + focus trap.
  useBurgerPanel({ open, setOpen, headerRef, burgerRef, panelRef });

  const close = () => setOpen(false);
  const cabinetIndex = items.length;
  const chooseIndex = items.length + (cabinet ? 1 : 0);
  const contactsIndex = chooseIndex + (choose ? 1 : 0);

  return (
    <header
      ref={headerRef}
      className={`header bm-header${open ? ' is-menuOpen' : ''}`}
      data-theme={theme}
    >
      <div className='wrap header_inner'>
        {children}
        {hasMenu && (
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
        )}
      </div>
      {hasMenu && (
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
              {items.map((n, i) => (
                <li key={n.href} className='bm-item' style={stagger(i)}>
                  <Link
                    href={n.href}
                    className='bm-link'
                    aria-current={active === n.href ? 'page' : undefined}
                    onClick={close}
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
              {cabinet && (
                <li className='bm-item' style={stagger(cabinetIndex)}>
                  <Link
                    href={cabinet.href}
                    className='bm-link bm-link--small'
                    aria-current={active === cabinet.href ? 'page' : undefined}
                    onClick={close}
                  >
                    {cabinet.label}
                  </Link>
                </li>
              )}
            </ul>
          </nav>
          {choose && (
            <div className='bm-item bm-choose' style={stagger(chooseIndex)}>
              <p className='bm-choose__label'>{choose.label}</p>
              {choose.items.map((c, i) => (
                <Link
                  key={c.href}
                  className={
                    i === 0 ? 'btn btn_block' : 'btn btn_block btn_outline'
                  }
                  href={c.href}
                  onClick={close}
                >
                  {c.label}
                </Link>
              ))}
            </div>
          )}
          <div className='bm-langs' style={stagger(contactsIndex)}>
            <LanguageRow label={th('langLabel')} />
          </div>
          <ul
            className='bm-contacts'
            role='list'
            style={stagger(contactsIndex)}
          >
            <li>
              <a href={contacts.phone.href}>{contacts.phone.label}</a>
            </li>
            {contacts.email && (
              <li>
                <a href={`mailto:${contacts.email}`}>{contacts.email}</a>
              </li>
            )}
            <li>
              <a
                href={contacts.instagramSalon.url}
                target='_blank'
                rel='noopener noreferrer'
              >
                {contacts.instagramSalon.handle}
              </a>
            </li>
            <li>
              <a
                href={address.mapsUrl}
                target='_blank'
                rel='noopener noreferrer'
              >
                {address.line}
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
