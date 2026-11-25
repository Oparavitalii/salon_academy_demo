import { getTranslations } from 'next-intl/server';

import { logout } from '@/app/[locale]/_actions/account';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { brand } from '@/lib/content/site';

import { AdminBurger } from './AdminBurger';
import { AdminMenu } from './AdminMenu';
import { LogoMark } from '../Header/LogoMark';

function Brand({
  label,
  short,
  logo = 'academy',
}: {
  label: string;
  short?: string;
  logo?: 'salon' | 'academy';
}) {
  return (
    <>
      <LogoMark variant={logo} />
      <span className='header_brand_text'>
        <b className={short ? 'brand_long' : undefined}>{label}</b>
        {short && (
          <b className='brand_short' aria-hidden='true'>
            {short}
          </b>
        )}
      </span>
    </>
  );
}

/**
 * Header_Cabinet. Student (owner 02.11.2026: «пару розділів, як в адмінці, і не переходило на сайт
 * з контактами»): four sections — Мої курси · Сертифікати · Допомога · Налаштування — inline from
 * 1200 px, one menu button below; the name opens Вийти and the one deliberate link back to the
 * site. «Допомога» is `/cabinet/help` inside the cabinet, no longer the site's `/contacts`.
 * `admin` = the admin previewing lessons: home is /admin/courses, no student sections. Light theme,
 * academy logo (7.0 §3, CON-05 — the only place the academy logo shows; `AdminHeader` shows the
 * salon logo — owner 01.11.2026, B-73). Reuses the admin header layout (`header_admin` classes).
 */
const CABINET_SECTION = (active: string) =>
  active.startsWith('/cabinet/certificates')
    ? '/cabinet/certificates'
    : active.startsWith('/cabinet/help')
      ? '/cabinet/help'
      : active.startsWith('/cabinet/settings')
        ? '/cabinet/settings'
        : '/cabinet';

export async function CabinetHeader({
  locale,
  name,
  admin = false,
  active = '/cabinet',
}: {
  locale: Locale;
  name: string;
  admin?: boolean;
  /** Current path, for the highlighted section (course and lesson pages → «Мої курси»). */
  active?: string;
}) {
  const tc = await getTranslations('cabinet');
  const logoutForm = (cls: string, formCls?: string) => (
    <form action={logout} className={formCls}>
      <input type='hidden' name='locale' value={locale} />
      <button type='submit' className={cls}>
        {tc('logout')}
      </button>
    </form>
  );

  if (admin) {
    const ta = await getTranslations('admin');
    const homeLabel = `${ta('nav.home')} · ${ta('nav.courses')}`;
    return (
      <header className='header header_app' data-theme='light'>
        <div className='wrap header_inner'>
          <Link
            className='header_brand'
            href='/admin/courses'
            aria-label={homeLabel}
          >
            <Brand label={brand.name} />
          </Link>
          <div className='header_tools'>
            <Link className='app_link' href='/'>
              {tc('toSite')}
            </Link>
            <details className='choose'>
              <summary className='app_link' aria-label={tc('profile')}>
                {name}
                <span className='choose_caret' aria-hidden='true' />
              </summary>
              <div className='choose_menu'>
                <Link className='choose_item' href='/admin/courses'>
                  {homeLabel}
                </Link>
                {logoutForm('choose_item choose_item_btn')}
              </div>
            </details>
          </div>
        </div>
      </header>
    );
  }

  const section = CABINET_SECTION(active);
  const items = [
    ['/cabinet', tc('myCourses')],
    ['/cabinet/certificates', tc('certificates')],
    ['/cabinet/help', tc('help')],
    ['/cabinet/settings', tc('settings')],
  ] as const;
  const current = items.find(([href]) => href === section)?.[1] ?? '';
  const link = (href: string, label: string, cls: string) => (
    <Link
      key={href}
      href={href}
      className={`${cls}${section === href ? ' is_active' : ''}`}
      aria-current={section === href ? 'page' : undefined}
    >
      {label}
    </Link>
  );
  return (
    <header
      className='header header_app header_admin header_cabinet'
      data-theme='light'
    >
      <div className='wrap header_inner'>
        <Link
          className='header_brand'
          href='/cabinet'
          aria-label={tc('myCourses')}
        >
          <Brand label={brand.name} />
        </Link>
        {/* < 1200 px: one button with the current section; the panel holds every section */}
        <AdminMenu label={tc('menu')} current={current}>
          {items.map(([href, label]) => link(href, label, 'admin_menu_link'))}
          <span className='admin_menu_sep' aria-hidden='true' />
          <Link className='admin_menu_link' href='/'>
            {tc('toSite')}
          </Link>
          {logoutForm('admin_menu_link', 'admin_menu_logout')}
        </AdminMenu>
        {/* ≥ 1200 px: the inline nav + the account menu */}
        <nav className='admin_nav' aria-label={tc('menu')}>
          {items.map(([href, label]) => link(href, label, 'app_link'))}
        </nav>
        <details className='choose admin_account'>
          <summary className='app_link' aria-label={tc('profile')}>
            {name}
            <span className='choose_caret' aria-hidden='true' />
          </summary>
          <div className='choose_menu'>
            <Link className='choose_item' href='/'>
              {tc('toSite')}
            </Link>
            {logoutForm('choose_item choose_item_btn')}
          </div>
        </details>
      </div>
    </header>
  );
}

/**
 * Header_Admin (owner 31.10.2026: «забагато меню пунктів»): five task sections — Сьогодні ·
 * Учениці (+ журнал входів) · Курси (статистика, уроки, ціна й показ) · Оплати й сертифікати ·
 * Прайс салону — and an «Акаунт» menu with Профіль and Вийти. A sub-page (logins, certificates)
 * lights up its parent section through `SECTION_OF`. Labels from `admin.nav` in the UI locale.
 * Below 1200 px the site's burger (AdminBurger — owner 08.11.2026: «меню в адмінці по стилю таке як
 * на головній»), in the admin's light theme; the student cabinet keeps AdminMenu.
 */
const SECTION_OF: Record<string, string> = {
  '/admin/logins': '/admin/students',
  '/admin/certificates': '/admin/payments',
};

export async function AdminHeader({
  locale,
  active,
}: {
  locale: Locale;
  active: string;
}) {
  const ta = await getTranslations({ locale, namespace: 'admin' });
  const th = await getTranslations({ locale, namespace: 'header' });
  const section = SECTION_OF[active] ?? active;
  const items = [
    ['/admin', ta('nav.today')],
    ['/admin/students', ta('nav.students')],
    ['/admin/courses', ta('nav.courses')],
    ['/admin/payments', ta('nav.payments')],
    ['/admin/prices', ta('nav.prices')],
  ] as const;
  const link = (href: string, label: string, cls: string) => (
    <Link
      key={href}
      href={href}
      className={`${cls}${section === href ? ' is_active' : ''}`}
      aria-current={section === href ? 'page' : undefined}
    >
      {label}
    </Link>
  );
  const logoutForm = (cls: string, formCls?: string) => (
    <form action={logout} className={formCls}>
      <input type='hidden' name='locale' value={locale} />
      <button type='submit' className={cls}>
        {ta('nav.logout')}
      </button>
    </form>
  );
  return (
    <header
      className='header header_app header_admin bm-header'
      data-theme='light'
    >
      <div className='wrap header_inner'>
        <Link
          className='header_brand'
          href='/admin'
          aria-label={ta('nav.home')}
        >
          <Brand
            label={ta('nav.brand', { name: brand.name })}
            short={ta('nav.home')}
            logo='salon'
          />
        </Link>
        {/* < 1200 px: the site's burger and full-screen panel, admin sections (owner 08.11) */}
        <AdminBurger
          openLabel={ta('nav.menu')}
          closeLabel={th('menuClose')}
          langLabel={th('langLabel')}
          items={items.map(([href, label]) => ({
            href,
            label,
            current: section === href,
          }))}
          extra={[
            {
              href: '/admin/settings',
              label: ta('nav.profile'),
              current: active === '/admin/settings',
            },
          ]}
        >
          {logoutForm('bm-link bm-link--small', 'bm-logout_form')}
        </AdminBurger>
        {/* ≥ 1200 px: the inline nav + the account menu */}
        <nav className='admin_nav' aria-label={ta('nav.menu')}>
          {items.map(([href, label]) => link(href, label, 'app_link'))}
        </nav>
        <details className='choose admin_account'>
          <summary
            className={`app_link${active === '/admin/settings' ? ' is_active' : ''}`}
          >
            {ta('nav.account')}
            <span className='choose_caret' aria-hidden='true' />
          </summary>
          <div className='choose_menu'>
            <Link className='choose_item' href='/admin/settings'>
              {ta('nav.profile')}
            </Link>
            {logoutForm('choose_item choose_item_btn')}
          </div>
        </details>
      </div>
    </header>
  );
}
