'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import {
  CONSENT_CHANGED_EVENT,
  CONSENT_KEY,
  CONSENT_MAX_AGE_DAYS,
  CONSENT_VERSION,
  MAP_SESSION_KEY,
  mapCopy as c,
  mapPreview,
  mapUrls,
} from '@/lib/content/map';
import { t } from '@/lib/i18n/t';

/**
 * Click-to-load Google map (Release floor F4, `10_Legal/Skill_Legal.md` rule 10).
 * Before the click: a LOCAL OSM preview image + pin — no request to Google, no third-party
 * cookie. The `<iframe>` is created only after a click on `[data-map-load]`, or straight away
 * when the visitor granted the «functional» cookie category, or already clicked in this tab
 * session (sessionStorage). Nothing Google-related is rendered on the server.
 */

const MAP_EVENT = 'demo:map-shown';

function functionalGranted(): boolean {
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    const r = JSON.parse(raw) as {
      version?: string;
      timestamp?: string;
      functional?: boolean;
    };
    if (r.version !== CONSENT_VERSION || !r.timestamp) return false;
    const age = Date.now() - new Date(r.timestamp).getTime();
    return age < CONSENT_MAX_AGE_DAYS * 864e5 && r.functional === true;
  } catch {
    return false;
  }
}

function shownThisSession(): boolean {
  try {
    return window.sessionStorage.getItem(MAP_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  window.addEventListener(CONSENT_CHANGED_EVENT, onChange);
  window.addEventListener(MAP_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CONSENT_CHANGED_EVENT, onChange);
    window.removeEventListener(MAP_EVENT, onChange);
  };
}

const allowed = () => functionalGranted() || shownThisSession();

export function MapEmbed({
  locale,
  fallbackLabel,
}: {
  locale: Locale;
  /** Label of the `<noscript>` link to Google Maps. */
  fallbackLabel: string;
}) {
  const auto = useSyncExternalStore(subscribe, allowed, () => false);
  const [clicked, setClicked] = useState(false);
  const loaded = clicked || auto;
  const frameRef = useRef<HTMLIFrameElement>(null);

  // Keyboard users land on the map they asked for (WCAG 2.4.3), not on <body>.
  useEffect(() => {
    if (clicked) frameRef.current?.focus();
  }, [clicked]);

  const load = () => {
    setClicked(true);
    try {
      window.sessionStorage.setItem(MAP_SESSION_KEY, '1');
    } catch {
      // Blocked storage: the map still shows for this page view.
    }
    window.dispatchEvent(new Event(MAP_EVENT));
  };

  return (
    <div
      className='map_embed reveal'
      style={{ '--i': 1 } as React.CSSProperties}
    >
      <div
        className='map_embed_frame'
        data-map-state={loaded ? 'loaded' : 'preview'}
      >
        {loaded ? (
          <iframe
            ref={frameRef}
            className='map_embed_iframe'
            src={mapUrls.embed(locale)}
            title={t(c.iframeTitle, locale)}
            loading='lazy'
            referrerPolicy='no-referrer-when-downgrade'
            allowFullScreen
          />
        ) : (
          <>
            <Image
              className='map_embed_preview'
              src={mapPreview.src}
              width={mapPreview.width}
              height={mapPreview.height}
              alt={t(c.previewAlt, locale)}
              sizes='(max-width: 860px) 100vw, 640px'
            />
            <span className='map_embed_pin' aria-hidden='true' />
            <a
              className='map_embed_attr'
              href={mapUrls.osmCopyright}
              target='_blank'
              rel='noopener noreferrer'
            >
              © OpenStreetMap contributors
            </a>
            <noscript>
              <a className='btn map_embed_noscript' href={mapUrls.directions}>
                {fallbackLabel}
              </a>
            </noscript>
          </>
        )}
      </div>
      <div className='map_embed_bar'>
        {!loaded && (
          <p className='map_embed_notice note'>
            {t(c.notice, locale)}{' '}
            <Link href='/privacy' className='hv-link'>
              {t(c.privacyLink, locale)}
            </Link>
          </p>
        )}
        <div className='map_embed_actions'>
          {!loaded && (
            <button
              type='button'
              className='btn hv-btn-glow'
              data-map-load
              onClick={load}
            >
              {t(c.showMap, locale)}
            </button>
          )}
          <a
            className='btn btn_outline map_embed_route'
            href={mapUrls.directions}
            target='_blank'
            rel='noopener noreferrer'
            aria-label={t(c.routeAria, locale)}
            data-map-route
          >
            {t(c.route, locale)}
          </a>
        </div>
      </div>
    </div>
  );
}
