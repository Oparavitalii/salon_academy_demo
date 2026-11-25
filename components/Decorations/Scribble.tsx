/**
 * `.dec_scribble` — retired 28.10.2026: the pink hand swash under one word looked like an accidental
 * mark (Nataliia, Dana — Telegram 28.10 18:56). The heading now renders as plain text; the
 * component stays so the callers (salon hero, contacts) keep their copy wiring.
 */
export function Scribble({ text }: { text: string; word?: string }) {
  return <>{text}</>;
}
