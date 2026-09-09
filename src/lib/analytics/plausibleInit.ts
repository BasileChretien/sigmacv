/**
 * The inline Plausible v3 init stub rendered by the root layout.
 *
 * It is the snippet the Plausible dashboard hands out (a queue for
 * `window.plausible(...)` calls made before the async script loads, and an
 * `init` that stores the options for the real script to pick up) PLUS one
 * option: a `transformRequest` that rewrites `/preview/<ORCID>` to `/preview/_`
 * in the pageview payload's URL (`u`) and referrer (`r`) before the request
 * leaves the browser.
 *
 * Why: Plausible stores the pathname of every pageview. The no-login preview is
 * keyed by the looked-up researcher's ORCID iD, so without this the analytics
 * store would be a persistent list of every non-user anyone looked up — which
 * the privacy notice says we do not keep. The scrub runs client-side so the iD
 * never reaches the analytics origin at all.
 *
 * Kept as a plain string (not a function) because it must be inlined verbatim
 * into a <script> tag; `tests/plausible-init.test.ts` executes it in a sandbox
 * and asserts the rewrite. No backslashes: the string is dropped into a JSX
 * template literal, and a character class is used in place of `\/`.
 */
export const PLAUSIBLE_INIT_SCRIPT =
  "window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)}," +
  "plausible.init=plausible.init||function(i){plausible.o=i||{}};" +
  "plausible.init({transformRequest:function(p){" +
  "var re=/[/]preview[/][^/?#]+/;" +
  'if(p&&typeof p.u==="string")p.u=p.u.replace(re,"/preview/_");' +
  'if(p&&typeof p.r==="string")p.r=p.r.replace(re,"/preview/_");' +
  "return p}})";
