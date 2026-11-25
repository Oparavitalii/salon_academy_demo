import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { BOOKING_HREF, siteNav } from '@/lib/content/site';
import { t } from '@/lib/i18n/t';
import type { Theme } from '@/lib/theme';

import { ChooseMenu, type ChooseItem } from './ChooseMenu';
import { LogoMark } from './LogoMark';
import { MobileMenu } from './MobileMenu';

/** `site` = Header_Site (every public page, checkout) · `minimal` = Header_Auth / Header_Home (login, passwords, 404 / 500). */
export type HeaderVariant = 'site' | 'minimal';

/** `theme` = the page theme (4.2 § Theme scopes); the header paints itself with it. Default dark. */
type Props = {
  variant: HeaderVariant;
  locale: Locale;
  active?: string;
  theme?: Theme;
};

function CabinetIcon() {
  return (
    <svg
      viewBox='0 0 24 24'
      width='20'
      height='20'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.6'
      aria-hidden='true'
      focusable='false'
    >
      <circle cx='12' cy='8.5' r='3.75' />
      <path d='M4.75 20c.9-3.6 3.8-5.5 7.25-5.5s6.35 1.9 7.25 5.5' />
    </svg>
  );
}

/**
 * Header_Site · Header_Home (6_Karkas 19.10). Copy: 9_Text.md → Наскрізні → Header сайту.
 * Logo → `/` · Салон · Академія · Про нас · Контакти · Languages · «Обрати» (dropdown:
 * «Записатися в салон» → `/salon#services`, «Купити курс» → `/courses#catalog`) · cabinet icon
 * → `/login` (the cabinet is not built yet, B-24). Sticky. No FAQ (B-37).
 * Logo: the salon logo circle on every public route (`LogoMark`, 7.0 §3, CON-05); the academy logo
 * never appears here. Theme: `<header data-theme>` = the page theme, passed through `MobileMenu`.
 */
export async function Header({
  variant,
  locale,
  active,
  theme = 'dark',
}: Props) {
  const tr = await getTranslations('header');
  const minimal = variant === 'minimal';
  const items = minimal
    ? []
    : siteNav.map((n) => ({ href: n.href, label: t(n.label, locale) }));
  const choose: ChooseItem[] = [
    { href: BOOKING_HREF, label: tr('bookSalon') },
    { href: '/courses#catalog', label: tr('buyCourse') },
  ];
  const cabinet = { href: '/login', label: tr('cabinetLogin') };

  return (
    <MobileMenu
      theme={theme}
      openLabel={tr('menuOpen')}
      closeLabel={tr('menuClose')}
      items={items}
      choose={minimal ? null : { label: tr('choose'), items: choose }}
      cabinet={minimal ? null : cabinet}
      active={active}
    >
      <Link className='header_brand' href='/' aria-label={tr('salonAlt')}>
        {/* logo only (Daryna 16.11: logo + «STUDIO DEMO» beside it is «візуальна тавтологія»);
            the link's aria-label carries the name */}
        <LogoMark />
      </Link>
      {items.length > 0 && (
        <nav className='header_nav' aria-label={tr('mainNav')}>
          {items.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`nav_link hv-underline${active === n.href ? ' is_active' : ''}`}
              aria-current={active === n.href ? 'page' : undefined}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      )}
      <div className='header_tools'>
        {!minimal && (
          <>
            <ChooseMenu label={tr('choose')} items={choose} />
            <Link
              className={`header_icon${active === '/login' ? ' is_active' : ''}`}
              href={cabinet.href}
              aria-label={cabinet.label}
              title={cabinet.label}
              aria-current={active === '/login' ? 'page' : undefined}
            >
              <CabinetIcon />
            </Link>
          </>
        )}
      </div>
    </MobileMenu>
  );
}
