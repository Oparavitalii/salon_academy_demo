import { Pic } from '../Pic/Pic';

type Props = {
  src: string;
  alt: string;
  sizes: string;
  /** Tilt side — alternate `l` / `r` in a grid (8.0 §6). */
  tilt?: 'l' | 'r';
  tape?: boolean;
  small?: boolean;
  caption?: string;
  /** Hero cluster: the polaroid «lands» inside the first-screen load sequence (8.0 Motion map). */
  settle?: boolean;
  settleDelay?: number;
  priority?: boolean;
  className?: string;
};

/**
 * `.dec_polaroid` — A · Папір (8.0 §0): a real photo of the studio in a mat with a thin accent frame,
 * tilted −3° / +2.5°, optional pink tape. Content, not a layer — AutoReveal animates the figure and
 * the signature «поляроїд лягає» runs on `[data-rv="in"]` / `.dec_settle` (Decorations.css §7).
 */
export function Polaroid({
  src,
  alt,
  sizes,
  tilt = 'l',
  tape,
  small,
  caption,
  settle,
  settleDelay,
  priority,
  className,
}: Props) {
  const cls = [
    'dec_polaroid',
    `dec_polaroid_${tilt}`,
    tape && 'dec_polaroid_tape',
    small && 'dec_polaroid_sm',
    settle && 'dec_settle',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <figure
      className={cls}
      style={
        settle && settleDelay !== undefined
          ? ({
              '--dec-settle-delay': `${settleDelay}ms`,
            } as React.CSSProperties)
          : undefined
      }
    >
      <Pic src={src} alt={alt} sizes={sizes} priority={priority} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
