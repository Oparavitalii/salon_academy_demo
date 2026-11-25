/**
 * Page theme (4.2_Architecture § Theme scopes, NFR-06): a static property of the route.
 * Set as `data-theme` on `<main>`, `<header>`, `<footer>` and a section that overrides it (only on `/`).
 * Tokens for both values live in app/styles/tokens.css; there is no toggle and no stored preference.
 */
export type Theme = 'dark' | 'light';
