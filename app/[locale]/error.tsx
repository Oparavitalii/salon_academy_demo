'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import type { Theme } from '@/lib/theme';

/** Page theme (4.2_Architecture § Theme scopes, route → theme: dark). */
const theme: Theme = 'dark';

/** 500 — Status_Message (9_Text.md → /500). Decor: `.fx-host` + ghost numeral «500» (8.0 §5). Client boundary: no server header here. */
export default function ErrorPage({ reset }: { reset: () => void }) {
  const tr = useTranslations('serverError');

  return (
    <main data-theme={theme}>
      <section className='sec_page fx-host'>
        <span className='dec_ghost_num' aria-hidden='true'>
          500
        </span>
        <div className='wrap status'>
          <h1 className='display display_lg'>{tr('heading')}</h1>
          <p className='lede'>{tr('body')}</p>
          <button type='button' className='btn hv-btn-glow' onClick={reset}>
            {tr('retry')}
          </button>
          <Link
            className='hv-link'
            href='/'
            style={{ color: 'var(--color-accent-text)' }}
          >
            {tr('home')}
          </Link>
        </div>
      </section>
    </main>
  );
}
