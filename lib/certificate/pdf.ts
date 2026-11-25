import { readFile } from 'node:fs/promises';
import path from 'node:path';

import fontkit from '@pdf-lib/fontkit';
import {
  PDFDocument,
  type PDFFont,
  type PDFPage,
  popGraphicsState,
  pushGraphicsState,
  rgb,
  setCharacterSpacing,
} from 'pdf-lib';

/**
 * Certificate PDF (owner 30.10.2026): the studio's IPHM certificate (Canva export, 1414 × 2000 px)
 * as the background, with the variable text drawn on top. The background in
 * `content/certificate/Template_Online.png` already has the course title, format, duration,
 * location, date and number erased; this file writes the name, course title, «Online», date and
 * number back. Coordinates are template pixels (top-left origin) and are scaled to A4.
 * Fonts: Great Vibes (name), Lora (course title), Open Sans (details) — SIL OFL 1.1.
 */

export type CertificateData = {
  /** «Olena Kosheleva» — drawn on the line. */
  name: string;
  /** Course title, line 1 (drawn in capitals). */
  courseLine1: string;
  /** Course title, line 2 (optional subtitle). */
  courseLine2?: string | null;
  /** Date of issue, already formatted: «30.10.2026». */
  date: string;
  /** «DEMO/IPHM/2026/028». */
  number: string;
};

const DIR = path.join(process.cwd(), 'content', 'certificate');
const A4 = { w: 595.28, h: 841.89 };
const PINK = rgb(248 / 255, 152 / 255, 208 / 255);
const WHITE = rgb(1, 1, 1);

let assets: Promise<Record<string, Buffer>> | null = null;
function loadAssets() {
  assets ??= Promise.all(
    ['Template_Online.png', 'Great_Vibes.ttf', 'Lora.ttf', 'Open_Sans.ttf'].map(
      async (f) => [f, await readFile(path.join(DIR, f))] as const,
    ),
  ).then(Object.fromEntries);
  return assets;
}

export async function buildCertificatePdf(
  d: CertificateData,
): Promise<Uint8Array> {
  const a = await loadAssets();
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`Certificate ${d.number} — ${d.name}`);
  doc.setAuthor('DEMO Beauty Academy');

  const png = await doc.embedPng(a['Template_Online.png']);
  const k = A4.w / png.width;
  const page = doc.addPage([A4.w, A4.h]);
  page.drawImage(png, { x: 0, y: 0, width: A4.w, height: A4.h });

  const script = await doc.embedFont(a['Great_Vibes.ttf'], { subset: true });
  const serif = await doc.embedFont(a['Lora.ttf'], { subset: true });
  const sans = await doc.embedFont(a['Open_Sans.ttf'], { subset: true });

  const text = makeCenter(page, k);
  text(d.name, script, 92, 720, 612, PINK, 820);
  text(d.courseLine1.toUpperCase(), serif, 58, 707, 880, WHITE, 1150, 3);
  if (d.courseLine2) text(d.courseLine2, serif, 60, 694, 952, WHITE, 1000, 4);
  text('Online', sans, 27, 377, 1131, WHITE);
  text('DATE OF ISSUE:', sans, 27, 986, 1090, WHITE);
  text(d.date, sans, 27, 986, 1130, WHITE);
  text(`Certificate No: ${d.number}`, sans, 27, 375, 1310, WHITE);

  return doc.save();
}

/** Centred one-line text; shrinks (with its letter spacing) until it fits `maxW` px. */
function makeCenter(page: PDFPage, k: number) {
  const H = page.getHeight();
  return (
    s: string,
    font: PDFFont,
    sizePx: number,
    cx: number,
    baseY: number,
    color: ReturnType<typeof rgb>,
    maxW = 1300,
    trackPx = 0,
  ) => {
    let size = sizePx * k;
    let sp = trackPx * k;
    const width = () =>
      font.widthOfTextAtSize(s, size) + sp * Math.max(0, [...s].length - 1);
    while (width() > maxW * k && size > 6) {
      size -= 0.25;
      sp = trackPx * k * (size / (sizePx * k));
    }
    page.pushOperators(pushGraphicsState(), setCharacterSpacing(sp));
    page.drawText(s, {
      x: cx * k - width() / 2,
      y: H - baseY * k,
      size,
      font,
      color,
    });
    page.pushOperators(popGraphicsState());
  };
}
