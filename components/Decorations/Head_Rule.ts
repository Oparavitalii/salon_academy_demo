/* The pink rule under a section head (app/styles/decor.css part 2) runs the whole length of the
   heading — Oksana 16.11.2026: M-01 «Рожеве підкреслення краще зробити на всю довжину заголовку»,
   M-04 «або під всім заголовком». CSS (Studio_Home.css) sizes the rule to the heading box
   (`width: fit-content`), which is exact for a one-line head; a wrapped head fills its column, so the
   rule would run past the text. This measures the longest line and where the text starts and hands
   both to the rule as `--head-rule-w` / `--head-rule-x` (layout px, so a reveal scale on an ancestor
   does not skew them). Re-measured when a heading changes size and when the web fonts finish
   loading. Without JS the CSS width stays. Same selector as the rule in decor.css. */

const HEADS = 'main :is(.sec_head, .sec_head_row, .svc_carousel_head) h2';

let ro: ResizeObserver | null = null;
let firstLoad = true;

function measure(h: HTMLElement) {
  const box = h.getBoundingClientRect();
  if (!box.width || !h.offsetWidth) return;
  const scale = box.width / h.offsetWidth;
  const range = document.createRange();
  const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
  let left = Infinity;
  let right = -Infinity;
  // word by word: a range over a whole text node would also count the space a line wraps at
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n.nodeValue ?? '';
    const word = /\S+/g;
    for (let m = word.exec(text); m; m = word.exec(text)) {
      range.setStart(n, m.index);
      range.setEnd(n, m.index + m[0].length);
      for (const r of Array.from(range.getClientRects())) {
        if (r.width <= 0) continue;
        if (r.left < left) left = r.left;
        if (r.right > right) right = r.right;
      }
    }
  }
  if (!(right > left)) {
    h.style.removeProperty('--head-rule-w');
    h.style.removeProperty('--head-rule-x');
    return;
  }
  // the rule is absolutely placed, so its `left` counts from the heading's padding edge
  const start =
    box.left + (parseFloat(getComputedStyle(h).borderLeftWidth) || 0) * scale;
  h.style.setProperty(
    '--head-rule-w',
    `${Math.round((right - left) / scale)}px`,
  );
  h.style.setProperty(
    '--head-rule-x',
    `${Math.max(0, Math.round((left - start) / scale))}px`,
  );
}

function watch() {
  ro?.disconnect();
  ro = null;
  const heads = Array.from(document.querySelectorAll<HTMLElement>(HEADS));
  if (!heads.length) return;
  if (typeof ResizeObserver === 'undefined') {
    heads.forEach(measure);
    return;
  }
  // the first callback comes right after observe(), so this also takes the first measure
  ro = new ResizeObserver((entries) => {
    for (const e of entries) measure(e.target as HTMLElement);
  });
  heads.forEach((h) => ro?.observe(h));
}

const remeasure = () => {
  document.querySelectorAll<HTMLElement>(HEADS).forEach((h) => measure(h));
};

/**
 * Starts the measuring on the current page; returns the cleanup. The first page load waits for
 * `load` and an idle slot (the streamed parts of a server page hydrate after the layout, and an
 * attribute written before that breaks hydration — the FxKit rule); a client navigation — next frame.
 */
export function startHeadRules(): () => void {
  let cancelled = false;
  let frame = 0;
  const run = () => {
    if (cancelled) return;
    firstLoad = false;
    watch();
  };
  const idle = () => {
    if (typeof window.requestIdleCallback === 'function')
      window.requestIdleCallback(run, { timeout: 1200 });
    else setTimeout(run, 200);
  };
  if (!firstLoad) frame = requestAnimationFrame(run);
  else if (document.readyState === 'complete') idle();
  else window.addEventListener('load', idle, { once: true });

  const fonts = document.fonts;
  const onFonts = () => {
    if (!cancelled && !firstLoad) remeasure();
  };
  fonts?.addEventListener?.('loadingdone', onFonts);
  fonts?.ready.then(onFonts).catch(() => {});

  return () => {
    cancelled = true;
    cancelAnimationFrame(frame);
    window.removeEventListener('load', idle);
    fonts?.removeEventListener?.('loadingdone', onFonts);
    ro?.disconnect();
    ro = null;
  };
}
