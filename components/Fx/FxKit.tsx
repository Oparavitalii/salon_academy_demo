'use client';

import { useEffect } from 'react';

import { usePathname } from '@/i18n/navigation';

/**
 * FxKit — the owner's UI-kit pick (31.10.2026, `Downloads/ui_kit_selection.json`), ported from the
 * `kl` libraries (Knowledge/Skills/Web_Effects): Web_Wow_Effects `.wx-hscroll`, Web_Top_Effects
 * `.tx-mask` `.tx-orbit`, Web_Trend_Effects `.tr-tldr`, Web_Site_Effects `.sx-pin` `.sx-stack`
 * `.sx-autotabs`, Web_Animation words reveal `[data-fx="words"]`. Same class names and CSS contract
 * as the libraries (app/styles/fx_kit.css); the only additions are what a Next app needs:
 *   · every element is wired once (`data-fx-on`), so a client navigation never doubles a listener;
 *   · one scroll loop whose jobs drop themselves when their element leaves the page;
 *   · a re-scan after every route change.
 * Without JS everything is visible and static (rest states are scoped to `html.fx-js`).
 */

type Job = { el: Element; run: () => void };

const jobs: Job[] = [];
let ticking = false;
const frame = () => {
  ticking = false;
  for (let i = jobs.length - 1; i >= 0; i--) {
    if (!jobs[i].el.isConnected) jobs.splice(i, 1);
    else jobs[i].run();
  }
};
const schedule = () => {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(frame);
  }
};

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const reduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const once = (el: HTMLElement, key: string) => {
  if (el.dataset.fxOn?.includes(key)) return false;
  el.dataset.fxOn = `${el.dataset.fxOn ?? ''} ${key}`.trim();
  return true;
};

/* ---- wx-hscroll — vertical scroll drives a horizontal gallery ---- */
function initHscroll(el: HTMLElement) {
  const track = el.querySelector<HTMLElement>('.wx-hscroll__track');
  const stage = el.querySelector<HTMLElement>('.wx-hscroll__stage');
  if (!track || reduced()) return;
  let extra = 0;
  const size = () => {
    extra = Math.max(0, track.scrollWidth - window.innerWidth);
    el.style.height = `${window.innerHeight + extra}px`;
  };
  size();
  const ro = new ResizeObserver(() => {
    size();
    schedule();
  });
  ro.observe(track);
  jobs.push({
    el,
    run: () => {
      const r = el.getBoundingClientRect();
      const room = r.height - window.innerHeight;
      const p = room > 0 ? clamp(-r.top / room) : 0;
      el.style.setProperty('--wx-shift', (p * extra).toFixed(1));
    },
  });
  // a keyboard user tabbing to an off-screen card: move the page, not the clipped stage
  track.addEventListener('focusin', (e) => {
    const item = (e.target as HTMLElement).closest<HTMLElement>(
      '.wx-hscroll__item',
    );
    if (!item || !extra) return;
    const want = clamp(
      (item.offsetLeft - (window.innerWidth - item.offsetWidth) / 2) / extra,
    );
    requestAnimationFrame(() => {
      if (stage) stage.scrollLeft = 0;
      const top = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + want * extra, behavior: 'auto' });
    });
  });
  stage?.addEventListener('scroll', () => {
    if (stage.scrollLeft) stage.scrollLeft = 0;
  });
  el.classList.add('is-live');
}

/* ---- tx-mask — the picture opens out of its frame as it scrolls in ---- */
function initMask(el: HTMLElement) {
  if (reduced()) return;
  jobs.push({
    el,
    run: () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const k = clamp((vh - r.top - r.height * 0.1) / (vh * 0.75));
      el.style.setProperty('--tx-k', (1 - Math.pow(1 - k, 2)).toFixed(4));
    },
  });
}

/* ---- tx-orbit — items on a ring; picking one turns the ring and swaps the core (ARIA tabs) ---- */
let orbitSeq = 0;
function initOrbit(el: HTMLElement) {
  const ring = el.querySelector<HTMLElement>('.tx-orbit__ring') ?? el;
  const items = Array.from(
    el.querySelectorAll<HTMLButtonElement>('.tx-orbit__item'),
  );
  const panels = Array.from(
    el.querySelectorAll<HTMLElement>('.tx-orbit__panel'),
  );
  const n = items.length;
  if (!n) return;
  const uid = ++orbitSeq;
  let rot = 0;
  let cur = 0;
  let auto = Number(el.dataset.auto) || 0;
  let timer = 0;
  let seen = false;
  let held = false;
  const go = (i: number, focus = false) => {
    cur = ((i % n) + n) % n;
    const want = (-360 / n) * cur;
    const d = ((((want - rot) % 360) + 540) % 360) - 180; // the short way round
    rot += d;
    el.style.setProperty('--tx-rot', `${rot}deg`);
    items.forEach((b, k) => {
      const on = k === cur;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
      panels[k]?.classList.toggle('is-on', on);
    });
    if (focus) items[cur].focus();
  };
  const stop = () => {
    window.clearInterval(timer);
    timer = 0;
    auto = 0;
  };
  ring.setAttribute('role', 'tablist');
  items.forEach((b, i) => {
    b.style.setProperty('--tx-a', `${(360 / n) * i}deg`);
    b.setAttribute('role', 'tab');
    b.id = b.id || `tx-orbit-${uid}-t${i}`;
    const p = panels[i];
    if (p) {
      p.id = p.id || `tx-orbit-${uid}-p${i}`;
      p.setAttribute('role', 'tabpanel');
      p.setAttribute('aria-labelledby', b.id);
      b.setAttribute('aria-controls', p.id);
    }
    b.addEventListener('click', () => {
      stop();
      go(i);
    });
    b.addEventListener('keydown', (e) => {
      const k = e.key;
      const to =
        k === 'ArrowRight' || k === 'ArrowDown'
          ? cur + 1
          : k === 'ArrowLeft' || k === 'ArrowUp'
            ? cur - 1
            : k === 'Home'
              ? 0
              : k === 'End'
                ? n - 1
                : null;
      if (to === null) return;
      e.preventDefault();
      stop();
      go(to, true);
    });
  });
  go(0);
  if (auto && !reduced()) {
    el.addEventListener('pointerenter', () => (held = true));
    el.addEventListener('pointerleave', () => (held = false));
    el.addEventListener('focusin', stop);
    new IntersectionObserver(
      (es) => (seen = es[es.length - 1].isIntersecting),
      { threshold: 0.4 },
    ).observe(el);
    timer = window.setInterval(() => {
      if (!el.isConnected) return window.clearInterval(timer);
      if (seen && !held) go(cur + 1);
    }, auto);
  }
}

/* ---- tr-tldr — one switch folds the text down to its key sentences and back ---- */
function initTldr(el: HTMLElement) {
  const body = el.querySelector<HTMLElement>('.tr-tldr__body');
  const btns = Array.from(
    el.querySelectorAll<HTMLButtonElement>('[data-mode]'),
  );
  const time = el.querySelector<HTMLElement>('.tr-tldr__time');
  if (!body) return;
  const sec = el.dataset.sec ?? 's';
  const min = el.dataset.min ?? 'min';
  let busy = 0;
  let goal: string | null = null;
  const mark = (mode: string) => {
    btns.forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.mode === mode)),
    );
    if (time) {
      const words = (body.innerText || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
      const s = Math.max(1, Math.round((words / 180) * 60));
      time.textContent =
        s < 60 ? `≈ ${s} ${sec}` : `≈ ${Math.round(s / 60)} ${min}`;
    }
  };
  const set = (mode: string) => {
    const short = mode === 'short';
    const now = goal ?? (el.classList.contains('is-short') ? 'short' : 'full');
    if (mode === now) return;
    goal = mode;
    if (reduced()) {
      el.classList.toggle('is-short', short);
      mark(mode);
      return;
    }
    const id = ++busy;
    const h0 = body.offsetHeight;
    const slide = () => {
      const h1 = body.offsetHeight;
      body.style.height = `${h0}px`;
      void body.offsetHeight;
      body.style.height = `${h1}px`;
      mark(mode);
      window.setTimeout(() => {
        if (id !== busy) return;
        body.style.height = '';
        el.classList.remove('is-fading');
      }, 640);
    };
    el.classList.add('is-fading');
    if (short)
      window.setTimeout(() => {
        if (id !== busy) return;
        el.classList.add('is-short');
        slide();
      }, 260);
    else {
      el.classList.remove('is-short');
      slide();
    }
  };
  btns.forEach((b) =>
    b.addEventListener('click', () => set(b.dataset.mode ?? 'full')),
  );
  if (el.dataset.start === 'short') el.classList.add('is-short');
  mark(el.classList.contains('is-short') ? 'short' : 'full');
}

/* ---- sx-pin — the picture stays, the steps scroll past and switch it ---- */
function initPin(root: HTMLElement) {
  const steps = Array.from(root.querySelectorAll<HTMLElement>('.sx-pin__step'));
  const panels = Array.from(
    root.querySelectorAll<HTMLElement>('.sx-pin__panel'),
  );
  const set = (i: number) => {
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    panels.forEach((p, k) => p.classList.toggle('is-active', k === i));
  };
  set(0);
  const mq = window.matchMedia('(max-width: 820px)');
  let io: IntersectionObserver | null = null;
  const watch = () => {
    io?.disconnect();
    io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) set(steps.indexOf(e.target as HTMLElement));
        }),
      {
        rootMargin: mq.matches ? '-44% 0px -55% 0px' : '-48% 0px -48% 0px',
      },
    );
    steps.forEach((s) => io!.observe(s));
  };
  watch();
  mq.addEventListener('change', watch);
}

/* ---- sx-stack — cards pile up as you scroll; the ones underneath shrink back ---- */
function initStack(root: HTMLElement) {
  const cards = Array.from(
    root.querySelectorAll<HTMLElement>('.sx-stack__card'),
  );
  cards.forEach((c, i) => c.style.setProperty('--sx-i', String(i)));
  if (reduced()) return;
  jobs.push({
    el: root,
    run: () => {
      for (let i = 0; i < cards.length; i++) {
        const next = cards[i + 1];
        let s = 1;
        if (next) {
          const a = cards[i].getBoundingClientRect();
          const b = next.getBoundingClientRect();
          const cover = 1 - clamp((b.top - a.top) / Math.max(1, a.height));
          s = 1 - cover * 0.06;
        }
        cards[i].style.setProperty('--sx-s', s.toFixed(4));
      }
    },
  });
}

/* ---- sx-autotabs — tabs that advance on their own, each with a progress line ---- */
function initAutotabs(root: HTMLElement) {
  const tabs = Array.from(
    root.querySelectorAll<HTMLButtonElement>('.sx-autotabs__tab'),
  );
  const panels = Array.from(
    root.querySelectorAll<HTMLElement>('.sx-autotabs__panel'),
  );
  if (!tabs.length) return;
  const ms = Number(root.dataset.auto) || 5000;
  root.style.setProperty('--sx-auto', `${ms}ms`);
  const current = () =>
    tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
  const select = (i: number, focus = false) => {
    i = (i + tabs.length) % tabs.length;
    tabs.forEach((t, k) => {
      t.setAttribute('aria-selected', String(k === i));
      t.tabIndex = k === i ? 0 : -1;
    });
    panels.forEach((p, k) => (p.hidden = k !== i));
    if (focus) tabs[i].focus();
    if (!reduced()) {
      root.classList.remove('is-running');
      void root.offsetWidth;
      root.classList.add('is-running');
    }
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', (e) => {
      const k = e.key;
      const d =
        k === 'ArrowRight' || k === 'ArrowDown'
          ? 1
          : k === 'ArrowLeft' || k === 'ArrowUp'
            ? -1
            : 0;
      if (d) {
        e.preventDefault();
        select(current() + d, true);
      } else if (k === 'Home') {
        e.preventDefault();
        select(0, true);
      } else if (k === 'End') {
        e.preventDefault();
        select(tabs.length - 1, true);
      }
    });
  });
  select(Math.max(0, current()));
  if (reduced()) return;
  root.addEventListener('animationend', (e) => {
    if ((e as AnimationEvent).animationName === 'sx-fill')
      select(current() + 1);
  });
  const pause = (on: boolean) => root.classList.toggle('is-paused', on);
  root.addEventListener('pointerenter', () => pause(true));
  root.addEventListener('pointerleave', () => pause(false));
  root.addEventListener('focusin', () => pause(true));
  root.addEventListener('focusout', () => pause(false));
}

/* ---- words — a heading's words rise in one after another as it enters ---- */
let wordsIo: IntersectionObserver | null = null;
function initWords(el: HTMLElement) {
  if (reduced() || !('IntersectionObserver' in window)) {
    el.classList.add('is-in');
    return;
  }
  wordsIo ??= new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        wordsIo?.unobserve(e.target);
      }),
    { rootMargin: '0px 0px -12% 0px' },
  );
  wordsIo.observe(el);
}

const WIRES: [string, string, (el: HTMLElement) => void][] = [
  ['.wx-hscroll', 'hscroll', initHscroll],
  ['.tx-mask', 'mask', initMask],
  ['.tx-orbit', 'orbit', initOrbit],
  ['.tr-tldr', 'tldr', initTldr],
  ['.sx-pin', 'pin', initPin],
  ['.sx-stack', 'stack', initStack],
  ['.sx-autotabs', 'autotabs', initAutotabs],
  ['[data-fx="words"]', 'words', initWords],
];

function scan() {
  for (const [sel, key, init] of WIRES)
    document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
      if (once(el, key)) init(el);
    });
  schedule();
}

let listening = false;
let firstLoad = true;

/**
 * Runs `fn` once the page has finished hydrating: the streamed parts of a server page hydrate after
 * this layout component, and touching their DOM earlier (a class, a text) breaks hydration. On the
 * first load: after `load` and an idle slot; on a client navigation there is no hydration — next frame.
 */
function afterHydration(fn: () => void) {
  if (!firstLoad) {
    const id = requestAnimationFrame(fn);
    return () => cancelAnimationFrame(id);
  }
  let cancelled = false;
  const run = () => {
    if (cancelled) return;
    firstLoad = false;
    fn();
  };
  const idle = () => {
    if (typeof window.requestIdleCallback === 'function')
      window.requestIdleCallback(run, { timeout: 1200 });
    else setTimeout(run, 200);
  };
  if (document.readyState === 'complete') idle();
  else window.addEventListener('load', idle, { once: true });
  return () => {
    cancelled = true;
  };
}

/** Mounted once in the locale layout; re-scans after every client navigation. */
export function FxKit() {
  const pathname = usePathname();
  useEffect(() => {
    if (!listening) {
      listening = true;
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule);
    }
    return afterHydration(() => {
      document.documentElement.classList.add('fx-js');
      scan();
    });
  }, [pathname]);
  return null;
}
