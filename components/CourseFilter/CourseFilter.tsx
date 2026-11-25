'use client';

import { useState, type ReactNode } from 'react';

export type CourseKind = 'online' | 'offline';
type Filter = 'all' | CourseKind;

type Props = {
  label: string;
  labels: Record<Filter, string>;
  counts: Record<Filter, number>;
  children: ReactNode;
};

/**
 * «Усі · Онлайн · Офлайн» tabs over a course list (owner 28.10: «разделить оффлайн онлайн и сделать
 * фильтрацию удобную»). The list is server-rendered in full; each item carries `data-kind` and the
 * CSS hides the other format, so the page works and is indexed without JS.
 */
export function CourseFilter({ label, labels, counts, children }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const keys: Filter[] = ['all', 'online', 'offline'];
  return (
    <div className='course_filter' data-filter={filter}>
      <div className='filter_tabs' role='group' aria-label={label}>
        {keys.map((k) => (
          <button
            key={k}
            type='button'
            className={`filter_tab${filter === k ? ' is_active' : ''}`}
            aria-pressed={filter === k}
            onClick={() => setFilter(k)}
          >
            {labels[k]}
            <span className='filter_count' aria-hidden='true'>
              {counts[k]}
            </span>
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
