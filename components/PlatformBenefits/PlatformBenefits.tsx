import type { Locale } from '@/i18n/routing';
import { academyCopy } from '@/lib/content/courses';
import { img } from '@/lib/content/images';
import { t } from '@/lib/i18n/t';

import { Words } from '../Fx/Words';

/**
 * One photo per benefit, in the order of `academyCopy.platform.items`. 16.11: the course shoot 09.11
 * instead of the phone photos — practice on a live model, Olena at the teaching poster, the students
 * together («Група учениць»); the certificate stays (the shoot has no certificate frames).
 */
const PHOTOS = [
  'Academy/Certificate_01.webp',
  'Academy/Practice_Capsule_01.webp',
  'Academy/Teach_Theory_01.webp',
  'Academy/Students_Group_01.webp',
];

/**
 * PlatformBenefits → Features9 (`/courses`, FR-26). Four benefits, each with its own photo, on a white
 * band: a row of four from 1024 px, two by two from 640 px, a swipe strip on a phone (CSS scroll-snap,
 * no JS — the next card peeks in, so it reads as «swipe»).
 * 16.11.2026 (Daryna): the 3D ring of glossy prints (owner 01.11) read «засвічені», with a fake shadow,
 * did not turn by finger («я не можу перегорнути їх»), looked «застаріло» and left a tall empty gap
 * (the sticky stage) — so the photos sit flat in the cards now. The 3D version stays in
 * `Benefits_3D.tsx` + `lib/three/Benefits_Scene.ts`, unused, for a quick revert.
 */
export function PlatformBenefits({ locale }: { locale: Locale }) {
  const c = academyCopy.platform;
  return (
    <section className='sec platform_sec' id='benefits'>
      <div className='wrap'>
        <div className='sec_head'>
          <h2 className='display display_lg' data-fx='words'>
            <Words text={t(c.heading, locale)} />
          </h2>
          <p className='lede'>{t(c.sub, locale)}</p>
        </div>
        {/* tabIndex: on a phone the list scrolls sideways, and a scrolling region must take keyboard focus (axe) */}
        <ol className='pb_list' aria-label={t(c.heading, locale)} tabIndex={0}>
          {c.items.map((it, i) => {
            const p = img(PHOTOS[i]);
            return (
              <li key={PHOTOS[i]} className='pb_card'>
                {/* eslint-disable-next-line @next/next/no-img-element -- fixed WebP files, sized by CSS */}
                <img
                  className='pb_img'
                  src={p.src}
                  alt=''
                  loading='lazy'
                  decoding='async'
                />
                <div className='pb_body'>
                  <p className='card_num' aria-hidden='true'>
                    {i + 1}/
                  </p>
                  <h3>{t(it.title, locale)}</h3>
                  <p>{t(it.body, locale)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
