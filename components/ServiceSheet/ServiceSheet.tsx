'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Link } from '@/i18n/navigation';
import type { DirectionSheet } from '@/lib/services/directionSheets';

type Props = {
  sheets: DirectionSheet[];
  book: { label: string; href: string };
  closeLabel: string;
};

/**
 * ServiceSheet (Daryna 03.11.2026: «натиснути на Фарбування або Догляд, щоб відкривався повний
 * перелік відповідних послуг із цінами»; owner 06.11: «Відкривається список тут»).
 * One per page. Any element with `data-sheet="<direction id>"` — the first-screen tiles and the
 * SERVICES carousel cards — opens a native modal `<dialog>` with that direction's groups and
 * prices: a bottom sheet on phones, a centred panel from 768 px. Esc, ✕ and a tap on the backdrop
 * close it; focus returns to the tile. Without JS the tile stays a plain link to the price list.
 */
export function ServiceSheet({ sheets, book, closeLabel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [id, setId] = useState<string | null>(null);
  const sheet = sheets.find((s) => s.id === id) ?? null;

  const close = useCallback(() => ref.current?.close(), []);

  useEffect(() => {
    // Capture phase on window: runs before the Link's own click handler, which then sees
    // defaultPrevented and does not navigate.
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const el = (e.target as Element | null)?.closest?.('[data-sheet]');
      if (!el) return;
      const next = el.getAttribute('data-sheet');
      if (!next || !sheets.some((s) => s.id === next)) return;
      e.preventDefault();
      setId(next);
    };
    window.addEventListener('click', onClick, true);
    return () => window.removeEventListener('click', onClick, true);
  }, [sheets]);

  // Open after the content for the new id has rendered; lock the page scroll while open
  // (the phone bottom bar hides itself on that lock).
  useEffect(() => {
    const d = ref.current;
    if (!d || !id || d.open) return;
    d.showModal();
    d.scrollTop = 0;
    document.documentElement.style.overflow = 'hidden';
  }, [id]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onClose = () => {
      document.documentElement.style.overflow = '';
      setId(null);
    };
    d.addEventListener('close', onClose);
    return () => d.removeEventListener('close', onClose);
  }, []);

  return (
    <dialog
      ref={ref}
      className='svc_sheet'
      aria-labelledby='svc_sheet_title'
      onClick={(e) => {
        // a click on the backdrop lands on the dialog element itself
        if (e.target === e.currentTarget) close();
      }}
    >
      {sheet && (
        <div className='svc_sheet_inner'>
          <div className='svc_sheet_head'>
            <h2 id='svc_sheet_title' className='svc_sheet_title'>
              {sheet.title}
            </h2>
            <button
              type='button'
              className='svc_sheet_close'
              onClick={close}
              aria-label={closeLabel}
            >
              <svg
                viewBox='0 0 24 24'
                width='22'
                height='22'
                aria-hidden='true'
              >
                <path d='M6 6l12 12M18 6 6 18' />
              </svg>
            </button>
          </div>
          <div className='svc_sheet_body'>
            {sheet.groups.map((g) => (
              <section key={g.id} className='svc_sheet_group' data-group={g.id}>
                {sheet.groups.length > 1 && (
                  <h3 className='svc_sheet_group_name'>{g.name}</h3>
                )}
                {g.description && (
                  <p className='svc_sheet_desc'>{g.description}</p>
                )}
                <ul className='svc_sheet_rows'>
                  {g.rows.map((r) => (
                    <li key={r.key} className='svc_sheet_row'>
                      <span className='svc_sheet_name'>
                        {r.name}
                        {r.meta && (
                          <span className='svc_sheet_meta'>{r.meta}</span>
                        )}
                      </span>
                      {r.price !== null && (
                        <span
                          className={
                            r.priceIsNote
                              ? 'svc_sheet_price is_note'
                              : 'svc_sheet_price'
                          }
                        >
                          {r.price}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <div className='svc_sheet_foot'>
            {book.href.startsWith('#') ? (
              <a
                className='btn svc_sheet_book'
                href={book.href}
                onClick={close}
              >
                {book.label}
              </a>
            ) : (
              <Link
                className='btn svc_sheet_book'
                href={book.href}
                onClick={close}
              >
                {book.label}
              </Link>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
