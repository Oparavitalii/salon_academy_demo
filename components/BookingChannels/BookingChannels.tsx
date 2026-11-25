import type { Locale } from '@/i18n/routing';
import { bookingChannels, bookingCopy as c } from '@/lib/content/site';
import { t } from '@/lib/i18n/t';

import { Icon } from '../Icons/Icons';

type Props = {
  locale: Locale;
  /** `section` = its own block (/contacts) · `panel` = inside another block (Location, Philosophy, PriceCard). */
  as?: 'section' | 'panel';
  id?: string;
  /** Heading level inside a parent block. */
  headingLevel?: 'h2' | 'h3';
  /** `section` only: the channels sit in the bordered panel /about uses (/contacts, Oksana 16.11 M-19). */
  framed?: boolean;
};

/**
 * BookingChannels → Contact24 (FR-23) — one component for `/salon` (Location), `/about`
 * (Philosophy), `/contacts`, the header «Обрати» and the intensive without payment. Six channels:
 * Booksy · Instagram · phone · WhatsApp · Telegram · SMS, all on +48 555 010 010 (E-25). External
 * channels open in a new tab; `tel:` / `sms:` stay in the tab. Telegram drops out when
 * `contacts.telegram` is null (Q-37). Copy: 9_Text.md → Наскрізні → BookingChannels.
 */
export function BookingChannels({
  locale,
  as = 'section',
  id = 'booking',
  headingLevel,
  framed = false,
}: Props) {
  const H = headingLevel ?? (as === 'section' ? 'h2' : 'h3');
  const panelLook = as === 'panel' || framed;
  const body = (
    <div className='booking'>
      <div className='booking_head'>
        <H className={`display ${panelLook ? 'display_md' : 'display_lg'}`}>
          {t(c.heading, locale)}
        </H>
        <p className='booking_text'>{t(c.body, locale)}</p>
      </div>
      <ul className='booking_list'>
        {bookingChannels.map((ch) => {
          const label =
            typeof ch.label === 'string' ? ch.label : t(ch.label, locale);
          const external = /^https?:/.test(ch.href);
          return (
            <li key={ch.id}>
              <a
                className={`booking_btn booking_btn_${ch.id}`}
                href={ch.href}
                {...(external ? { target: '_blank', rel: 'noopener' } : {})}
              >
                <Icon name={ch.id} />
                <span>{label}</span>
              </a>
            </li>
          );
        })}
      </ul>
      <p className='booking_caption caption'>{t(c.caption, locale)}</p>
    </div>
  );

  if (as === 'panel')
    return (
      <div className='booking_panel' id={id}>
        {body}
      </div>
    );
  return (
    <section
      className={`sec sec_page${framed ? ' booking_sec_framed' : ''}`}
      id={id}
    >
      <div className='wrap'>
        {framed ? <div className='booking_panel'>{body}</div> : body}
      </div>
    </section>
  );
}
