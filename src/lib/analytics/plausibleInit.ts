/**
 * The inline Plausible v3 init stub rendered by the root layout.
 *
 * It is the snippet the Plausible dashboard hands out (a queue for
 * `window.plausible(...)` calls made before the async script loads, and an
 * `init` that stores the options for the real script to pick up) PLUS one
 * option: a `transformRequest` that, before the request leaves the browser,
 *  - rewrites `/preview/<ORCID>` to `/preview/_` and drops the query string from
 *    `/search?q=<name>` in the payload's URL (`u`) and referrer (`r`);
 *  - keeps only the origin of a URL an event carries (`p.url` — the clicked link
 *    of an outbound-link event): `https://doi.org/10.1234/x` becomes
 *    `https://doi.org`, user info dropped.
 *
 * Why: Plausible stores the pathname of every pageview. The no-login preview is
 * keyed by the looked-up researcher's ORCID iD, so without this the analytics
 * store would be a persistent list of every non-user anyone looked up — which
 * the privacy notice says we do not keep. The scrub runs client-side so the iD
 * never reaches the analytics origin at all. The name lookup's query is the same
 * kind of thing: Plausible discards query strings before storing, but the typed
 * name would still cross the wire to the collector, so it is cut here too.
 * Outbound-link tracking is switched on in the site's Plausible configuration
 * (read off the live `pa-*.js` on 2026-09-15), and its event carries the clicked
 * URL: a click on the owner worklist's ShareYourPaper link, or on any DOI, ORCID
 * or OpenAlex link in the editor's own chrome, would send an identifier with it.
 * A rule on the origin alone cannot miss a future kind of link, and clicks still
 * count by destination.
 *
 * Kept as a plain string (not a function) because it must be inlined verbatim
 * into a <script> tag; `tests/plausible-init.test.ts` executes it in a sandbox
 * and asserts the rewrite. No backslashes: the string is dropped into a JSX
 * template literal, and a character class is used in place of `\/` and `\.`.
 */
export const PLAUSIBLE_INIT_SCRIPT =
  "window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)}," +
  "plausible.init=plausible.init||function(i){plausible.o=i||{}};" +
  "plausible.init({transformRequest:function(p){" +
  "var re=/[/]preview[/][^/?#]+/,rs=/([/]search)[?][^#]*/," +
  "ou=/^([a-z][a-z0-9+.-]*:[/][/])(?:[^/?#@]*@)?([^/?#]*).*$/i;" +
  'if(p&&typeof p.u==="string")p.u=p.u.replace(re,"/preview/_").replace(rs,"$1");' +
  'if(p&&typeof p.r==="string")p.r=p.r.replace(re,"/preview/_").replace(rs,"$1");' +
  'if(p&&p.p&&typeof p.p.url==="string")p.p.url=p.p.url.replace(ou,"$1$2");' +
  "return p}})";
