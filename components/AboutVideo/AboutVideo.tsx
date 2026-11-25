import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { t } from '@/lib/i18n/t';

import { AboutVideo_Player } from './AboutVideo_Player';

const COPY = {
  title: { uk: 'Про нас', pl: 'O nas', en: 'About us' },
  line: {
    uk: 'Простір досконалого догляду за волоссям у Варшаві',
    pl: 'Przestrzeń perfekcyjnej pielęgnacji włosów w Warszawie',
    en: 'A space for perfect hair care in Warsaw',
  },
  cta: {
    uk: 'Детальніше про нас',
    pl: 'Więcej o nas',
    en: 'More about us',
  },
  video: {
    uk: 'Відео: один день у салоні Studio Demo',
    pl: 'Wideo: jeden dzień w salonie Studio Demo',
    en: 'Video: a day at Studio Demo',
  },
  play: { uk: 'Відтворити', pl: 'Odtwórz', en: 'Play' },
  pause: { uk: 'Пауза', pl: 'Pauza', en: 'Pause' },
};

/**
 * AboutVideo (Daryna's Canva, 03.11.2026: the «ABOUT US» block — «Цей блок інше відео»): a video
 * other than the first screen's, with the big title over it, a play / pause button and «Детальніше
 * про нас» → `/about`. Plays only while in view and never under reduced motion (the poster stays).
 * Dana 17.11.2026 (group chat): the old reel cut had the masters «в разной одежде» → `About_Process.mp4`,
 * 15.9 s cut from her 10 process videos of that day, everyone in the studio's black tee (no text, no
 * sound; `Pilot_Run/Tools/_tmp/Prep_About_Process.mjs`).
 */
export function AboutVideo({ locale }: { locale: Locale }) {
  return (
    <section className='about_video' aria-labelledby='about_video_title'>
      <div className='about_video_stage'>
        <AboutVideo_Player
          src='/video/About_Process.mp4'
          poster='/video/About_Process_Poster.webp'
          label={t(COPY.video, locale)}
          play={t(COPY.play, locale)}
          pause={t(COPY.pause, locale)}
        />
        <div className='about_video_text'>
          <h2 id='about_video_title' className='about_video_title'>
            {t(COPY.title, locale)}
          </h2>
          <p className='about_video_line'>{t(COPY.line, locale)}</p>
          <Link className='btn btn_outline about_video_cta' href='/about'>
            {t(COPY.cta, locale)}
          </Link>
        </div>
      </div>
    </section>
  );
}
