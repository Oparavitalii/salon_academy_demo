import { uk4 } from '@/lib/i18n/t';

/**
 * MapEmbed (/salon `#location`, /contacts `#map`) — Release floor F4, owner 20.10.2026:
 * «Google Maps по кліку». The preview is a local OSM tile composite (no third party on load);
 * the Google iframe is created only after the click or when the «functional» cookie category
 * is granted (`docs/10_Legal/Cookie_Banner`, CONSENT_VERSION 3 — must equal `Use_Cookie_Consent.ts`).
 */

/** Building «22, ul. Przykładowa» — nominatim.openstreetmap.org, way 895172029 (20.10.2026). */
export const salonGeo = { lat: 52.14568, lon: 21.02615 };

const query = encodeURIComponent('ul. Przykładowa 1, 00-001 Warszawa');

export const mapUrls = {
  /** Created only after the click — never rendered on the server. */
  embed: (hl: string) =>
    `https://www.google.com/maps?q=${query}&hl=${hl}&z=16&output=embed`,
  /** «Маршрут» — Google Maps directions, new tab. */
  directions: `https://www.google.com/maps/dir/?api=1&destination=${query}`,
  osmCopyright: 'https://www.openstreetmap.org/copyright',
};

/** Local static preview: z17 tiles from tile.openstreetmap.org, 960×600, pin = image centre. */
export const mapPreview = {
  src: '/images/Map/Salon_Map_Preview.webp',
  width: 960,
  height: 600,
};

/** Consent record written by the cookie banner (`Use_Cookie_Consent.ts`). */
export const CONSENT_KEY = 'demo_cookie_consent';
export const CONSENT_VERSION = '3';
export const CONSENT_MAX_AGE_DAYS = 180;
export const CONSENT_CHANGED_EVENT = 'demo:cookie-consent-changed';
/** sessionStorage flag: the visitor clicked «Показати мапу» in this tab session. */
export const MAP_SESSION_KEY = 'demo_map_shown';

export const mapCopy = {
  showMap: uk4('Показати мапу'),
  route: uk4('Маршрут'),
  routeAria: uk4('Маршрут у Google Maps (відкриється в новій вкладці)'),
  previewAlt: uk4(
    'Мапа околиць салону: вулиця Прикладова, 1, Середмістя, Варшава',
  ),
  notice: uk4(
    'Мапу показує Google: після натискання він отримає Вашу IP-адресу і може встановити файли cookie.',
  ),
  privacyLink: uk4('Політика конфіденційності'),
  iframeTitle: uk4('Мапа Google: Studio Demo, Przykładowa 1, Варшава'),
};
