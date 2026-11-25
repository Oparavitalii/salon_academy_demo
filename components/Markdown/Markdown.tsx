import type { ReactNode } from 'react';

/**
 * Tiny in-repo markdown → React converter for the legal pages (no dependency, no
 * dangerouslySetInnerHTML). Supports exactly what `content/legal/*.md` uses:
 * `##`/`###`/`####` headings, paragraphs (single newlines kept as line breaks), `- ` and `1. `
 * lists, `---`, **bold**, _italic_, `code`, [links](url).
 *
 * The Phase-10 markers `[[BRAK: …]]` / `[[DO POTWIERDZENIA: …]]` are gaps for the lawyer, kept in
 * the document and counted by `scripts/check-legal-markers.mjs` — never shown on the page
 * (Release floor F3, B-81, 10.0_Legal.md → «Маркери на сторінці»). `hideMarkers()` drops every
 * element that is only a marker or loses its sense without it, and cuts the rest; a marker that
 * still reached `inline()` renders nothing.
 */

export type MdHeading = { id: string; level: number; text: string };

type Block =
  | { kind: 'h'; level: number; text: string; id: string }
  | { kind: 'p'; lines: string[] }
  | { kind: 'ul' | 'ol'; items: string[] }
  | { kind: 'hr' };

const MARKER = /\[\[[\s\S]*?\]\]/g;

/** Split a policy file into its title (`# …`) and the body below the editorial header. */
export function splitDocument(md: string): { title: string; body: string } {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  let i = 0;
  let title = '';
  while (i < lines.length && lines[i].trim() === '') i++;
  if (lines[i]?.startsWith('# ')) {
    title = lines[i].slice(2).trim();
    i++;
  }
  // Skip the editorial blockquote («ПРОЄКТ…», sources, marker legend) — Phase 9 handoff.
  while (
    i < lines.length &&
    (lines[i].trim() === '' || lines[i].startsWith('>'))
  )
    i++;
  return { title, body: lines.slice(i).join('\n') };
}

/** Plain text of a heading line, without markdown punctuation. */
const plain = (s: string) =>
  s
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim();

function headingId(text: string, n: number): string {
  const m = text.match(/^(\d+(?:\.\d+)*)[).]?\s/);
  return m ? `section-${m[1].replace(/\./g, '-')}` : `part-${n}`;
}

export function parseBlocks(body: string): Block[] {
  const lines = body.split('\n');
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { kind: 'ul' | 'ol'; items: string[] } | null = null;
  let hCount = 0;

  const flush = () => {
    if (para.length) blocks.push({ kind: 'p', lines: para });
    if (list) blocks.push(list);
    para = [];
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = line.match(/^(#{2,4})\s+(.*)$/);
    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);

    if (line.trim() === '') {
      flush();
    } else if (/^-{3,}$/.test(line.trim())) {
      flush();
      blocks.push({ kind: 'hr' });
    } else if (h) {
      flush();
      hCount++;
      const text = h[2].trim();
      blocks.push({
        kind: 'h',
        level: h[1].length,
        text,
        id: headingId(plain(text), hCount),
      });
    } else if (ul || ol) {
      const kind = ul ? 'ul' : 'ol';
      if (para.length) {
        blocks.push({ kind: 'p', lines: para });
        para = [];
      }
      if (!list || list.kind !== kind) {
        if (list) blocks.push(list);
        list = { kind, items: [] };
      }
      list.items.push((ul ?? ol)![1]);
    } else if (list && /^\s{2,}\S/.test(raw)) {
      // continuation of the previous list item
      list.items[list.items.length - 1] += ` ${line.trim()}`;
    } else {
      if (list) {
        blocks.push(list);
        list = null;
      }
      para.push(line);
    }
  }
  flush();
  return blocks;
}

/** Headings of a given level — the table of contents. */
export function headingsOf(body: string, level = 2): MdHeading[] {
  return parseBlocks(body)
    .filter((b): b is Extract<Block, { kind: 'h' }> => b.kind === 'h')
    .filter((b) => b.level === level)
    .map((b) => ({ id: b.id, level: b.level, text: plain(b.text) }));
}

export function countMarkers(text: string): number {
  return (text.match(MARKER) ?? []).length;
}

/**
 * B-81 — the hide list of `10_Legal/10.0_Legal.md` → «Передача → Фаза 11» → «Маркери на сторінці»,
 * as rules over the source lines (the same for the UK and the PL file):
 * 1. a line that holds a `[[BRAK…]]` (the missing fact IS the value: version date, history entry,
 *    §1 e-mail, §5 online-course tool) → the whole line goes — unless the BRAK closes a clause
 *    the sentence continues after (`]].` / `]];` + text: §2.1 Q-42, §7 Q-45) → rule 4;
 * 2. a line that is only a marker (§2.10) → goes; a heading left with an empty section goes too,
 *    and with it its table-of-contents entry (the TOC is built from the same output);
 * 3. the §10 Bunny player row (`Bunny Stream` + marker) → goes (the banner hides the same row);
 * 4. any other marker sits at the end of a phrase → cut together with the space before it;
 * 5. a bold label paragraph ending in «:» left with no list under it («Історія версій:») → goes.
 */
export function hideMarkers(body: string): string {
  const src = body.replace(/\r\n?/g, '\n').split('\n');
  const kept: string[] = [];
  for (const line of src) {
    if (!line.includes('[[')) {
      kept.push(line);
      continue;
    }
    // A BRAK that closes a clause inside a longer sentence (`]].` / `]];` + more text — §2.1
    // Direct payment Q-42, §7 remarketing audiences Q-45, run 2) is not the value of the line:
    // it is cut by rule 4 and the sentence stays true — the handoff's default «вирізати маркер».
    if (/\[\[BRAK\b/.test(line) && !/\[\[BRAK\b[^\]]*\]\][.;]\s+\S/.test(line))
      continue;
    if (line.replace(MARKER, '').trim() === '') continue;
    if (/Bunny Stream/.test(line) && /^\s*[-*]\s/.test(line)) continue;
    kept.push(line.replace(/\s*\[\[[\s\S]*?\]\]/g, ''));
  }
  // drop headings whose section is empty, and bold «…:» labels with nothing under them
  const isBlank = (l: string | undefined) => l === undefined || l.trim() === '';
  const isBreak = (l: string | undefined) =>
    l === undefined || /^#{2,4}\s/.test(l) || /^-{3,}$/.test(l.trim());
  const nextContent = (i: number) => {
    let j = i + 1;
    while (j < kept.length && isBlank(kept[j])) j++;
    return kept[j];
  };
  const out: string[] = [];
  kept.forEach((l, i) => {
    const level = l.match(/^(#{2,4})\s/)?.[1].length;
    if (level) {
      const nx = nextContent(i);
      const nxLevel = nx?.match(/^(#{2,4})\s/)?.[1].length;
      if (nx === undefined || /^-{3,}$/.test(nx.trim())) return;
      if (nxLevel !== undefined && nxLevel <= level) return;
    }
    if (/^\*\*[^*]+:\*\*\s*$/.test(l.trim()) && isBreak(nextContent(i))) return;
    out.push(l);
  });
  return out.join('\n');
}

// ---- inline ----------------------------------------------------------------

const INLINE =
  /(\[\[[\s\S]*?\]\])|(`[^`]+`)|(\*\*[\s\S]+?\*\*)|((?<![\p{L}\p{N}_])_[^_\n]+?_(?![\p{L}\p{N}_]))|(\[[^\]]+\]\([^)\s]+\))/gu;

/** Text of a code span without its markers — a marker renders nothing (F3; hideMarkers() ran first). */
function markersOnly(text: string): string {
  return text.replace(MARKER, '');
}

export function inline(text: string, key = 'i'): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let n = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}-${n++}`;
    const [all, marker, code, bold, italic, link] = m;
    if (marker) {
      // nothing: a marker is never visible (F3, B-81)
    } else if (code) {
      out.push(<code key={k}>{markersOnly(code.slice(1, -1))}</code>);
    } else if (bold) {
      out.push(<strong key={k}>{inline(bold.slice(2, -2), k)}</strong>);
    } else if (italic) {
      out.push(<em key={k}>{inline(italic.slice(1, -1), k)}</em>);
    } else if (link) {
      const lm = link.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/)!;
      const external = /^https?:\/\//.test(lm[2]);
      out.push(
        <a
          key={k}
          href={lm[2]}
          className='hv-link'
          {...(external ? { target: '_blank', rel: 'noopener' } : {})}
        >
          {inline(lm[1], k)}
        </a>,
      );
    } else {
      out.push(all);
    }
    last = m.index + all.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

// ---- component ---------------------------------------------------------------

type Props = { body: string; className?: string; lang?: string };

export function Markdown({ body, className, lang }: Props) {
  const blocks = parseBlocks(body);
  return (
    <div className={className} lang={lang}>
      {blocks.map((b, i) => {
        const k = `b${i}`;
        switch (b.kind) {
          case 'h': {
            const Tag = `h${b.level}` as 'h2' | 'h3' | 'h4';
            return (
              <Tag key={k} id={b.id}>
                {inline(b.text, k)}
              </Tag>
            );
          }
          case 'hr':
            return <hr key={k} />;
          case 'ul':
          case 'ol': {
            const Tag = b.kind;
            return (
              <Tag key={k}>
                {b.items.map((it, j) => (
                  <li key={`${k}-${j}`}>{inline(it, `${k}-${j}`)}</li>
                ))}
              </Tag>
            );
          }
          case 'p':
            return (
              <p key={k}>
                {b.lines.flatMap((ln, j) =>
                  j === 0
                    ? inline(ln, `${k}-${j}`)
                    : [<br key={`${k}-br${j}`} />, ...inline(ln, `${k}-${j}`)],
                )}
              </p>
            );
        }
      })}
    </div>
  );
}
