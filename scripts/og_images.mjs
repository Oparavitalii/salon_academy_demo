// Social preview images 1200×630 (Open Graph) — owner 28.10, skill Knowledge/Skills/Web_Design/
// Web_Seo_Meta_Header, look of the OdNowa360 card: the studio photo, dark gradient, pink brand line,
// big Playfair title, facts row, pink rule, phone. One JPG per page type × locale → public/og/.
// Run: node scripts/og_images.mjs  (Playwright renders the template with the site's Google fonts).
// 16.11.2026 (Dana: «меняем все фотографии, которые сделал фотограф»): the photos are the shoot frames, «5 ★».
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { chromium } from 'playwright';

// Photos go in as data URLs — a page made with setContent may not load file:// images.
const dataUrl = (f) =>
  `data:image/webp;base64,${readFileSync(resolve('public/images', f)).toString('base64')}`;
const LOGO = dataUrl('Logo/Logo_Black_Hair.webp');

const dict = Object.fromEntries(
  ['ru', 'pl', 'en'].map((l) => [
    l,
    JSON.parse(readFileSync(`lib/i18n/dict/${l}.json`, 'utf8')),
  ]),
);
const tr = (uk, l) => (l === 'uk' ? uk : (dict[l][uk] ?? uk));

const facts = {
  uk: '20+ років досвіду · 5 ★ у Booksy · Варшава',
  pl: '20+ lat doświadczenia · 5 ★ w Booksy · Warszawa',
  en: '20+ years of experience · 5 ★ on Booksy · Warsaw',
};
const homeTitle = {
  uk: 'Салон краси та академія нарощування у Варшаві',
  pl: 'Salon urody i akademia przedłużania włosów w Warszawie',
  en: 'Beauty salon & hair extension academy in Warsaw',
};
const pages = [
  {
    key: 'home',
    photo: 'Salon_Space/Studio_Life_13.webp',
    title: (l) => homeTitle[l],
  },
  {
    key: 'salon',
    photo: 'Salon_Space/Styling_Work_01.webp',
    title: (l) => tr('Преміальний догляд та нарощування волосся', l),
  },
  {
    key: 'courses',
    photo: 'Academy/Mentor_Model_01.webp',
    title: (l) => tr('Професійні курси: навчайтеся і заробляйте', l),
  },
  {
    key: 'about',
    photo: 'Salon_Space/Team_03.webp',
    title: (l) =>
      tr('Простір досконалої краси та професійного авторського навчання', l),
  },
  {
    key: 'contacts',
    photo: 'Salon_Space/Storefront_01.webp',
    title: (l) => tr('Як нас знайти у Варшаві', l),
  },
];

const html = (
  photo,
  title,
  fact,
) => `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;600&family=Playfair+Display:wght@500;600&display=block" rel="stylesheet">
<style>
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;font-family:Onest,sans-serif;background:radial-gradient(80% 90% at 78% 35%,#5a1240 0%,transparent 60%),linear-gradient(180deg,#120710 0%,#1c0a17 55%,#0a0408 100%)}
.ph{position:absolute;top:0;bottom:0;right:0;left:42%;background:url('${photo}') center 28%/cover}
.sh{position:absolute;top:0;bottom:0;right:0;left:42%;background:linear-gradient(90deg,#160811 0%,rgba(22,8,17,.55) 28%,rgba(22,8,17,0) 60%),linear-gradient(0deg,rgba(18,7,16,.7) 0%,rgba(18,7,16,0) 40%)}
.tx{position:absolute;left:72px;bottom:64px;width:600px;color:#fff}
.br{font:600 22px/1 Onest;letter-spacing:.32em;text-transform:uppercase;color:#f898d0;margin-bottom:22px}
h1{font:600 64px/1.06 'Playfair Display',serif;margin-bottom:22px;text-wrap:balance}
.fa{font:400 22px/1.3 Onest;color:rgba(255,255,255,.88)}
.ln{width:150px;height:3px;background:#f898d0;margin:26px 0 20px}
.tel{font:600 26px/1 Onest;letter-spacing:.02em}
.logo{position:absolute;right:56px;top:48px;width:132px;height:132px;border-radius:50%;background:#000 url('${LOGO}') center/115%;box-shadow:0 6px 30px rgba(0,0,0,.5)}
</style></head><body><div class="ph"></div><div class="sh"></div><div class="logo"></div>
<div class="tx"><p class="br">Studio Demo</p><h1>${title}</h1><p class="fa">${fact}</p><div class="ln"></div><p class="tel">+48 555 010 010</p></div></body></html>`;

mkdirSync('public/og', { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
for (const pg of pages)
  for (const l of ['uk', 'ru', 'pl', 'en']) {
    const photo = dataUrl(pg.photo);
    await p.setContent(html(photo, pg.title(l), facts[l]), {
      waitUntil: 'networkidle',
    });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({
      path: `public/og/${pg.key}_${l}.jpg`,
      type: 'jpeg',
      quality: 86,
    });
  }
await b.close();
console.log('og images:', pages.length * 4);
