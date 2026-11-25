'use client';

import { useEffect, useState } from 'react';

import { Link, usePathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

/**
 * Phone bottom bar (T-08, owner 31.10.2026): «Салон» | «Курси» — two equal halves, dark salon,
 * light academy, icon and label centred in each. The DEMO badge between them is gone since 16.11.2026
 * (Daryna: «залишити верхнє лого і забрати між кнопками» — the header logo leads home).
 * Styles: app/styles/bottom_bar.css.
 */

const COPY: Record<Locale, { nav: string; salon: string; courses: string }> = {
  uk: {
    nav: 'Розділи сайту',
    salon: 'Салон',
    courses: 'Курси',
  },
  pl: {
    nav: 'Sekcje strony',
    salon: 'Salon',
    courses: 'Kursy',
  },
  en: {
    nav: 'Site sections',
    salon: 'Salon',
    courses: 'Courses',
  },
};

// Routes with their own chrome: the bar is not rendered there.
const HIDDEN_PREFIXES = ['/admin', '/cabinet', '/login', '/checkout'];

function startsWith(path: string, prefix: string) {
  return path === prefix || path.startsWith(`${prefix}/`);
}

// True while the burger menu, a modal dialog (gallery viewer) or a scroll lock is active.
function overlayOpen(): boolean {
  const html = document.documentElement;
  if (
    html.style.overflow === 'hidden' ||
    document.body.style.overflow === 'hidden'
  )
    return true;
  if (document.querySelector('header button[aria-expanded="true"]'))
    return true;
  if (document.querySelector('.lb[open]')) return true;
  const dialogs = document.querySelectorAll<HTMLElement>(
    '[role="dialog"][aria-modal="true"]',
  );
  for (const d of dialogs) {
    if (!d.hidden && d.offsetParent !== null) return true;
  }
  return false;
}

export function BottomBar({ locale }: { locale: Locale }) {
  const pathname = usePathname() || '/';
  const [hidden, setHidden] = useState(false);
  const skip = HIDDEN_PREFIXES.some((p) => startsWith(pathname, p));

  useEffect(() => {
    if (skip) return;
    // rAF-throttled: animations mutate styles often, check at most once per frame.
    let frame = 0;
    const sync = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setHidden(overlayOpen());
      });
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [
        'style',
        'aria-expanded',
        'open',
        'hidden',
        'aria-modal',
      ],
    });
    return () => {
      mo.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [skip, pathname]);

  if (skip) return null;

  const t = COPY[locale] ?? COPY.uk;
  const salonOn = startsWith(pathname, '/salon');
  const coursesOn = startsWith(pathname, '/courses');

  return (
    <nav
      className={`bottom_bar ${coursesOn ? 'bottom_bar--academy' : 'bottom_bar--salon'}${hidden ? ' is_hidden' : ''}`}
      aria-label={t.nav}
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
    >
      <span className='bottom_bar_bg' aria-hidden='true' />

      <Link
        href='/salon'
        className='bottom_bar_tab bottom_bar_tab--salon'
        aria-current={salonOn ? 'page' : undefined}
      >
        <svg
          className='bottom_bar_icon'
          viewBox='0 0 24 24'
          width='22'
          height='22'
          aria-hidden='true'
        >
          {/* scissors */}
          <circle cx='6' cy='6' r='3' />
          <circle cx='6' cy='18' r='3' />
          <path d='M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12' />
        </svg>
        <span className='bottom_bar_label'>{t.salon}</span>
      </Link>

      <Link
        href='/courses'
        className='bottom_bar_tab bottom_bar_tab--academy'
        aria-current={coursesOn ? 'page' : undefined}
      >
        <svg
          className='bottom_bar_icon'
          viewBox='0 0 24 24'
          width='22'
          height='22'
          aria-hidden='true'
        >
          {/* graduation cap */}
          <path d='M2 9.5 12 5l10 4.5L12 14 2 9.5Z' />
          <path d='M6 11.3V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.7M22 9.5V15' />
        </svg>
        <span className='bottom_bar_label'>{t.courses}</span>
      </Link>
    </nav>
  );
}
