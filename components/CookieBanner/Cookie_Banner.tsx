'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { t } from '@/lib/i18n/t';

import { CONTROLLER, cookieCopy as c } from './Cookie_Copy';
import { COOKIE_REGISTRY, type CookieEntry } from './Cookie_Registry';
import {
  type Consent,
  OPEN_SETTINGS_EVENT,
  openCookieSettings,
  useCookieConsent,
} from './Use_Cookie_Consent';

/**
 * Banner (layer 1) + settings modal (layer 2) + footer link that reopens it.
 * BUILD COPY (Phase 11 part B, 22.10.2026) of docs/10_Legal/Cookie_Banner/Cookie_Banner.tsx. Two changes,
 * behaviour kept: (1) a registry row that still carries a Phase-10 marker is not listed (B-81, F3 —
 * the Bunny player row); (2) while layer 1 is open its height is written to `--cookie-banner-h` on
 * <body> so the page can scroll its last controls above the fixed banner (Release floor F6).
 * Mount <CookieBanner locale={locale} /> once in `app/[locale]/layout.tsx`;
 * put <CookieSettingsLink locale={locale} /> in both footers.
 * Styles: `Cookie_Banner.css` → `app/styles/`.
 *
 * Every consent button shares ONE class: «Reject» may never look quieter than
 * «Accept» (UODO, March 2025; art. 7(3) RODO for «Withdraw»).
 */

type Props = { locale: Locale };

export function CookieBanner({ locale }: Props) {
  const { stored, showBanner, acceptAll, rejectAll, save, withdraw } =
    useCookieConsent();
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const open = () => setSettingsOpen(true);
    window.addEventListener(OPEN_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, open);
  }, []);

  // F6: the fixed layer-1 banner must never cover the end of the page.
  const bannerRef = useRef<HTMLElement>(null);
  const bannerShown = showBanner && !settingsOpen;
  useEffect(() => {
    const body = document.body;
    const el = bannerRef.current;
    if (!bannerShown || !el) {
      body.style.removeProperty('--cookie-banner-h');
      return undefined;
    }
    const set = () =>
      body.style.setProperty('--cookie-banner-h', `${el.offsetHeight + 32}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => {
      ro.disconnect();
      body.style.removeProperty('--cookie-banner-h');
    };
  }, [bannerShown]);

  const close = useCallback(() => setSettingsOpen(false), []);
  const done = (action: () => void) => () => {
    action();
    close();
  };

  return (
    <>
      {bannerShown && (
        <section
          ref={bannerRef}
          className='cookie_banner'
          aria-labelledby='cookie_banner_title'
          data-cc='banner'
        >
          <h2 id='cookie_banner_title' className='cookie_banner__title'>
            {t(c.title, locale)}
          </h2>
          <p className='cookie_banner__text'>
            {t(c.message, locale)}{' '}
            <Link href='/privacy' className='cookie_banner__link'>
              {t(c.privacyPolicy, locale)}
            </Link>
          </p>
          <p className='cookie_banner__controller'>
            {t(c.controller, locale)}: {CONTROLLER.name}, {CONTROLLER.address}
            {' · '}
            {CONTROLLER.contact}
          </p>
          <div className='cookie_banner__actions'>
            <button
              type='button'
              className='cookie_banner__button'
              data-cc='settings'
              onClick={() => setSettingsOpen(true)}
            >
              {t(c.settings, locale)}
            </button>
            <button
              type='button'
              className='cookie_banner__button'
              data-cc='reject'
              onClick={rejectAll}
            >
              {t(c.rejectAll, locale)}
            </button>
            <button
              type='button'
              className='cookie_banner__button'
              data-cc='accept'
              onClick={acceptAll}
            >
              {t(c.acceptAll, locale)}
            </button>
          </div>
        </section>
      )}

      {settingsOpen && (
        <CookieSettings
          locale={locale}
          initial={{
            analytics: stored?.analytics ?? false,
            functional: stored?.functional ?? false,
            marketing: stored?.marketing ?? false,
          }}
          onSave={(consent) => {
            save(consent);
            close();
          }}
          onAcceptAll={done(acceptAll)}
          onRejectAll={done(rejectAll)}
          onWithdraw={done(withdraw)}
          onClose={close}
        />
      )}
    </>
  );
}

/** Footer item «Ustawienia cookies» — always present, the way back to the choice. */
export function CookieSettingsLink({ locale }: Props) {
  return (
    <button
      type='button'
      className='hv-link cookie_settings_link'
      onClick={openCookieSettings}
    >
      {t(c.footerLink, locale)}
    </button>
  );
}

// ── Layer 2 ─────────────────────────────────────────────────────────────

type SettingsProps = {
  locale: Locale;
  initial: Consent;
  onSave: (consent: Consent) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onWithdraw: () => void;
  onClose: () => void;
};

function CookieSettings({
  locale,
  initial,
  onSave,
  onAcceptAll,
  onRejectAll,
  onWithdraw,
  onClose,
}: SettingsProps) {
  const [analytics, setAnalytics] = useState(initial.analytics);
  const [functional, setFunctional] = useState(initial.functional);
  // Unchecked by default: only a stored «yes» checks it (10.0_Legal.md step 1).
  const [marketing, setMarketing] = useState(initial.marketing);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Escape closes, Tab stays inside, focus returns to the opener (WCAG 2.4.3).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const opener = document.activeElement as HTMLElement | null;
    const focusable = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button, [href], input:not([disabled]), summary',
        ),
      );
    (focusable()[0] ?? dialog).focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      // The opener can be gone (the banner unmounts) — never focus a detached node.
      const target =
        opener && opener !== document.body && opener.isConnected
          ? opener
          : document.querySelector<HTMLElement>(
              '.cookie_settings_link, .cookie_banner__button',
            );
      target?.focus();
    };
  }, [onClose]);

  return (
    <div
      className='cookie_settings'
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className='cookie_settings__dialog'
        role='dialog'
        aria-modal='true'
        aria-labelledby='cookie_settings_title'
        tabIndex={-1}
      >
        <div className='cookie_settings__header'>
          <h2 id='cookie_settings_title' className='cookie_settings__title'>
            {t(c.settingsTitle, locale)}
          </h2>
          <button
            type='button'
            className='cookie_settings__close'
            aria-label={t(c.close, locale)}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <p className='cookie_banner__controller'>
          {t(c.controller, locale)}: {CONTROLLER.name}, {CONTROLLER.address}
          {' · '}
          {CONTROLLER.contact}
        </p>

        <Category
          locale={locale}
          name={t(c.categories.necessary.name, locale)}
          description={t(c.categories.necessary.description, locale)}
          entries={COOKIE_REGISTRY.necessary}
          control={
            <span className='cookie_category__badge'>
              {t(c.required, locale)}
            </span>
          }
        />
        <Category
          locale={locale}
          name={t(c.categories.functional.name, locale)}
          description={t(c.categories.functional.description, locale)}
          entries={COOKIE_REGISTRY.functional}
          control={
            <input
              type='checkbox'
              className='cookie_category__toggle'
              checked={functional}
              onChange={(e) => setFunctional(e.target.checked)}
              aria-label={t(c.categories.functional.name, locale)}
            />
          }
        />
        <Category
          locale={locale}
          name={t(c.categories.analytics.name, locale)}
          description={t(c.categories.analytics.description, locale)}
          entries={COOKIE_REGISTRY.analytics}
          control={
            <input
              type='checkbox'
              className='cookie_category__toggle'
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
              aria-label={t(c.categories.analytics.name, locale)}
            />
          }
        />
        <Category
          locale={locale}
          name={t(c.categories.marketing.name, locale)}
          description={t(c.categories.marketing.description, locale)}
          entries={COOKIE_REGISTRY.marketing}
          control={
            <input
              type='checkbox'
              className='cookie_category__toggle'
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
              aria-label={t(c.categories.marketing.name, locale)}
            />
          }
        />

        <div className='cookie_settings__actions'>
          <button
            type='button'
            className='cookie_banner__button'
            data-cc='withdraw'
            onClick={onWithdraw}
          >
            {t(c.withdraw, locale)}
          </button>
          <button
            type='button'
            className='cookie_banner__button'
            data-cc='reject'
            onClick={onRejectAll}
          >
            {t(c.rejectAll, locale)}
          </button>
          <button
            type='button'
            className='cookie_banner__button'
            data-cc='accept'
            onClick={onAcceptAll}
          >
            {t(c.acceptAll, locale)}
          </button>
          <button
            type='button'
            className='cookie_banner__button'
            data-cc='save'
            onClick={() => onSave({ analytics, functional, marketing })}
          >
            {t(c.saveSettings, locale)}
          </button>
        </div>
      </div>
    </div>
  );
}

type CategoryProps = {
  locale: Locale;
  name: string;
  description: string;
  entries: CookieEntry[];
  control: React.ReactNode;
};

/** A row still holding a Phase-10 marker is not disclosed until the audit names it (B-81, F3). */
const hasMarker = (e: CookieEntry) =>
  [
    e.name ?? '',
    e.provider,
    ...Object.values(e.purpose),
    ...Object.values(e.duration ?? {}),
  ].some((v) => v.includes('[['));

function Category({
  locale,
  name,
  description,
  entries: all,
  control,
}: CategoryProps) {
  const entries = all.filter((e) => !hasMarker(e));
  return (
    <section className='cookie_category'>
      <div className='cookie_category__header'>
        <h3 className='cookie_category__name'>{name}</h3>
        {control}
      </div>
      <p className='cookie_category__description'>{description}</p>
      <details className='cookie_category__list'>
        <summary>
          {t(c.showList, locale)} ({entries.length})
        </summary>
        <dl className='cookie_disclosure'>
          {entries.map((entry) => {
            const provider = entry.policyUrl ? (
              <a
                href={entry.policyUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='cookie_banner__link'
              >
                {entry.provider}
              </a>
            ) : (
              entry.provider
            );
            // No name yet (marketing, before the audit): the provider heads the row.
            return (
              <div
                key={entry.name ?? entry.provider}
                className='cookie_disclosure__row'
              >
                <dt className='cookie_disclosure__name'>
                  {entry.name ?? provider}
                </dt>
                <dd className='cookie_disclosure__detail'>
                  <span>{t(entry.purpose, locale)}</span>
                  {entry.name && (
                    <span>
                      {t(c.provider, locale)}: {provider}
                    </span>
                  )}
                  {entry.duration && (
                    <span>
                      {t(c.duration, locale)}: {t(entry.duration, locale)}
                    </span>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      </details>
    </section>
  );
}
