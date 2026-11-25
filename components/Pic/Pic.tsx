import Image from 'next/image';

import { img } from '@/lib/content/images';

/**
 * Served as the static file, not through `/_next/image`: on production the optimizer request
 * `Dohliad_02.webp · w=640 · image/webp` never answers (28.10.2026 — reproduced after two deploys and a
 * re-encode; every other size / format and every other photo answer in < 1 s), which kept
 * `/courses/hair-reconstruction` from finishing its `load`. The file is 60 KB, so nothing is lost.
 */
/**
 * 30.10.2026: the stall is not one file — every `Dohliad_*` photo hangs in the optimizer from time to
 * time (Dohliad_01/03/04/05 at w=256–640), which kept `/courses/reconstruction-intensive` (390) and
 * `/variant_video` (Safari) from firing `load`. The whole set is served as static files (60–100 KB).
 */
const isStatic = (src: string) => src.startsWith('Salon_Works/Dohliad_');

type Props = {
  /** `<Set>/<Name>.webp` as 9_Text.md cites it (registry `lib/content/images.ts`). */
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  /** The hero / LCP photo of the page: preloaded, eager, `fetchpriority="high"` (D-05). */
  priority?: boolean;
};

/**
 * One content photo through `next/image`, sized from the registry (Release floor F5).
 * D-05 (fix round 22.10): Next 16 deprecates `priority` — it no longer adds `fetchpriority`, so the
 * LCP photo was fetched at Low priority behind the font preloads. A priority photo now uses
 * `preload` (the `<link rel=preload>` + no lazy loading) and `fetchPriority="high"` on both.
 */
export function Pic({ src, alt, sizes, className, priority }: Props) {
  const a = img(src);
  return (
    <Image
      src={a.src}
      width={a.width}
      height={a.height}
      alt={alt}
      sizes={sizes}
      className={className}
      preload={priority || undefined}
      fetchPriority={priority ? 'high' : undefined}
      unoptimized={isStatic(src) || undefined}
    />
  );
}
