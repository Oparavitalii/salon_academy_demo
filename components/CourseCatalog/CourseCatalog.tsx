import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import {
  academyCopy,
  catalog,
  courseFilterCopy as f,
  courseKind,
} from '@/lib/content/courses';
import { sitePrice } from '@/lib/courses/price';
import type { CourseView } from '@/lib/courses/public';
import { t } from '@/lib/i18n/t';

import { CourseFilter } from '../CourseFilter/CourseFilter';
import { Pic } from '../Pic/Pic';
import { SmartLink } from '../SmartLink/SmartLink';

/**
 * The course cards with the «Усі · Онлайн · Офлайн» filter — shared by `/courses` (`#catalog`, full
 * cards: text + both buttons) and the home AcademyTeaser (`compact`: the card is one link). Owner
 * 28.10: «курсы сейчас не читабельные, нужно разделить оффлайн онлайн и сделать фильтрацию удобную» —
 * so one photo per card (the three-photo collage is gone), a format badge on the photo, the price next
 * to the buttons. Order: the catalog's (intensive first). A course switched off in /admin/courses is
 * hidden; the «Передзапис» card stays with its chip and «Повідомити про старт».
 * Oksana 16.11 (M-12): the `/courses` card lost its two thumbs under the photo — one photo, as on the
 * home page, and the same pink outline + glow on hover (`hv-card-border hv-zoom`).
 */
export function CourseCards({
  locale,
  view,
  compact = false,
}: {
  locale: Locale;
  view: CourseView;
  compact?: boolean;
}) {
  const list = catalog.filter(
    (k) => k.status === 'available' && view.available.has(k.slug),
  );
  const online = list.filter((k) => courseKind(k.slug) === 'online').length;
  return (
    <CourseFilter
      label={t(f.label, locale)}
      labels={{
        all: t(f.all, locale),
        online: t(f.online, locale),
        offline: t(f.offline, locale),
      }}
      counts={{ all: list.length, online, offline: list.length - online }}
    >
      <ul className={`catalog_list${compact ? ' catalog_list_compact' : ''}`}>
        {list.map((k) => {
          const kind = courseKind(k.slug);
          const img = k.images[0];
          const media = (
            <span className='catalog_media'>
              <Pic
                src={img.src}
                alt={t(img.alt, locale)}
                sizes='(min-width: 1200px) 560px, (min-width: 768px) 45vw, 92vw'
              />
              <span className={`catalog_badge catalog_badge_${kind}`}>
                {t(kind === 'online' ? f.badgeOnline : f.badgeOffline, locale)}
              </span>
            </span>
          );
          const head = (
            <>
              {k.soon && (
                <span className='chip chip_pre'>{t(k.soon, locale)}</span>
              )}
              <span className='catalog_format meta'>{t(k.format, locale)}</span>
              <span className='catalog_title'>{t(k.title, locale)}</span>
            </>
          );
          return (
            <li key={k.slug} data-kind={kind} className='catalog_item'>
              {compact ? (
                <Link
                  className='card catalog_card hv-card-border hv-zoom'
                  href={`/courses/${k.slug}`}
                >
                  {media}
                  <span className='catalog_body'>
                    {head}
                    <span className='catalog_row'>
                      <span className='price catalog_price'>
                        {t(
                          sitePrice(k.price, view.priceEur.get(k.slug)),
                          locale,
                        )}
                      </span>
                      <span className='catalog_more' aria-hidden='true'>
                        {t(academyCopy.catalog.details, locale)} →
                      </span>
                    </span>
                  </span>
                </Link>
              ) : (
                <article
                  className='card catalog_card hv-card-border hv-zoom'
                  data-gallery
                  data-gallery-label={t(k.title, locale)}
                >
                  {media}
                  <div className='catalog_body'>
                    {head}
                    <p className='catalog_text'>{t(k.body, locale)}</p>
                    <div className='catalog_row'>
                      <p className='price catalog_price'>
                        {t(
                          sitePrice(k.price, view.priceEur.get(k.slug)),
                          locale,
                        )}
                      </p>
                      <div className='catalog_actions'>
                        <SmartLink
                          className='btn hv-btn-glow'
                          href={k.primary.href}
                        >
                          {t(k.primary.label, locale)}
                        </SmartLink>
                        <Link
                          className='btn btn_outline hv-btn-invert'
                          href={`/courses/${k.slug}`}
                        >
                          {t(academyCopy.catalog.details, locale)}
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              )}
            </li>
          );
        })}
      </ul>
    </CourseFilter>
  );
}

/** CourseCatalog `#catalog` (`/courses`, FR-09, FR-22) — heading, sub-line and the filtered cards. */
export function CourseCatalog({
  locale,
  view,
}: {
  locale: Locale;
  view: CourseView;
}) {
  const c = academyCopy.catalog;
  return (
    <section className='sec sec_page catalog_sec' id='catalog'>
      <div className='wrap'>
        <div className='sec_head'>
          <h2 className='display display_lg'>{t(c.heading, locale)}</h2>
          <p className='lede'>{t(c.sub, locale)}</p>
        </div>
        <CourseCards locale={locale} view={view} />
      </div>
    </section>
  );
}
