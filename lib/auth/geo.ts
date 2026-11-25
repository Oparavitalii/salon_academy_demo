/**
 * Country / city / device of a request.
 *
 * Geo headers (`cf-ipcountry`, `cf-ipcity`) are trusted ONLY when the request really came
 * through Cloudflare: `TRUST_CLOUDFLARE=1` is set AND the connecting address that Fly reports
 * (`fly-client-ip`) lies in Cloudflare's published ranges. Anyone can send the header to Fly
 * directly, so without that proof the country stays unknown. Today the domain has no Cloudflare
 * in front (SEOHOST DNS → Fly), so country and city come from the offline DB-IP Lite file
 * (lib/auth/geoDb.ts) looked up by `fly-client-ip` — set by Fly's proxy, not by the client.
 * Nothing is sent to a third party. No file → unknown, as before.
 *
 * `GEO_TRUST_ANY=1` (development only, ignored in production) trusts the header from anywhere,
 * so the alert flow can be tested locally.
 */

import { lookupIp } from './geoDb';

// https://www.cloudflare.com/ips-v4 and /ips-v6 (published ranges).
const CF_V4 = [
  '173.245.48.0/20',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '141.101.64.0/18',
  '108.162.192.0/18',
  '190.93.240.0/20',
  '188.114.96.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
  '162.158.0.0/15',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '172.64.0.0/13',
  '131.0.72.0/22',
];
const CF_V6 = [
  '2400:cb00::/32',
  '2606:4700::/32',
  '2803:f800::/32',
  '2405:b500::/32',
  '2405:8100::/32',
  '2a06:98c0::/29',
  '2c0f:f248::/32',
];

function v4(ip: string): bigint | null {
  const p = ip.split('.');
  if (p.length !== 4) return null;
  let n = BigInt(0);
  for (const s of p) {
    const x = Number(s);
    if (!Number.isInteger(x) || x < 0 || x > 255) return null;
    n = (n << BigInt(8)) + BigInt(x);
  }
  return n;
}

function v6(ip: string): bigint | null {
  if (!ip.includes(':')) return null;
  const [head, tail = ''] = ip.split('::');
  const h = head ? head.split(':') : [];
  const t = tail ? tail.split(':') : [];
  if (!ip.includes('::') && h.length !== 8) return null;
  const groups = [...h, ...Array(8 - h.length - t.length).fill('0'), ...t];
  let n = BigInt(0);
  for (const g of groups) {
    if (!/^[0-9a-f]{1,4}$/i.test(g)) return null;
    n = (n << BigInt(16)) + BigInt(parseInt(g, 16));
  }
  return n;
}

function inCidr(ip: string, cidr: string): boolean {
  const [base, bitsStr] = cidr.split('/');
  const isV6 = base.includes(':');
  const a = isV6 ? v6(ip) : v4(ip);
  const b = isV6 ? v6(base) : v4(base);
  if (a === null || b === null) return false;
  const width = isV6 ? 128 : 32;
  const shift = BigInt(width - Number(bitsStr));
  return a >> shift === b >> shift;
}

export function isCloudflareIp(ip: string | null): boolean {
  if (!ip) return false;
  const clean = ip.replace(/^::ffff:/, '');
  return [...CF_V4, ...CF_V6].some((c) => inCidr(clean, c));
}

export function readGeo(headers: Headers) {
  const flyClient = headers.get('fly-client-ip');
  const ip =
    headers.get('cf-connecting-ip') && isCloudflareIp(flyClient)
      ? headers.get('cf-connecting-ip')
      : (flyClient ??
        headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        null);

  const viaCloudflare =
    process.env.TRUST_CLOUDFLARE === '1' && isCloudflareIp(flyClient);
  const devTrust =
    process.env.NODE_ENV !== 'production' && process.env.GEO_TRUST_ANY === '1';
  const trusted = viaCloudflare || devTrust;

  const rawCountry = trusted ? headers.get('cf-ipcountry') : null;
  const country =
    rawCountry && /^[A-Z]{2}$/i.test(rawCountry) && rawCountry !== 'XX'
      ? rawCountry.toUpperCase()
      : null;
  const rawCity = trusted ? headers.get('cf-ipcity') : null;
  let city: string | null = null;
  if (rawCity) {
    try {
      city = decodeURIComponent(rawCity).slice(0, 80);
    } catch {
      city = rawCity.slice(0, 80);
    }
  }
  const device = (headers.get('user-agent') ?? 'unknown').slice(0, 200);
  if (!trusted) {
    const hit = lookupIp(ip);
    return {
      country: hit?.country ?? null,
      city: hit?.city ?? null,
      ip,
      device,
    };
  }
  return { country, city, ip, device };
}
