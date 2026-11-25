'use client';

import { useLocale } from 'next-intl';
import { useEffect, useRef } from 'react';

import { Link, usePathname } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';

/** Each language in its own name — a reader who does not know the current language still finds theirs. */
const NAMES: Record<Locale, string> = {
  uk: 'Українська',
  pl: 'Polski',
  en: 'English',
};
const SHORT: Record<Locale, string> = {
  uk: 'UK',
  pl: 'PL',
  en: 'EN',
};

/**
 * Floating language pill, bottom-right on every public and cabinet page (owner 27.10: «перемикач
 * мов справа внизу, як у Befrox»). It replaces the `UK · RU · PL · EN` row in the headers. A native
 * `<details>`: works without JS; with JS it closes on Escape, on an outside click and after a pick.
 * Sits under the cookie layer (banner z-index 1000 / 1001) so it never covers the consent gate.
 * On `/admin` too since 28.10 (owner: «хай буде з перемиканням») — the admin is translated (messages → admin).
 */
export function LanguagePill({ label }: { label: string }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const close = (e: Event) => {
      const d = ref.current;
      if (!d?.open) return;
      if (e instanceof KeyboardEvent) {
        if (e.key !== 'Escape') return;
        d.open = false;
        d.querySelector('summary')?.focus();
        return;
      }
      if (!d.contains(e.target as Node)) d.open = false;
    };
    document.addEventListener('keydown', close);
    document.addEventListener('pointerdown', close);
    return () => {
      document.removeEventListener('keydown', close);
      document.removeEventListener('pointerdown', close);
    };
  }, []);

  return (
    <nav className='lang_pill' aria-label={label}>
      <details ref={ref}>
        <summary
          className='lang_pill_toggle'
          aria-label={`${SHORT[locale]} — ${label}: ${NAMES[locale]}`}
        >
          <svg
            aria-hidden='true'
            viewBox='0 0 24 24'
            width='16'
            height='16'
            fill='none'
            stroke='currentColor'
            strokeWidth='1.6'
          >
            <circle cx='12' cy='12' r='9' />
            <path d='M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z' />
          </svg>
          <span>{SHORT[locale]}</span>
        </summary>
        <ul className='lang_pill_menu'>
          {routing.locales.map((l) => (
            <li key={l}>
              <Link
                href={pathname}
                locale={l}
                hrefLang={l}
                lang={l}
                className={l === locale ? 'is_active' : undefined}
                aria-current={l === locale ? 'true' : undefined}
                onClick={() => {
                  if (ref.current) ref.current.open = false;
                }}
              >
                <span className='lang_pill_code'>{SHORT[l]}</span>
                {NAMES[l]}
              </Link>
            </li>
          ))}
        </ul>
      </details>
    </nav>
  );
}

/**
 * LanguageRow — the four languages as one row of short codes, for the burger panel (owner 1.11:
 * on phones the floating pill covered the content, D-38; the pill shows from 1200 px only).
 */
export function LanguageRow({ label }: { label: string }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  return (
    <nav className='lang_row' aria-label={label}>
      {routing.locales.map((l) => (
        <Link
          key={l}
          href={pathname}
          locale={l}
          hrefLang={l}
          lang={l}
          title={NAMES[l]}
          aria-label={NAMES[l]}
          className={l === locale ? 'is_active' : undefined}
          aria-current={l === locale ? 'true' : undefined}
        >
          {SHORT[l]}
        </Link>
      ))}
    </nav>
  );
}
