/**
 * The inline Plausible v3 init stub rendered by the root layout.
 *
 * It is the snippet the Plausible dashboard hands out (a queue for
 * `window.plausible(...)` calls made before the async script loads, and an
 * `init` that stores the options for the real script to pick up) PLUS one
 * option: a `transformRequest` that, before the request leaves the browser,
 *  - rewrites `/preview/<ORCID>` to `/preview/_`, drops the query string from
 *    `/search?q=<name>` (in any case; the cut runs from the `?` of the first
 *    `/search?` it finds, wherever that stands, a parameter's value included,
 *    to the next `#`), and drops the `who` parameter from the query string of
 *    any page, in the payload's URL (`u`) and referrer (`r`);
 *  - replaces an ORCID iD, wherever else it stands in those two, with `_`: four
 *    groups of four, the last digit possibly an X, joined by a hyphen, by
 *    nothing, or by a percent-encoded hyphen, dash, minus sign or space;
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
 * `who` is that same name or iD once more: it is the see-it-first box's field,
 * and a box submitted before its script has run reloads its own page as
 * `…?who=<what was typed>` (the same URL sits in browser histories from the
 * months that box had no script on the guides). Only that parameter goes, since
 * Plausible reads `utm_*`, `ref` and `source` off the same query string.
 * The rule on the iD's shape is for the addresses the first rule does not know:
 * a 404 is a pageview like any other, and a mistyped address can hold an iD
 * (`/Preview/0000-…`, `/cv/0000-…`, `/0000-…`), as can the referrer when the
 * visitor comes from a page named after one. It goes by shape alone, with no
 * checksum, so it also cuts any sixteen digits in a row and any four groups of
 * four (`2024-2025-2026-2027`): cutting too much costs a path in a report,
 * cutting too little stores a person. What is cut is the whole RUN the iD
 * stands in (`ru`: digits, joined by the separators an iD can have, and an X
 * or x that ends it, which is the check character when it is an iD's), not the
 * sixteen digits alone. Cutting sixteen out of a longer run leaves the rest to
 * be read, and which sixteen depends on where the search starts: digits glued
 * to the front of an iD took the match and left the iD, and so did groups
 * joined to it in front or behind. One thing may stay: the end of a
 * percent-escape begun just before the run (`/x%20<iD>` keeps its `%20`), and
 * only when the iD starts after it. Every iD starts with `00`, so reading
 * `%00` in `%<iD>` would let the whole iD through; where the digits after a
 * `%` could be either, the iD wins and the escape goes. It is not a guarantee.
 * An iD spelled another way (spaces typed as `_`, say) passes, and so does a
 * name written in a path: `/search/Jane%20Doe` is a 404, and a 404 is sent
 * with its path as typed. A rule for that one address was tried and taken out
 * again: it cut `/search/` wherever it stood, a parameter's value included,
 * and took the campaign parameters behind it. The rule that stays (`rs`) does
 * the same with `/search?`: it is not tied to the lookup's own address. It
 * cuts from the `?` of the first `/search?` it finds, wherever that stands, a
 * parameter's value included, to the next `#`:
 * `/about?next=/search?&utm_source=nl&utm_campaign=x` is sent as
 * `/about?next=/search`, without its campaign parameters. That cost is kept
 * for what the same reach does: a lookup address that another address carries
 * unencoded (`?callbackUrl=/search?q=<name>`) loses the name too. The
 * `/preview/` rule (`re`) is not tied to the path either: in a value it takes
 * everything up to the next `/`, `?` or `#`, the parameters behind it
 * included, so `/about?next=/preview/abc&utm_source=nl` is sent as
 * `/about?next=/preview/_`.
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
  "var re=/[/]preview[/][^/?#]+/,rs=/([/]search)[?][^#]*/i," +
  'g="[0-9]{4}",d="(?:-|[+]|%2D|%20|%E2%80%9[0-5]|%E2%88%92)",' +
  'sh=new RegExp(g+d+"?"+g+d+"?"+g+d+"?[0-9]{3}[0-9X]","i"),' +
  'ru=new RegExp("[0-9]+(?:"+d+"[0-9]+)*X?","gi"),' +
  "ou=/^([a-z][a-z0-9+.-]*:[/][/])(?:[^/?#@]*@)?([^/?#]*).*$/i;" +
  // `who` goes from the query string alone (after the first `?`, up to the `#`):
  // in a path, `/about&who=x` is another address, and cutting it would file a
  // view of /about. The query is taken apart on `&`, its only separator (a later
  // `?` is part of a value), the `who=` parameters are left out and the rest is
  // put back as it was. Nothing to leave out: the URL is returned untouched.
  // The iD rule comes last: an iD typed into the box has gone with `who` by
  // then, and one left anywhere else is still cut. `c` is handed each run of
  // digits (`m`), where it starts (`f`) and the whole address (`z`): a run with
  // no iD in it is put back; of one that has, only the end of a percent-escape
  // begun just before the run may stay (`l` characters), and only when the iD
  // starts after it.
  'function c(m,f,z){var n=m.search(sh),l=z.charAt(f-1)==="%"?2:z.charAt(f-2)==="%"?1:0;' +
  'return n<0?m:(n<l?"":m.slice(0,l))+"_"}' +
  'function s(v){return v.replace(re,"/preview/_").replace(rs,"$1")' +
  '.replace(/^([^?#]*)[?]([^#]*)/,function(m,a,q){var k=q.split("&"),o=[],i,j;' +
  'for(i=0;i<k.length;i++)if(k[i].indexOf("who=")!==0)o.push(k[i]);' +
  'j=o.join("&");return o.length===k.length?m:a+(j?"?"+j:"")})' +
  ".replace(ru,c)}" +
  'if(p&&typeof p.u==="string")p.u=s(p.u);' +
  'if(p&&typeof p.r==="string")p.r=s(p.r);' +
  'if(p&&p.p&&typeof p.p.url==="string")p.p.url=p.p.url.replace(ou,"$1$2");' +
  "return p}})";
