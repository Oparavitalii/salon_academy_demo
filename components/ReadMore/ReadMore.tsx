'use client';

import { useEffect, useId, useRef, useState } from 'react';

type Props = {
  /** Paragraphs of the full text. */
  paragraphs: string[];
  /**
   * Short excerpt shown until «Читати повністю» — the full text then enters the DOM only on click
   * (a long Russian story would otherwise outweigh the PL / EN page text, Release floor F2).
   */
  preview?: string;
  lang?: string;
  more: string;
  less: string;
  /** Lines shown before «Читати повністю». */
  lines?: number;
  className?: string;
};

/**
 * Full review / story text, clamped to a few lines with a «Читати повністю» toggle (owner 28.10:
 * «полное описание отзыва … с кнопкой показать больше»). The whole text is in the HTML (SEO —
 * crawlers read all of it); the button appears only when the text actually overflows.
 */
export function ReadMore({
  paragraphs,
  preview,
  lang,
  more,
  less,
  lines = 5,
  className = '',
}: Props) {
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const check = () => {
      if (el.dataset.open === 'true' || preview) return;
      setOverflow(el.scrollHeight > el.clientHeight + 2);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [preview]);

  return (
    <div className={`read_more ${className}`}>
      <div
        ref={box}
        id={id}
        className='read_more_text'
        data-clamp={preview ? 'false' : 'true'}
        data-open={open ? 'true' : 'false'}
        data-overflow={overflow ? 'true' : 'false'}
        style={{ ['--rm-lines' as string]: lines }}
        lang={lang}
      >
        {preview && !open ? (
          <p>{preview}</p>
        ) : (
          paragraphs.map((p, i) => <p key={i}>{p}</p>)
        )}
      </div>
      {(overflow || open || preview) && (
        <button
          type='button'
          className='read_more_btn hv-link'
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? less : more}
        </button>
      )}
    </div>
  );
}
