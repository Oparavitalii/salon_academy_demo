import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import {
  courseCopy as cc,
  type CourseDetail,
  priceLabel,
} from '@/lib/content/courses';
import { t } from '@/lib/i18n/t';

import { Pic } from '../Pic/Pic';
import { SmartLink } from '../SmartLink/SmartLink';

/**
 * HeroCourse → Product16 (both course pages, FR-10, FR-22, FR-26): photo column left (two photos),
 * FormatSwitch (two links between the slugs — each format has its own address, no JS), eyebrow,
 * H1 (format name + course title), sub-line, tags with «Міжнародний сертифікат» last-but-visible (a «Передзапис» chip
 * first when the course is not out yet), the one price (E-31), then two buttons (Oksana's copy 26.10): the page's
 * main action `course.cta` (Oksana «Придбати курс»; no Stripe yet — online → Direct, intensive → `#price`) and
 * «Програма навчання» → `#program`. Light. Decor: none (8.0 §5).
 */
export function HeroCourse({
  locale,
  course,
}: {
  locale: Locale;
  course: CourseDetail;
}) {
  const h = course.hero;
  // The same course in both formats: online first, the intensive second (its `sibling`).
  const online = course.format === 'online' ? course.slug : course.sibling;
  const offline = course.format === 'online' ? course.sibling : course.slug;
  const formats = [
    { slug: online, label: cc.switchOnline },
    { slug: offline, label: cc.switchIntensive },
  ];
  return (
    <section className='course_hero' id='hero'>
      <div className='wrap course_hero_grid'>
        <div className='course_hero_media'>
          {h.images.map((p, i) => (
            <figure
              key={p.src}
              className={`course_hero_img course_hero_img_${i + 1}`}
            >
              <Pic
                src={p.src}
                alt={t(p.alt, locale)}
                sizes={
                  i === 0
                    ? '(min-width: 1200px) 460px, (min-width: 1024px) 34vw, (min-width: 768px) 440px, 72vw'
                    : '(min-width: 1200px) 200px, (min-width: 768px) 240px, 34vw'
                }
                priority={i === 0}
              />
            </figure>
          ))}
        </div>
        <div className='course_hero_text'>
          <nav className='switch' aria-label={t(cc.switchLabel, locale)}>
            {formats.map((f) => (
              <Link
                key={f.slug}
                href={`/courses/${f.slug}`}
                className={f.slug === course.slug ? 'is_active' : undefined}
                aria-current={f.slug === course.slug ? 'page' : undefined}
              >
                {t(f.label, locale)}
              </Link>
            ))}
          </nav>
          <p className='eyebrow'>{t(h.eyebrow, locale)}</p>
          {/* Both pages share the 9_Text title; the format name (FR-22 switch label) makes each
              H1 unique (challenger 22.10, fix round 2). */}
          <h1 className='display display_xl'>
            <span className='course_hero_kind'>
              {t(
                course.format === 'online'
                  ? cc.switchOnline
                  : cc.switchIntensive,
                locale,
              )}
            </span>{' '}
            {t(h.title, locale)}
          </h1>
          <p className='lede'>{t(h.sub, locale)}</p>
          <ul className='chips'>
            {course.soon && (
              <li className='chip chip_pre'>{t(course.soon, locale)}</li>
            )}
            {h.tags.map((tag) => (
              <li key={t(tag, 'uk')} className='chip'>
                {t(tag, locale)}
              </li>
            ))}
          </ul>
          <p className='course_hero_price'>
            <span className='note'>{t(priceLabel, locale)}</span>
            <span className='price'>{t(course.price, locale)}</span>
          </p>
          <div className='hero_actions'>
            <SmartLink className='btn hv-btn-glow' href={course.cta.href}>
              {t(course.cta.label, locale)}
            </SmartLink>
            <a className='btn btn_outline hv-btn-invert' href='#program'>
              {t(cc.programCta, locale)}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
