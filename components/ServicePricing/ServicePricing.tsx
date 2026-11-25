'use client';

import { useState } from 'react';

export type PriceRow = {
  key: string;
  name: string;
  /** «майстер · 4 год · перший візит 990 zł» — level · duration · extras, already localized. */
  meta: string;
  /** Localized price, or the «ціну називаємо на консультації» line (Q-40); null = no price at all. */
  price: string | null;
  priceIsNote?: boolean;
};

export type PricingGroup = {
  id: string;
  name: string;
  description?: string;
  rows: PriceRow[];
};

type Props = {
  groups: PricingGroup[];
  bookLabel: string;
  bookHref: string;
  tablistLabel: string;
};

/**
 * ServiceCatalog `#services` → Pricing19 (`/salon`, FR-02): one tab per group (9 groups, CS §2,
 * no makeup — E-22); each row = `.row_price` (7.0 §3): name, meta (level · duration · extras),
 * italic price per hair length 1 / 2 / 3 / 4, «Записатися» → the booking channels of the page
 * (`#booking`, FR-23). WAI-ARIA tabs: roving tabindex, ←/→ wrap, Home/End. Without JS the first
 * group shows.
 */
export function ServicePricing({
  groups,
  bookLabel,
  bookHref,
  tablistLabel,
}: Props) {
  const [tab, setTab] = useState(groups[0]?.id ?? '');

  const onKey = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = groups.length;
    const next =
      e.key === 'ArrowRight'
        ? (i + 1) % n
        : e.key === 'ArrowLeft'
          ? (i - 1 + n) % n
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? n - 1
              : -1;
    if (next < 0) return;
    e.preventDefault();
    setTab(groups[next].id);
    document.getElementById(`tab-${groups[next].id}`)?.focus();
  };

  return (
    <div className='pricing'>
      <div
        className='tabs pricing_tabs'
        role='tablist'
        aria-label={tablistLabel}
      >
        {groups.map((g, i) => (
          <button
            key={g.id}
            type='button'
            role='tab'
            id={`tab-${g.id}`}
            aria-selected={tab === g.id}
            aria-controls={`panel-${g.id}`}
            tabIndex={tab === g.id ? 0 : -1}
            className='tab'
            onClick={() => setTab(g.id)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {g.name}
          </button>
        ))}
      </div>
      {groups.map((g) => (
        <div
          key={g.id}
          role='tabpanel'
          id={`panel-${g.id}`}
          aria-labelledby={`tab-${g.id}`}
          hidden={tab !== g.id}
          className='pricing_panel'
        >
          <h3 className='display display_md pricing_group'>{g.name}</h3>
          {g.description && <p className='pricing_desc'>{g.description}</p>}
          <ul className='pricing_rows'>
            {g.rows.map((r) => (
              <li className='row_price' key={r.key}>
                <div className='row_text'>
                  <p className='row_name'>{r.name}</p>
                  {r.meta && <p className='row_meta meta'>{r.meta}</p>}
                </div>
                {r.price !== null ? (
                  <p
                    className={
                      r.priceIsNote ? 'row_note meta' : 'price row_value'
                    }
                  >
                    {r.price}
                  </p>
                ) : (
                  <span aria-hidden='true' />
                )}
                <a
                  className='btn btn_sm btn_outline hv-btn-invert'
                  href={bookHref}
                >
                  {bookLabel}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
