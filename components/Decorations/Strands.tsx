import { useId } from 'react';

/*
 * Unused since 16.11.2026 — client: hair decoration removed (Dana about the dividers: «их нужно
 * прямые попробовать сделать (или чем то заменить)»; then the owner: the client wants the hair
 * decoration gone altogether). No page renders
 * `Strands`, `StrandDivider` or `StrandCorner` any more (the pages, HeroHome); the file and its CSS
 * (decorations.css §6, decor.css §1) stay for a quick revert — re-import and drop a <StrandDivider />.
 */

/** The five logo strands (8.0 §2, path data from `docs/8_Effects/Demo.html`). */
const PATHS = [
  'M1190,160 C1030,166 950,96 812,100 C676,104 598,164 466,146 C334,128 250,58 150,62 C96,64 62,46 44,18',
  'M1180,132 C1050,126 980,58 860,60 C742,62 676,122 560,112 C444,102 380,36 286,34 C222,33 186,20 168,4',
  'M1194,182 C1064,190 994,136 884,140 C774,144 712,188 600,176 C488,164 420,104 330,110 C268,114 236,98 222,74',
  'M1170,110 C1080,96 1030,40 950,34 C880,29 840,58 790,50 C756,45 738,28 734,8',
  'M1186,192 C1110,198 1060,170 1000,172 C930,174 898,196 838,190 C800,186 782,170 776,152',
];

/**
 * `.dec_strands` — D · Лінія (8.0 §0, 22.10). Decorative: `aria-hidden`, not focusable,
 * `pointer-events: none` (Decorations.css). The gradient id is unique per instance (`useId`).
 * Used only inside a `.dec_divider` (the hero placements `_rest` / `_hero` are retired, 8.0 §6).
 * Unused since 16.11.2026 — client: hair decoration removed.
 */
export function Strands({ className }: { className?: string }) {
  const id = `dec-g${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <svg
      className={className ? `dec_strands ${className}` : 'dec_strands'}
      viewBox='0 0 1200 200'
      preserveAspectRatio='none'
      aria-hidden='true'
      focusable='false'
    >
      <defs>
        <linearGradient id={id} x1='0' y1='0' x2='1' y2='0'>
          <stop className='dec_tip' offset='0' />
          <stop className='dec_body' offset='.22' />
          <stop className='dec_body' offset='1' stopOpacity='.25' />
        </linearGradient>
      </defs>
      {PATHS.map((d) => (
        <path key={d} pathLength={1} stroke={`url(#${id})`} d={d} />
      ))}
    </svg>
  );
}

/**
 * `.dec_divider` — the strands as their own strip between two sections (8.0 §5).
 * Unused since 16.11.2026 — client: hair decoration removed (it stood on /, /about, /salon,
 * /courses, /contacts, /variant_video; the two sections now meet at the normal section spacing).
 */
export function StrandDivider() {
  return (
    <div className='dec_divider' aria-hidden='true'>
      <Strands />
    </div>
  );
}

/**
 * `.dec_corner` — the logo strands drawn in a section corner, behind the copy (owner 06.11: decor
 * option C «пасма + риска», «пасма що були минулий раз анімацією»). Same draw-once motion as the
 * divider (decEffects: `.dec_divider` → data-dec wait → done on first entry); still under reduced motion.
 * Unused since 16.11.2026 (Daryna: «ці білі елементи виглядають дивно») — kept for a quick revert.
 */
export function StrandCorner({ side = 'right' }: { side?: 'left' | 'right' }) {
  return (
    <div
      className={`dec_divider dec_corner dec_corner_${side}`}
      aria-hidden='true'
    >
      <Strands />
    </div>
  );
}
