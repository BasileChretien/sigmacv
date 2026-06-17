/**
 * No-flash theme bootstrap.
 *
 * `THEME_INIT_SCRIPT` runs inline before first paint (injected as the first child
 * of <body> in the root layout). It resolves the user's stored choice
 * ("light" | "dark" | "system"/unset) — falling back to the OS preference — and
 * sets `data-theme` on <html> so the right palette paints immediately, with no
 * flash of the wrong theme. It also keeps "system" in sync when the OS flips.
 *
 * It additionally corrects `<html lang>` from the URL's locale slug (`/fr`, `/de`,
 * …). The localized routes are statically generated and share the single root
 * layout, so the SSR'd `<html lang>` is fixed at "en"; reading the locale in the
 * root layout would force every page dynamic. Each localized page already
 * declares its language on the element wrapping its content (the primary cue for
 * assistive tech); this brings the page-level `<html lang>` in line for sighted-
 * AT parity and JS-rendering crawlers, with a no-JS fallback of "en" + the
 * wrapper lang (WCAG 3.1.1). The slug equals the BCP-47 language subtag (en, fr,
 * de, …), so no map is needed.
 *
 * The app's strict CSP uses `strict-dynamic`, which ignores `'self'` and only
 * runs nonce'd or HASH'd scripts. Reading the per-request nonce in the *root*
 * layout would force every (statically generated) marketing page to render
 * dynamically — so instead this script is STATIC and allow-listed by its sha256
 * hash (added to `script-src` in `proxy.ts`). `tests/theme-init.test.ts` recomputes
 * the hash from the script and fails if they drift.
 *
 * Resilience: the CSS keeps a `@media (prefers-color-scheme: dark)` fallback for
 * `:root:not([data-theme])`, so if this script is ever blocked (or JS is off),
 * dark mode still follows the OS — only the manual override stops working.
 */

export const THEME_STORAGE_KEY = "sigmacv:theme";

export type ThemeChoice = "light" | "dark" | "system";

/** Exact bytes are hashed for the CSP — do not reformat without updating the hash. */
export const THEME_INIT_SCRIPT =
  '(function(){var k="sigmacv:theme";function a(){try{var c=localStorage.getItem(k),d=matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.setAttribute("data-theme",c==="dark"||c==="light"?c:d?"dark":"light")}catch(e){}}a();try{matchMedia("(prefers-color-scheme: dark)").addEventListener("change",a)}catch(e){}try{var p=location.pathname.split("/")[1];if(/^(zh|es|fr|de|ja|pt|it|ko|ru)$/.test(p))document.documentElement.lang=p}catch(e){}})();';

/** Base64 sha256 of THEME_INIT_SCRIPT (UTF-8). Mirrored into the CSP script-src. */
export const THEME_INIT_SHA256 = "YAVtXrjOM4XoRKTtKnR/IbnNX+78FniT5aPYZItthxs=";
