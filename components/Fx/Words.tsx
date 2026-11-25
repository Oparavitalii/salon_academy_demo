import { Fragment } from 'react';

/**
 * Words — the text of a heading split into `.word` spans on the server, for the words reveal
 * (`[data-fx="words"]`, FxKit + fx_kit.css; Web_Animation «reveal/words» from the owner's UI-kit pick
 * 31.10.2026). Splitting on the server keeps React's DOM untouched in the browser. Each word carries
 * its index in `--w` (the stagger). Use inside an element that has `data-fx='words'`.
 */
export function Words({ text }: { text: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <>
      {words.map((w, i) => (
        <Fragment key={`${w}-${i}`}>
          {i > 0 && ' '}
          <span className='word' style={{ '--w': i } as React.CSSProperties}>
            {w}
          </span>
        </Fragment>
      ))}
    </>
  );
}
