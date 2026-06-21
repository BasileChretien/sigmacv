/**
 * The ONE trusted inline script allowed on public CV pages, and the CSP plumbing
 * that permits it — by exact SHA-256 hash, nothing else.
 *
 * Public pages are otherwise strictly no-JS (`default-src 'none'`, no `script-src`).
 * The Hanko style needs a one-shot, play-on-enter wave animation, which a pure-CSS
 * scroll timeline can't express (it scrubs with scroll instead of playing once). So
 * we allow a single, fixed, audited script — a bare IntersectionObserver that adds a
 * `hk-play` class to each wave the first time it enters the viewport, then stops
 * observing it. No eval, no network, no user data, no external src.
 *
 * The relaxation is hash-pinned: `script-src 'sha256-<hash of exactly this script>'`.
 * Any *other* inline script (e.g. an injection attempt) has a different hash and is
 * still blocked. `publicScriptSrc()` only emits the directive when the trusted script
 * is actually present in the document, so script-free styles stay fully locked down.
 *
 * `tests/public-scripts.test.ts` recomputes the hash and fails if the script drifts
 * from `HK_WAVE_SCRIPT_SHA256` — keep them in sync (update the constant, never fork).
 */

/** Exact bytes of the trusted script (must match `HK_WAVE_SCRIPT_SHA256`). */
export const HK_WAVE_SCRIPT =
  'var n=document.querySelectorAll(".hk-wave");if(n.length&&"IntersectionObserver" in window){var o=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("hk-play");o.unobserve(e.target);}});},{threshold:0,rootMargin:"0px 0px -12% 0px"});n.forEach(function(el){o.observe(el);});}';

/** base64 SHA-256 of `HK_WAVE_SCRIPT` (verified by test). */
export const HK_WAVE_SCRIPT_SHA256 = "eYi0gKikMiVV/rnbWjQjmzWeSiUHUVlU8MYG/RcjUfA=";

/** The `<script>` element to drop into a page body (Hanko only). */
export const HK_WAVE_SCRIPT_TAG = `<script>${HK_WAVE_SCRIPT}</script>`;

/**
 * The `script-src` directive to add to a page's CSP — but only when that page
 * actually contains the trusted script. Returns "" otherwise, so pages with no
 * script keep an empty/blocked script policy. Leading space so it slots straight
 * into the existing policy string after `font-src data:;`.
 */
export function publicScriptSrc(content: string): string {
  return content.includes(HK_WAVE_SCRIPT) ? ` script-src 'sha256-${HK_WAVE_SCRIPT_SHA256}';` : "";
}
