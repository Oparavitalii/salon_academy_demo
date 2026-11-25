import type { Locale } from '@/i18n/routing';
import {
  contactLabels as l,
  contactsPageCopy as c,
  contactsPhotos,
} from '@/lib/content/contacts';
import { address, contacts, hoursLong } from '@/lib/content/site';
import { t } from '@/lib/i18n/t';

import { Scribble } from '../Decorations/Scribble';
import { Icon } from '../Icons/Icons';
import { Pic } from '../Pic/Pic';

/**
 * ContactCards → Contact6 (`/contacts`, H1 of the page): heading with the pink swash under «Demo»
 * (`.dec_scribble`, 8.0 §5), sub-line, five cards — address (→ `#map`), phone (+ «також WhatsApp,
 * Telegram і SMS»), hours, e-mail (`mailto:`, Q-15 answered 22.10), Instagram (salon + courses).
 * Under the cards a strip of five photos (9_Text.md → «Зображень на /contacts» = 6 with the map):
 * the storefront first, two columns wide (shoot 03.11, owner 08.11), then the reception and three works.
 */
export function ContactCards({ locale }: { locale: Locale }) {
  const heading = t(c.heading, locale);
  return (
    <section className='sec sec_page contacts_sec' id='contacts'>
      <div className='wrap'>
        <div className='sec_head contacts_head'>
          <h1 className='display display_xl'>
            <Scribble text={heading} word={t(c.scribble, locale)} />
          </h1>
          <p className='lede'>{t(c.sub, locale)}</p>
        </div>
        <ul className='contact_cards'>
          <li className='card contact_card'>
            <span className='contact_icon'>
              <Icon name='pin' />
            </span>
            <h2 className='contact_title'>{t(l.address, locale)}</h2>
            <a className='contact_value hv-link' href='#map'>
              <address>{address.full}</address>
            </a>
          </li>
          <li className='card contact_card'>
            <span className='contact_icon'>
              <Icon name='phone' />
            </span>
            <h2 className='contact_title'>{t(l.phone, locale)}</h2>
            <a className='contact_value hv-link' href={contacts.phone.href}>
              {contacts.phone.label}
            </a>
            <p className='contact_note'>{t(l.phoneNote, locale)}</p>
          </li>
          <li className='card contact_card'>
            <span className='contact_icon'>
              <Icon name='clock' />
            </span>
            <h2 className='contact_title'>{t(l.hours, locale)}</h2>
            <p className='contact_value'>{t(hoursLong, locale)}</p>
          </li>
          {contacts.email && (
            <li className='card contact_card'>
              <span className='contact_icon'>
                <Icon name='mail' />
              </span>
              <h2 className='contact_title'>{t(l.email, locale)}</h2>
              <a
                className='contact_value hv-link'
                href={`mailto:${contacts.email}`}
              >
                {contacts.email}
              </a>
            </li>
          )}
          <li className='card contact_card'>
            <span className='contact_icon'>
              <Icon name='instagram' />
            </span>
            <h2 className='contact_title'>{l.instagram}</h2>
            <div className='contact_pairs'>
              <p className='contact_value contact_pair'>
                <span>{t(l.salonWord, locale)}</span>{' '}
                <a
                  className='hv-link'
                  href={contacts.instagramSalon.url}
                  target='_blank'
                  rel='noopener'
                >
                  {contacts.instagramSalon.handle}
                </a>
              </p>
              <p className='contact_value contact_pair'>
                <span>{t(l.coursesWord, locale)}</span>{' '}
                <a
                  className='hv-link'
                  href={contacts.instagramAcademy.url}
                  target='_blank'
                  rel='noopener'
                >
                  {contacts.instagramAcademy.handle}
                </a>
              </p>
            </div>
          </li>
        </ul>
        <ul className='contacts_strip' data-gallery>
          {contactsPhotos.map((p) => (
            <li key={p.src} className={p.tile ? `strip_${p.tile}` : undefined}>
              <Pic
                src={p.src}
                alt={t(p.alt, locale)}
                sizes={
                  p.tile === 'wide'
                    ? '(min-width: 1200px) 400px, (min-width: 768px) 34vw, 100vw'
                    : '(min-width: 1200px) 200px, (min-width: 768px) 17vw, 45vw'
                }
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
