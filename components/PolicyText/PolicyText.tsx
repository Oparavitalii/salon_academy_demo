import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import {
  loadPolicy,
  POLICY_LOCALES,
  privacyCopy as c,
} from '@/lib/content/legal';
import { t } from '@/lib/i18n/t';

import {
  headingsOf,
  hideMarkers,
  Markdown,
  splitDocument,
} from '../Markdown/Markdown';

/**
 * PolicyText → Content17 (/privacy, R-16). Wrapper copy from 9_Text.md; the document body from
 * `content/legal/` (copy of `docs/10_Legal/`), read at build time and rendered by the in-repo
 * converter. The editorial header block of the file is not shown (10.0_Legal.md → Handoff);
 * the `[[BRAK…]]` / `[[DO POTWIERDZENIA…]]` markers are never shown — `hideMarkers()` applies the hide
 * list of 10.0_Legal.md (B-81, Release floor F3); the documents keep them for the lawyer.
 * No decor next to long text (7.0 §5). /pl renders the Polish (binding) text with its own title,
 * /uk the Ukrainian text. /ru and /en have no legal translation (B-75): heading, lede and a note
 * in the page language that the policy is in force in Polish, with links to /pl and /uk
 * (Release floor F2, Decisions 22.10).
 */
export function PolicyText({ locale }: { locale: Locale }) {
  if (!POLICY_LOCALES.includes(locale))
    return <PolicyElsewhere locale={locale} />;

  const policy = loadPolicy(locale);
  const { title, body: raw } = splitDocument(policy.markdown);
  const body = hideMarkers(raw);
  const toc = headingsOf(body, 2);
  const polish = policy.lang === 'pl';
  // The PL wrapper has no 9_Text copy: H1 and eyebrow come from the document's own title line.
  const [docTitle, docOwner] = title.split(' – ');

  // Two sections (D-26): the head is the hero (first `main > section` — the CSS load sequence),
  // the TOC + prose sit in the second one so AutoReveal animates the headings and paragraphs
  // below the fold (Release floor F1). `id='policy'` stays on the body section.
  return (
    <>
      <section className='sec sec_page policy_hero'>
        <div className='wrap policy'>
          <header
            className='sec_head policy_head'
            lang={polish ? 'pl' : undefined}
          >
            <p className='eyebrow'>
              {polish ? docOwner : t(c.eyebrow, locale)}
            </p>
            <h1 className='display display_xl'>
              {polish ? docTitle : t(c.heading, locale)}
            </h1>
            {!polish && <p className='lede'>{t(c.lede, locale)}</p>}
          </header>
        </div>
      </section>
      <section className='sec sec_page policy_body' id='policy'>
        <div className='wrap policy'>
          <div className='policy_layout'>
            <nav
              className='policy_toc'
              aria-label={polish ? docTitle : t(c.toc, locale)}
            >
              {!polish && <p className='eyebrow'>{t(c.toc, locale)}</p>}
              <ol>
                {toc.map((h) => (
                  <li key={h.id}>
                    <a className='hv-link' href={`#${h.id}`}>
                      {h.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            <Markdown body={body} className='prose' />
          </div>
        </div>
      </section>
    </>
  );
}

/** /ru, /en — no body: where the policy is and in which languages. */
function PolicyElsewhere({ locale }: { locale: Locale }) {
  return (
    <section className='sec sec_page' id='policy'>
      <div className='wrap policy'>
        <header className='sec_head policy_head'>
          <p className='eyebrow'>{t(c.eyebrow, locale)}</p>
          <h1 className='display display_xl'>{t(c.heading, locale)}</h1>
          <p className='lede'>{t(c.lede, locale)}</p>
          <p>{t(c.inForce, locale)}</p>
          <p className='policy_links'>
            <Link
              className='btn hv-btn-glow'
              href='/privacy'
              locale='pl'
              hrefLang='pl'
            >
              {t(c.readPl, locale)}
            </Link>
            <Link
              className='btn btn_outline hv-btn-invert'
              href='/privacy'
              locale='uk'
              hrefLang='uk'
            >
              {t(c.readUk, locale)}
            </Link>
          </p>
        </header>
      </div>
    </section>
  );
}
