/**
 * `.dec_tape` — B · Стрічка (8.0 §0): the tilted pink band with running words in caps. The words
 * repeat copy already on the page (service groups on /salon, course benefits on /courses), so the
 * whole strip is `aria-hidden`. The list is written twice for a seamless loop; hover pauses it,
 * Decorations.js pauses it off screen, reduced motion stops it (Decorations.css §4, §7).
 */
export function Tape({ words }: { words: string[] }) {
  const items = [...words, ...words];
  return (
    <div className='dec_tape' aria-hidden='true'>
      <div className='dec_tape_band'>
        <div className='dec_tape_track'>
          {items.map((w, i) => (
            <span key={`${w}-${i}`}>{w}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
