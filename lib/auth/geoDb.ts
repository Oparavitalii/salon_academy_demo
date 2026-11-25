import { closeSync, existsSync, fstatSync, openSync, readSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Offline IP → country / city from the DB-IP «IP to City Lite» file (MaxMind DB format,
 * CC BY 4.0 — attribution «IP Geolocation by DB-IP» is shown on /admin/logins). The file is
 * ~130 MB and the machine has 512 MB, so it is NOT loaded into memory: every lookup reads only
 * the few hundred bytes it needs from disk through a small page cache. Nothing leaves the server.
 *
 * Path: `GEO_DB_PATH` or `data/geo/dbip-city-lite.mmdb` (scripts/geo_db_fetch.mjs). No file →
 * every lookup answers null and the login log shows «країна невідома», as before.
 */

const PAGE = 4096;
const MAX_PAGES = 512; // ≤ 2 MB of cache
const META_MARKER = Buffer.from('abcdef4d61784d696e642e636f6d', 'hex'); // \xAB\xCD\xEF MaxMind.com

type Db = {
  fd: number;
  size: number;
  nodeCount: number;
  recordSize: number;
  ipVersion: number;
  treeSize: number;
  pages: Map<number, Buffer>;
  ipv4Start: number;
};

let db: Db | null | undefined;

function page(d: Db, n: number): Buffer {
  let p = d.pages.get(n);
  if (p) {
    d.pages.delete(n);
    d.pages.set(n, p); // LRU: most recent last
    return p;
  }
  p = Buffer.alloc(PAGE);
  readSync(d.fd, p, 0, PAGE, n * PAGE);
  d.pages.set(n, p);
  if (d.pages.size > MAX_PAGES) d.pages.delete(d.pages.keys().next().value!);
  return p;
}

function bytes(d: Db, pos: number, len: number): Buffer {
  const first = Math.floor(pos / PAGE);
  const last = Math.floor((pos + len - 1) / PAGE);
  if (first === last) {
    const o = pos - first * PAGE;
    return page(d, first).subarray(o, o + len);
  }
  const out = Buffer.alloc(len);
  for (let i = 0; i < len; i++) {
    const at = pos + i;
    out[i] = page(d, Math.floor(at / PAGE))[at % PAGE];
  }
  return out;
}

function uint(b: Buffer): number {
  let n = 0;
  for (const x of b) n = n * 256 + x;
  return n;
}

/** Decodes one MaxMind DB data field at `pos`; `base` = start of the section pointers refer to. */
function decode(d: Db, pos: number, base: number): [unknown, number] {
  const ctrl = bytes(d, pos, 1)[0];
  pos++;
  let type = ctrl >> 5;
  if (type === 1) {
    const ss = (ctrl >> 3) & 3;
    const v = ctrl & 7;
    let p: number;
    if (ss === 0) p = v * 256 + bytes(d, pos, 1)[0];
    else if (ss === 1) p = v * 65536 + uint(bytes(d, pos, 2)) + 2048;
    else if (ss === 2) p = v * 16777216 + uint(bytes(d, pos, 3)) + 526336;
    else p = uint(bytes(d, pos, 4));
    const [value] = decode(d, base + p, base);
    return [value, pos + ss + 1];
  }
  if (type === 0) {
    type = 7 + bytes(d, pos, 1)[0];
    pos++;
  }
  let size = ctrl & 0x1f;
  if (size === 29) {
    size = 29 + bytes(d, pos, 1)[0];
    pos++;
  } else if (size === 30) {
    size = 285 + uint(bytes(d, pos, 2));
    pos += 2;
  } else if (size === 31) {
    size = 65821 + uint(bytes(d, pos, 3));
    pos += 3;
  }
  switch (type) {
    case 2:
      return [bytes(d, pos, size).toString('utf8'), pos + size];
    case 3:
      return [bytes(d, pos, 8).readDoubleBE(0), pos + 8];
    case 4:
      return [Buffer.from(bytes(d, pos, size)), pos + size];
    case 5:
    case 6:
    case 9:
    case 10:
      return [size > 6 ? 0 : uint(bytes(d, pos, size)), pos + size];
    case 8:
      return [size ? bytes(d, pos, size).readIntBE(0, size) : 0, pos + size];
    case 7: {
      const o: Record<string, unknown> = {};
      for (let i = 0; i < size; i++) {
        const [k, p1] = decode(d, pos, base);
        const [v, p2] = decode(d, p1, base);
        o[String(k)] = v;
        pos = p2;
      }
      return [o, pos];
    }
    case 11: {
      const a: unknown[] = [];
      for (let i = 0; i < size; i++) {
        const [v, p] = decode(d, pos, base);
        a.push(v);
        pos = p;
      }
      return [a, pos];
    }
    case 14:
      return [size !== 0, pos];
    case 15:
      return [bytes(d, pos, 4).readFloatBE(0), pos + 4];
    default:
      throw new Error(`mmdb: unknown type ${type}`);
  }
}

function record(d: Db, node: number, bit: 0 | 1): number {
  const rs = d.recordSize;
  const b = bytes(d, (node * rs * 2) / 8, (rs * 2) / 8);
  if (rs === 24) return bit ? uint(b.subarray(3, 6)) : uint(b.subarray(0, 3));
  if (rs === 28)
    return bit
      ? (b[3] & 0x0f) * 16777216 + uint(b.subarray(4, 7))
      : ((b[3] & 0xf0) >> 4) * 16777216 + uint(b.subarray(0, 3));
  if (rs === 32) return bit ? uint(b.subarray(4, 8)) : uint(b.subarray(0, 4));
  throw new Error(`mmdb: record size ${rs}`);
}

function open(): Db | null {
  const file =
    process.env.GEO_DB_PATH ||
    join(process.cwd(), 'data', 'geo', 'dbip-city-lite.mmdb');
  if (!existsSync(file)) return null;
  const fd = openSync(file, 'r');
  try {
    const size = fstatSync(fd).size;
    const tailLen = Math.min(size, 128 * 1024);
    const tail = Buffer.alloc(tailLen);
    readSync(fd, tail, 0, tailLen, size - tailLen);
    const at = tail.lastIndexOf(META_MARKER);
    if (at < 0) throw new Error('mmdb: metadata not found');
    const d: Db = {
      fd,
      size,
      nodeCount: 0,
      recordSize: 0,
      ipVersion: 0,
      treeSize: 0,
      pages: new Map(),
      ipv4Start: 0,
    };
    const metaPos = size - tailLen + at + META_MARKER.length;
    const meta = decode(d, metaPos, metaPos)[0] as Record<string, number>;
    d.nodeCount = meta.node_count;
    d.recordSize = meta.record_size;
    d.ipVersion = meta.ip_version;
    d.treeSize = (d.nodeCount * d.recordSize * 2) / 8;
    // IPv4 lives under ::/96 in an IPv6 tree: walk 96 zero bits once.
    let node = 0;
    if (d.ipVersion === 6)
      for (let i = 0; i < 96 && node < d.nodeCount; i++)
        node = record(d, node, 0);
    d.ipv4Start = node;
    return d;
  } catch (e) {
    closeSync(fd);
    console.error('[geo] database unreadable:', e);
    return null;
  }
}

function bits(ip: string): number[] | null {
  const clean = ip.replace(/^::ffff:/i, '');
  if (/^\d+\.\d+\.\d+\.\d+$/.test(clean)) {
    const parts = clean.split('.').map(Number);
    if (parts.some((x) => x > 255)) return null;
    return parts.flatMap((x) =>
      Array.from({ length: 8 }, (_, i) => (x >> (7 - i)) & 1),
    );
  }
  if (!clean.includes(':')) return null;
  const [head, tail = ''] = clean.split('::');
  const h = head ? head.split(':') : [];
  const t = tail ? tail.split(':') : [];
  if (!clean.includes('::') && h.length !== 8) return null;
  const groups = [...h, ...Array(8 - h.length - t.length).fill('0'), ...t];
  if (groups.length !== 8 || groups.some((g) => !/^[0-9a-f]{1,4}$/i.test(g)))
    return null;
  return groups.flatMap((g) => {
    const x = parseInt(g, 16);
    return Array.from({ length: 16 }, (_, i) => (x >> (15 - i)) & 1);
  });
}

export type GeoHit = { country: string | null; city: string | null };

/** Country (ISO-2) and city (English name) of an IP, or null when unknown. */
export function lookupIp(ip: string | null): GeoHit | null {
  if (!ip) return null;
  if (db === undefined) db = open();
  if (!db) return null;
  const b = bits(ip);
  if (!b) return null;
  try {
    let node = b.length === 32 && db.ipVersion === 6 ? db.ipv4Start : 0;
    for (const bit of b) {
      if (node >= db.nodeCount) break;
      node = record(db, node, bit as 0 | 1);
    }
    if (node <= db.nodeCount) return null; // == nodeCount: no data for this address
    const dataStart = db.treeSize + 16;
    const pos = node - db.nodeCount - 16 + dataStart;
    const rec = decode(db, pos, dataStart)[0] as {
      country?: { iso_code?: string };
      city?: { names?: Record<string, string> };
    };
    const iso = rec?.country?.iso_code;
    const country = iso && /^[A-Z]{2}$/.test(iso) && iso !== 'ZZ' ? iso : null;
    const city = rec?.city?.names?.en?.slice(0, 80) ?? null;
    return country || city ? { country, city } : null;
  } catch (e) {
    console.error('[geo] lookup failed:', e);
    return null;
  }
}
