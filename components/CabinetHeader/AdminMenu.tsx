'use client';

import { useEffect, useRef } from 'react';

/**
 * Admin menu on phones and tablets (< 1200 px): a native `<details>` with the current section on
 * the button, so it opens without JS. The script only closes it after a tap on a link, an outside
 * tap or Escape. The links and the logout form come in as `children` from the server header.
 */
export function AdminMenu({
  label,
  current,
  children,
}: {
  label: string;
  current: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const close = () => el.removeAttribute('open');
    const onDoc = (e: MouseEvent) => {
      if (!el.open) return;
      const t = e.target as Element;
      if (!el.contains(t) || t.closest('.admin_menu_panel a')) close();
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
    <details className='admin_menu' ref={ref}>
      <summary className='admin_menu_btn'>
        <span className='visually_hidden'>{label}: </span>
        <span className='admin_menu_icon' aria-hidden='true'>
          <span />
          <span />
          <span />
        </span>
        <span className='admin_menu_current'>{current}</span>
      </summary>
      <nav className='admin_menu_panel' aria-label={label}>
        {children}
      </nav>
    </details>
  );
}
