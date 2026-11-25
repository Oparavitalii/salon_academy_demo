import Image from 'next/image';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { mapUrls } from '@/lib/content/map';
import {
  address,
  brand,
  contacts,
  footerCopy as c,
  hoursShort,
  logos,
  siteNav,
} from '@/lib/content/site';
import { t } from '@/lib/i18n/t';
import type { Theme } from '@/lib/theme';

import { CookieSettingsLink } from '../CookieBanner/Cookie_Banner';
import { Icon, type IconName } from '../Icons/Icons';

/** `theme` = the page theme; only `minimal` follows it — `site` is dark on every route (4.2). */
type Props = { variant: 'site' | 'minimal'; locale: Locale; theme?: Theme };

/**
 * Footer20 «Footer сайту» (every public page and the cabinet — Decisions 22.10 B-88) and Footer2
 * (minimal: admin, 404, AuthShell minimal). Wireframe §9 / 9_Text.md round 4 → Footer: salon logo ·
 * tagline · Салон · Курси · Про нас · Контакти · address → `/contacts#map` + «Маршрут» (no map in
 * the footer — Decisions 22.10) · phone · hours · Instagram · Telegram · WhatsApp · Booksy · privacy
 * · «Налаштування cookie» (FR-19) · ©. «Публічна оферта» is hidden until the document exists (B-21).
 * `site`: `data-theme='dark'` + the torn paper edge above (8.0 §5 `.dec_torn_band`) + grain.
 * The logo loads eagerly (T-12): lazy, it could still be empty when a full-page capture reaches the footer.
 */
export function Footer({ variant, locale, theme = 'dark' }: Props) {
  const privacy = (
    <Link href='/privacy' className='hv-link'>
      {t(c.privacy, locale)}
    </Link>
  );

  if (variant === 'minimal') {
    return (
      <footer className='band band_footer footer_min' data-theme={theme}>
        <div className='band__inner band__inner_flush'>
          <div className='footer_meta'>
            <span>{c.copyrightShort}</span>
            {privacy}
            <CookieSettingsLink locale={locale} />
          </div>
        </div>
      </footer>
    );
  }

  const socials: { icon: IconName; label: string; href: string }[] = [
    {
      icon: 'instagram',
      label: t(c.instagramSalon, locale),
      href: contacts.instagramSalon.url,
    },
    ...(contacts.telegram
      ? [
          {
            icon: 'telegram' as const,
            label: 'Telegram',
            href: contacts.telegram,
          },
        ]
      : []),
    { icon: 'whatsapp', label: 'WhatsApp', href: contacts.whatsapp },
    { icon: 'booksy', label: 'Booksy', href: contacts.booksy },
  ];

  return (
    <>
      <div
        className='dec_torn dec_torn_band'
        data-theme='dark'
        aria-hidden='true'
      />
      <footer className='band band_footer footer dec_grain' data-theme='dark'>
        <div className='band__inner band__inner_flush'>
          <div className='footer_grid'>
            <div className='footer_col footer_col_brand'>
              <Link className='footer_brand' href='/' aria-label={brand.name}>
                <span
                  className='logo-circle logo-circle_lg logo-circle_black'
                  aria-hidden='true'
                >
                  <Image
                    src={logos.black}
                    width={480}
                    height={480}
                    alt=''
                    sizes='72px'
                    loading='eager'
                  />
                </span>
                <b>{brand.name}</b>
              </Link>
              <p className='footer_about'>{t(c.about, locale)}</p>
              <ul className='footer_social'>
                {socials.map((s) => (
                  <li key={s.icon}>
                    <a
                      href={s.href}
                      target='_blank'
                      rel='noopener'
                      aria-label={s.label}
                      title={s.label}
                      className='hv-swap-host'
                    >
                      <span className='hv-swap-a'>
                        <Icon name={s.icon} size={18} />
                      </span>
                      <span className='hv-swap-b' aria-hidden='true'>
                        <Icon name={s.icon} size={18} />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <nav className='footer_col' aria-label={t(c.navTitle, locale)}>
              <h2 className='footer_h'>{t(c.navTitle, locale)}</h2>
              {siteNav.map((it) => (
                <Link key={it.href} href={it.href} className='hv-link'>
                  {t(it.label, locale)}
                </Link>
              ))}
            </nav>
            <div className='footer_col'>
              <h2 className='footer_h'>{t(c.contactsTitle, locale)}</h2>
              <address className='footer_address'>
                <Link href='/contacts#map' className='hv-link'>
                  {address.full}
                </Link>
                <a
                  className='footer_route'
                  href={mapUrls.directions}
                  target='_blank'
                  rel='noopener'
                >
                  <Icon name='pin' size={16} />
                  {t(c.route, locale)}
                </a>
                <a href={contacts.phone.href} className='hv-link'>
                  {contacts.phone.label}
                </a>
                <span>{t(hoursShort, locale)}</span>
              </address>
            </div>
            <div className='footer_col'>
              <h2 className='footer_h'>{t(c.docsTitle, locale)}</h2>
              {privacy}
              <CookieSettingsLink locale={locale} />
            </div>
          </div>
          <div className='footer_meta'>
            <span>{t(c.copyright, locale)}</span>
          </div>
        </div>
      </footer>
    </>
  );
}
