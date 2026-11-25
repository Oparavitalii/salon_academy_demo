'use client';

import { useEffect, useRef } from 'react';

import { Link } from '@/i18n/navigation';

export type ChooseItem = { href: string; label: string };

type Props = { label: string; items: ChooseItem[] };

/**
 * «Обрати» — the global CTA of Header_Site (5.0_Sitemap → Navigation). A native `<details>`
 * dropdown, so it opens without JS; the script only closes it on an outside click, Escape
 * or after a choice.
 */
export function ChooseMenu({ label, items }: Props) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const close = () => el.removeAttribute('open');
    const onDoc = (e: MouseEvent) => {
      if (el.open && !el.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && el.open) {
        close();
        el.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <details className='choose' ref={ref}>
      <summary className='btn btn_sm hv-btn-glow'>
        {label}
        <span className='choose_caret' aria-hidden='true' />
      </summary>
      <div className='choose_menu'>
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className='choose_item'
            onClick={() => ref.current?.removeAttribute('open')}
          >
            {it.label}
          </Link>
        ))}
      </div>
    </details>
  );
}
