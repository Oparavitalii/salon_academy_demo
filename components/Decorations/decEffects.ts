/* Studio Demo — decor script «Колаж на двох папірцях» (Phase 8 · re-run 22.10.2026 · R-11).
   PORT of docs/8_Effects/Decorations.js into a TypeScript module for the Next.js build (Phase 11
   part A, 22.10.2026). The logic is the source's, line for line; what changed is only the wrapper:
     · no IIFE and no auto-init on DOMContentLoaded — the client component
       components/Decorations/Decorations.tsx calls init(root) on mount and after every route change
       and destroy() on unmount (8.0 §6);
     · window / matchMedia are read lazily (this module is also evaluated during SSR);
     · window.DecEffects is still set, so browser checks can call it like in Demo.html.
   API: init(root = document) — idempotent, scoped to root (each element set up once, marked
   data-dec); destroy() — disconnects the observers; hidden lines are drawn at once.
   1) Draw once — .dec_divider (strands) and .dec_scribble: on screen at init → "done" with no
      motion; below → "wait" → "done" on first entry, then unobserved. Reduced motion → "done".
   2) Tape — .dec_tape runs only while on screen: data-dec="off" pauses it (CSS). Hover pauses
      it too (CSS). Reduced motion stops it in CSS.
   3) Live strands — fix round 22.10 (owner, Decisions 22.10 «Анімація пасма», B-95): the cursor
      strands of 19.10 are back on the home hero (.dec_live on HeroHome). PORT of the live-strands
      part of this file at commit 46b77ef (Canvas 2D, 4 logo strands trailing the pointer); changes:
      colours are read from the HOST's computed style (its theme scope), the "holes" also cover the
      buttons, and only pointerType "mouse" moves them. Runs only while (pointer: fine) and
      (hover: hover) and (min-width: 1024px) and no reduced motion; stops when idle (20 still frames)
      or off screen; never paints over copy (holes cleared every frame, canvas under the text layer).
      Touch, < 1024 px, reduced motion, JS off → the static .dec_strands_rest stay (Decorations.css).
   16.11.2026 — client: hair decoration removed. No page carries a .dec_divider (strands) or a
   .dec_live host any more, so parts 1 (for the strands) and 3 find nothing and do nothing; the
   scribble (1) and the tape (2) still run. Kept as is for a quick revert (Strands.tsx, HeroHome.tsx).
   No colour literal here: every colour comes from the --fx-* tokens. */

type Hero = { host: HTMLElement; sync: () => void; destroy: () => void };
type Live = { stop: () => void } | null;

let reduce: MediaQueryList | null = null;
let fine: MediaQueryList | null = null;
let drawIO: IntersectionObserver | null = null;
let tapeIO: IntersectionObserver | null = null;
let heroes: Hero[] = [];
let watching = false;

function rm() {
  if (!reduce) reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  return reduce;
}

function fineQ() {
  if (!fine)
    fine = window.matchMedia(
      '(pointer: fine) and (hover: hover) and (min-width: 1024px)',
    );
  return fine;
}

function within(root: ParentNode, sel: string): HTMLElement[] {
  const list = Array.from(root.querySelectorAll<HTMLElement>(sel));
  if (root instanceof Element && root.matches(sel))
    list.unshift(root as HTMLElement);
  return list.filter((el) => !el.hasAttribute('data-dec'));
}

function lines(root: ParentNode) {
  const w = window;
  const els = within(root, '.dec_divider, .dec_scribble');
  if (!els.length) return;
  if (rm().matches || !('IntersectionObserver' in w)) {
    els.forEach((el) => el.setAttribute('data-dec', 'done'));
    return;
  }
  if (!drawIO)
    drawIO = new IntersectionObserver(
      (list) => {
        list.forEach((e) => {
          if (e.isIntersecting) {
            e.target.setAttribute('data-dec', 'done');
            drawIO?.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
  const vh = w.innerHeight || document.documentElement.clientHeight;
  els.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < vh && r.bottom > 0) el.setAttribute('data-dec', 'done');
    else {
      el.setAttribute('data-dec', 'wait');
      drawIO?.observe(el);
    }
  });
}

function tapes(root: ParentNode) {
  const els = within(root, '.dec_tape');
  if (!els.length || !('IntersectionObserver' in window)) return;
  if (!tapeIO)
    tapeIO = new IntersectionObserver((list) => {
      list.forEach((e) =>
        e.target.setAttribute('data-dec', e.isIntersecting ? 'on' : 'off'),
      );
    });
  els.forEach((el) => {
    el.setAttribute('data-dec', 'on');
    tapeIO?.observe(el);
  });
}

// ---- 3 · live strands, one controller per hero (port of 46b77ef) ----
function hero(host: HTMLElement): Hero {
  let live: Live = null;
  const c: Hero = {
    host,
    sync() {
      const want = fineQ().matches && !rm().matches && host.isConnected;
      if (want && !live) live = start(host);
      else if (!want && live) {
        live.stop();
        live = null;
      }
    },
    destroy() {
      if (live) {
        live.stop();
        live = null;
      }
      host.removeAttribute('data-dec');
    },
  };
  host.setAttribute('data-dec', 'live');
  return c;
}

function start(host: HTMLElement): Live {
  const w = window;
  const doc = document;
  const cs = w.getComputedStyle(host); // the host's own theme scope (dark hero on /)
  const tip = cs.getPropertyValue('--fx-accent').trim();
  const body = cs.getPropertyValue('--fx-strand').trim();
  const lw = parseFloat(cs.getPropertyValue('--fx-strand-width')) || 1.5;
  if (!tip || !body) return null;

  const cv = doc.createElement('canvas');
  cv.className = 'dec_live_canvas';
  cv.setAttribute('aria-hidden', 'true');
  host.insertBefore(cv, host.firstChild);
  const ctx = cv.getContext('2d');
  if (!ctx) {
    cv.remove();
    return null;
  }
  const dpr = Math.min(w.devicePixelRatio || 1, 2);
  let W = 0;
  let H = 0;

  // 4 strands, like the logo: fanned offsets, each a little lazier than the last
  const N = 4;
  const P = 22;
  type Pt = { x: number; y: number };
  const strands: { pts: Pt[]; ox: number; oy: number; k: number }[] = [];
  const fan = [
    [-26, -18],
    [-8, -30],
    [14, -22],
    [30, -6],
  ];
  for (let i = 0; i < N; i++) {
    const pts: Pt[] = [];
    for (let j = 0; j < P; j++) pts.push({ x: 0, y: 0 });
    strands.push({ pts, ox: fan[i][0], oy: fan[i][1], k: 0.34 - i * 0.04 });
  }
  let tx = 0;
  let ty = 0;
  let started = false;
  let inView = true;
  let raf = 0;
  let still = 0;
  let holes: number[][] = [];
  let dead = false;

  function measureHoles() {
    const r = host.getBoundingClientRect();
    const pad = 8;
    holes = Array.from(
      host.querySelectorAll('h1, h2, p, .eyebrow, .btn, .hero_actions'),
    ).map((el) => {
      const b = el.getBoundingClientRect();
      return [
        b.left - r.left - pad,
        b.top - r.top - pad,
        b.width + pad * 2,
        b.height + pad * 2,
      ];
    });
  }
  function size() {
    const r = host.getBoundingClientRect();
    W = r.width;
    H = r.height;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    measureHoles();
  }
  function step() {
    raf = 0;
    if (dead) return;
    let moved = 0;
    const c = ctx!;
    c.clearRect(0, 0, W, H);
    c.lineWidth = lw;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    strands.forEach((s) => {
      const p = s.pts;
      const a = p[0];
      const nx = a.x + (tx + s.ox - a.x) * s.k;
      const ny = a.y + (ty + s.oy - a.y) * s.k;
      moved = Math.max(moved, Math.abs(nx - a.x) + Math.abs(ny - a.y));
      a.x = nx;
      a.y = ny;
      for (let j = 1; j < P; j++) {
        // each point trails the one before it
        const q = p[j];
        const o = p[j - 1];
        const mx = q.x + (o.x - q.x) * 0.42;
        const my = q.y + (o.y - q.y) * 0.42 + 0.35; // a little weight
        moved = Math.max(moved, Math.abs(mx - q.x) + Math.abs(my - q.y));
        q.x = mx;
        q.y = my;
      }
      const g = c.createLinearGradient(p[0].x, p[0].y, p[P - 1].x, p[P - 1].y);
      g.addColorStop(0, tip);
      g.addColorStop(0.3, body);
      g.addColorStop(1, 'transparent');
      c.strokeStyle = g;
      c.beginPath();
      c.moveTo(p[0].x, p[0].y);
      for (let j = 1; j < P - 1; j++) {
        c.quadraticCurveTo(
          p[j].x,
          p[j].y,
          (p[j].x + p[j + 1].x) / 2,
          (p[j].y + p[j + 1].y) / 2,
        );
      }
      c.stroke();
    });
    holes.forEach((h) => c.clearRect(h[0], h[1], h[2], h[3])); // never over copy
    still = moved < 0.15 ? still + 1 : 0;
    if (inView && still < 20) raf = w.requestAnimationFrame(step); // idle → stop
  }
  function wake() {
    still = 0;
    if (!raf && inView && started && !dead) raf = w.requestAnimationFrame(step);
  }
  function move(e: PointerEvent) {
    if (e.pointerType !== 'mouse') return;
    const r = host.getBoundingClientRect();
    tx = e.clientX - r.left;
    ty = e.clientY - r.top;
    if (!started) {
      // the strands come alive at the pointer
      started = true;
      measureHoles();
      strands.forEach((s) =>
        s.pts.forEach((p) => {
          p.x = tx;
          p.y = ty;
        }),
      );
      host.classList.add('is_live');
    }
    wake();
  }
  host.addEventListener('pointermove', move, { passive: true });

  let hio: IntersectionObserver | null = null;
  let ro: ResizeObserver | null = null;
  if ('IntersectionObserver' in w) {
    hio = new IntersectionObserver((list) => {
      inView = list[0].isIntersecting;
      if (inView) wake();
      else if (raf) {
        w.cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    hio.observe(host);
  }
  if ('ResizeObserver' in w) {
    ro = new ResizeObserver(() => {
      size();
      wake();
    });
    ro.observe(host);
  }
  function remeasure() {
    if (!dead) {
      measureHoles();
      wake();
    }
  }
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(remeasure);
  if (doc.readyState !== 'complete')
    w.addEventListener('load', remeasure, { once: true });
  size();

  return {
    stop() {
      dead = true;
      if (raf) w.cancelAnimationFrame(raf);
      host.removeEventListener('pointermove', move);
      w.removeEventListener('load', remeasure);
      if (hio) hio.disconnect();
      if (ro) ro.disconnect();
      if (cv.parentNode) cv.parentNode.removeChild(cv);
      host.classList.remove('is_live'); // the static strands come back
    },
  };
}

function syncHeroes() {
  heroes.forEach((h) => h.sync());
}

function onReduce() {
  if (rm().matches)
    document
      .querySelectorAll('[data-dec="wait"]')
      .forEach((el) => el.setAttribute('data-dec', 'done'));
  syncHeroes();
}

export function init(root: ParentNode = document) {
  if (!watching) {
    watching = true;
    rm().addEventListener('change', onReduce);
    fineQ().addEventListener('change', syncHeroes);
  }
  lines(root);
  tapes(root);
  heroes = heroes.filter((h) => {
    if (h.host.isConnected) return true;
    h.destroy();
    return false;
  }); // left the page
  within(root, '.dec_live').forEach((host) => {
    const h = hero(host);
    heroes.push(h);
    h.sync();
  });
}

export function destroy() {
  heroes.forEach((h) => h.destroy());
  heroes = [];
  if (drawIO) {
    drawIO.disconnect();
    drawIO = null;
  }
  if (tapeIO) {
    tapeIO.disconnect();
    tapeIO = null;
  }
  document
    .querySelectorAll('[data-dec="wait"]')
    .forEach((el) => el.setAttribute('data-dec', 'done'));
  document
    .querySelectorAll('.dec_tape[data-dec]')
    .forEach((el) => el.removeAttribute('data-dec'));
  if (watching) {
    watching = false;
    rm().removeEventListener('change', onReduce);
    fineQ().removeEventListener('change', syncHeroes);
  }
}
