import { BookingChannels } from '@/components/BookingChannels/BookingChannels';
import { Polaroid } from '@/components/Decorations/Polaroid';
import { Icon } from '@/components/Icons/Icons';
import { Pic } from '@/components/Pic/Pic';
import { Link } from '@/i18n/navigation';
import type { Locale, Localized } from '@/i18n/routing';
import { courseCopy as cc, mentoringCourse as m } from '@/lib/content/courses';
import { t } from '@/lib/i18n/t';

/**
 * `/courses/personal-mentoring` (Dana 16.11, «личное наставничество») — her text in her order, on the
 * course pages' own blocks and classes: hero (no FormatSwitch — one format; both prices) → «Жодних
 * стандартних програм» + the directions `#program` → «Що Ви отримуєте» `#inclusions` → the author → both
 * prices + the booking channels `#price` (booked like an intensive, no Stripe) → photos → her closing
 * lines. Every button → `#price`. The two-format components (HeroCourse, Audience, Program…) take a
 * `CourseDetail` with a sibling, an audience and a day program — this course has none of them.
 */
export function Mentoring_Page({
  locale,
  privacyLabel,
}: {
  locale: Locale;
  privacyLabel: string;
}) {
  const tr = (v: Localized) => t(v, locale);
  const book = tr(m.book);
  const h = m.hero;
  const c = m.choice;
  const pc = m.priceCard;
  return (
    <>
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
                  alt={tr(p.alt)}
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
            <p className='eyebrow'>{tr(h.eyebrow)}</p>
            <h1 className='display display_xl'>{tr(h.title)}</h1>
            <p className='lede'>{tr(h.lead)}</p>
            <ul className='chips'>
              {h.tags.map((tag) => (
                <li key={t(tag, 'uk')} className='chip'>
                  {tr(tag)}
                </li>
              ))}
            </ul>
            {m.options.map((o) => (
              <p key={t(o.days, 'uk')} className='course_hero_price'>
                <span className='note'>{tr(o.days)}</span>
                <span className='price'>{tr(o.price)}</span>
              </p>
            ))}
            <div className='hero_actions'>
              <a className='btn hv-btn-glow' href='#price'>
                {book}
              </a>
              <a className='btn btn_outline hv-btn-invert' href='#inclusions'>
                {tr(h.more)}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className='sec sec_surface' id='program'>
        <div className='wrap'>
          <div className='sec_head'>
            <h2 className='display display_lg'>{tr(c.heading)}</h2>
            <p className='lede'>{tr(c.sub)}</p>
          </div>
          <div className='skills'>
            <figure className='skills_figure'>
              <Pic
                src={c.image.src}
                alt={tr(c.image.alt)}
                sizes='(min-width: 1200px) 360px, (min-width: 768px) 40vw, 90vw'
              />
            </figure>
            <div className='skills_text'>
              <h3 className='display display_md'>{tr(c.listHeading)}</h3>
              <ul className='check_list'>
                {c.directions.map((d) => (
                  <li key={t(d, 'uk')}>{tr(d)}</li>
                ))}
              </ul>
              <p>{tr(c.combine)}</p>
              <p className='callout'>{tr(c.faster)}</p>
              <p>
                <a className='btn hv-btn-glow' href='#price'>
                  {book}
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className='sec sec_page inclusions_sec' id='inclusions'>
        <div className='wrap inclusions_grid has_image'>
          <div>
            <div className='sec_head'>
              <h2 className='display display_lg'>{tr(m.gets.heading)}</h2>
            </div>
            <ul className='inclusions_list'>
              {m.gets.items.map((it) => (
                <li
                  key={t(it, 'uk')}
                  className='inclusion ui-card ui-card--outlined'
                >
                  <span className='inclusion_icon'>
                    <Icon name='check' />
                  </span>
                  <span>{tr(it)}</span>
                </li>
              ))}
            </ul>
            <p className='sec_foot'>
              <a className='btn hv-btn-glow' href='#price'>
                {book}
              </a>
            </p>
          </div>
          <figure className='inclusions_figure'>
            <Pic
              src={m.gets.image.src}
              alt={tr(m.gets.image.alt)}
              sizes='(min-width: 1200px) 400px, (min-width: 768px) 40vw, 90vw'
            />
          </figure>
        </div>
      </section>

      <section className='sec sec_surface author_sec dec_host' id='author'>
        <span className='dec_ghost_num dec_ghost_num_left' aria-hidden='true'>
          {cc.ghost}
        </span>
        <div className='wrap author_grid'>
          <div className='author_media'>
            {m.author.images.map((p, i) => (
              <figure key={p.src} className={`author_img author_img_${i + 1}`}>
                <Pic
                  src={p.src}
                  alt={tr(p.alt)}
                  sizes={
                    i === 0
                      ? '(min-width: 1200px) 380px, (min-width: 768px) 40vw, 80vw'
                      : '(min-width: 1200px) 200px, 35vw'
                  }
                />
              </figure>
            ))}
          </div>
          <div className='author_text'>
            <h2 className='display display_lg'>{tr(m.author.heading)}</h2>
            <p className='lede'>{tr(m.author.sub)}</p>
            <ul className='facts_list'>
              {cc.authorFacts.map((f) => (
                <li key={t(f, 'uk')}>{tr(f)}</li>
              ))}
            </ul>
            <p>
              <a className='btn hv-btn-glow' href='#price'>
                {book}
              </a>
            </p>
          </div>
        </div>
      </section>

      <section className='sec sec_page price_sec' id='price'>
        <div className='wrap price_grid'>
          <figure className='price_figure'>
            <Pic
              src={pc.image.src}
              alt={tr(pc.image.alt)}
              sizes='(min-width: 1200px) 420px, (min-width: 768px) 40vw, 90vw'
            />
          </figure>
          <div>
            <div className='sec_head'>
              <h2 className='display display_lg'>{tr(pc.heading)}</h2>
              <p className='lede'>{tr(pc.sub)}</p>
            </div>
            <div className='card price_card'>
              <h3>{tr(pc.name)}</h3>
              {/* both prices as Dana wrote them: «2 дня — 2 000 € / 3 дня — 3 000 €» */}
              {m.options.map((o) => (
                <p key={t(o.days, 'uk')} className='course_hero_price'>
                  <span className='note'>{tr(o.days)}</span>
                  <span className='price price_card_price'>{tr(o.price)}</span>
                </p>
              ))}
              <ul className='price_card_list'>
                <li>
                  <Icon name='clock' />
                  <span>{tr(pc.format)}</span>
                </li>
                <li>
                  <Icon name='pin' />
                  <span>{tr(pc.place)}</span>
                </li>
              </ul>
              {/* booked like the intensives: the channels open in the card (native <details>, no JS) */}
              <details className='price_book'>
                <summary className='btn btn_block hv-btn-glow'>{book}</summary>
                <BookingChannels
                  locale={locale}
                  as='panel'
                  id='price-booking'
                />
              </details>
            </div>
          </div>
        </div>
      </section>

      <section
        className='sec sec_surface course_gallery'
        id='gallery'
        data-gallery
      >
        <div className='wrap'>
          <div className='sec_head_row'>
            <div className='sec_head'>
              <p className='eyebrow'>{tr(m.gallery.caption)}</p>
              <h2 className='display display_lg'>{tr(m.gallery.heading)}</h2>
            </div>
            <a className='btn hv-btn-glow' href='#price'>
              {book}
            </a>
          </div>
          <div className='polaroid_grid polaroid_grid_9'>
            {m.gallery.images.map((p, i) => (
              <Polaroid
                key={p.src}
                src={p.src}
                alt={tr(p.alt)}
                sizes='(min-width: 1200px) 340px, (min-width: 768px) 30vw, 45vw'
                tilt={i % 2 ? 'r' : 'l'}
                tape={i === 0 || i === 5}
              />
            ))}
          </div>
        </div>
      </section>

      <section className='sec sec_page final_sec' id='final'>
        <div className='wrap'>
          <div className='band_deep final_band' data-theme='dark'>
            <div className='final_text'>
              <h2 className='display display_lg'>{tr(m.final.heading)}</h2>
              <p>{tr(m.final.sub)}</p>
              {/* one option per span: the two prices never run under the photo (1440 cut «€», 16.11) */}
              <p className='price final_price final_price_pair'>
                {m.options.map((o) => (
                  <span key={tr(o.days)}>
                    {tr(o.days)} — {tr(o.price)}
                  </span>
                ))}
              </p>
              <p className='final_guarantee'>{tr(m.final.guarantee)}</p>
              <div className='hero_actions'>
                <a className='btn btn_ondark hv-btn-invert' href='#price'>
                  {book}
                </a>
              </div>
              <p className='final_legal note'>
                <Link className='hv-link' href='/privacy'>
                  {privacyLabel}
                </Link>
              </p>
            </div>
            <figure className='final_figure'>
              <Pic
                src={m.final.image.src}
                alt={tr(m.final.image.alt)}
                sizes='(min-width: 1200px) 380px, (min-width: 768px) 35vw, 80vw'
              />
            </figure>
          </div>
        </div>
      </section>
    </>
  );
}
