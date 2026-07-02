# Changelog

All notable changes to SigmaCV are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Instant loading screen for the no-login preview.** Clicking "Preview my CV"
  now shows a branded loading animation right away while the CV is built from
  public sources (a few seconds of ~20-source fetch + citeproc), instead of the
  page appearing to do nothing. Implemented as a route-level `loading.tsx` (an
  instant Suspense fallback on the client navigation); the submit button also
  shows a pending state and can't be double-fired into two heavy builds. Motion
  respects `prefers-reduced-motion`. Localized in all ten locales.

- **Patents you list on your ORCID record now populate the Patents section.**
  Any work you've self-asserted as a patent on your own ORCID profile is pulled
  in and **auto-included** (visible by default) — an identifier match at the
  person level (your own iD), unlike EPO patents, which are inventor-name +
  organization matches and stay hidden review candidates until you confirm them.
  When the same invention appears in both lanes (matching publication number),
  the ORCID one wins and the EPO duplicate is dropped, so a patent is never
  listed twice. ORCID rarely stores a structured patent number, so the entry
  shows the title (and year when present); hide any you don't want with the usual
  curation controls.

- **Import a `.bib` file.** Researchers who already keep a clean bibliography
  (Zotero / Mendeley / JabRef BibTeX export) can now start their CV from it: an
  "Import a .bib file" panel in the editor (beside "Add a publication by DOI")
  uploads the file, parses it (BibTeX → CSL-JSON via `astrocite-bibtex`), and
  merges the new works into Publications / Preprints — **deduped by DOI/id** so
  works already pulled from OpenAlex aren't doubled, and reporting how many were
  added / already present / skipped. Ownership is **user-asserted** (like a DOI
  claim), never name-matched — no author name is highlighted, preserving the
  identifier-only highlighting rule. Malformed entries are tolerated (a single bad
  entry doesn't sink the file). Localized in all ten locales.

- **ORCID trust disclosure on the sign-in card.** The one-line "we only read your
  public record" note now expands into a **"What we access — and what we never do"**
  panel spelling out the verifiable facts: read-only access via the minimal
  `openid` scope, **never writes anything back to ORCID**, no password reaches us,
  the sign-in token is discarded after login (never stored), and the project is
  open-source (Apache-2.0) and not-for-profit with export/delete anytime — linking
  to the privacy notice. The same read-only trust line now also appears under the
  sign-in CTA on the SEO landing pages. Localized in all ten locales.

- **No-login interactive preview.** Paste an ORCID iD on the home sign-in card
  (or the ORCID-to-CV page) and land in the **real editor** at `/preview/<iD>` —
  no account, no OAuth — seeded with a CV built from public data. Everything
  visual works anonymously: **curate** (reorder, remove "not mine", show/hide and
  rename sections), **restyle** (template, citation style, metrics, highlight,
  page format), with a **live preview** that re-renders as you edit and a
  Document / Public-page toggle. Only **saving, publishing and exporting** are
  account-gated — a single "Sign in with ORCID" call to action. Lowers the
  try-before-you-trust barrier: you can actually use SigmaCV before granting any
  access. The session is **ephemeral and never indexed** (built on demand, cached
  briefly in memory, `noindex` + robots-disallowed, nothing persisted), runs the
  same public projection the living page uses (so no consent-gated field can
  appear), and every render is same-origin-only + rate-limited per-IP. Friendly
  states for a malformed iD or an ORCID with no public record; if a live re-render
  is rate-limited or fails, an inline notice explains why and the last good preview
  stays put, rather than freezing silently. The build engine is
  shared with the authenticated sync (a new session-less `buildCvFromOrcid`) and
  the preview/thumbnail renders are shared with the signed-in editor, so the two
  never drift. Localized in all ten locales.

- **IndexNow pings for newly-published public pages.** When a CV is published
  with search indexing enabled, the app now notifies IndexNow (Bing, Yandex,
  Seznam, …) so those engines crawl the `/p/<slug>` page promptly instead of
  waiting to rediscover it via the sitemap. Best-effort and fail-soft (never
  blocks or breaks publishing) and production-only. Google ignores IndexNow, so
  this complements — doesn't replace — the sitemap. Domain ownership is proven by
  a public key file at the site root.

- **Zero-downtime redeploys.** Deploying an update used to take the site down for
  the whole build+swap, so anyone visiting mid-deploy got a 502 / "server
  connection error". Now: a new `/api/health` liveness endpoint, a Docker
  `healthcheck` on the app service, and a health-checked Caddy reverse proxy
  (`health_uri /api/health` + `lb_try_duration`) that holds and retries requests
  during a container swap instead of erroring. A new `scripts/deploy.sh` builds
  the new image while the old container keeps serving, then does a fast recreate —
  so `git pull && ./scripts/deploy.sh` ships an update with no visitor-facing
  errors. Use it instead of `docker compose up -d --build`.

- **"Add to my email signature"** for the Living-CV badge (Share menu). One click
  copies the **same linked badge** as the "Copy HTML" snippet, but as **rich
  `text/html`** (via the async Clipboard API) so pasting into Outlook, Gmail or any
  signature editor inserts a **rendered, clickable badge** — not the raw markup the
  plain-text snippets produce. Includes short Outlook paste steps, ending with the
  reliable, version-agnostic fix for the pasted image not being clickable in
  classic Outlook: re-attach the link with **Ctrl+K** (works even with Microsoft
  365 cloud/roaming signatures). Localized in all ten locales.

### Changed

- **Patents are de-duplicated by patent family, so one invention isn't listed
  once per country.** The same invention filed in several jurisdictions
  (e.g. US + EP + WIPO/PCT + JP) is published by EPO OPS as separate documents;
  the Patents section now collapses those equivalents into a **single entry**
  using the DOCDB simple patent-family id (falling back to the publication number
  when a record carries no family id, so unrelated patents are never merged).
  Cross-jurisdiction coverage stays worldwide — the CV just stops repeating the
  same invention.

- **Homepage hero repositioned around what SigmaCV does that a reference manager
  can't.** The headline now leads with **one ORCID iD → your CV in every funder's
  format** (NIH, ERC, MSCA, NSF, JSPS — switch citation style once and every
  reference reformats) and a **public page that keeps itself up to date**, and
  names the audience it's built for (researchers who rebuild their CV for every
  grant, in Word and LaTeX alike). Copy only — same sign-in flow. All ten locales.

- **The "publish a public page" nudge now appears after you export, not on first
  import.** Previously it was an onboarding prompt shown right after the initial
  sync — when the CV is still raw, un-curated source data — so people dismissed it
  or published a half-finished page. It now fires after a successful document
  export (PDF / DOCX / LaTeX / Markdown), i.e. once the CV is presentable and
  you're about to share it, with copy tied to that moment. Still dismissible,
  never auto-publishes, and never shown once the page is live. (Data and grant-CV
  exports don't trigger it.) Re-localized in all ten locales.

- **Search-engine indexing is now a prominent, explained choice when you publish.**
  Making a published page discoverable in Google was a quiet checkbox most people
  never noticed (only a fraction of published pages were indexable). It's now an
  emphasised control with a one-line "this is how people find your work" benefit
  note. It stays **opt-in and off by default** (GDPR/APPI) — the choice is just
  informed now, not buried. Localized in all ten locales.

- **More descriptive page titles + descriptions (SEO).** Bing Webmaster Tools
  flagged the `/about` and `/contact` titles as too short (e.g. "About —
  SigmaCV") and the Chinese homepage's meta description as too short. The About
  and Contact `<title>` tags are now descriptive in all ten locales, and the
  zh-CN homepage description is fuller.

### Fixed

- **Social-share cards now show each page's own title, not the homepage's.** The
  site-wide layout set the OpenGraph/Twitter title + description to the homepage's,
  and Next.js cascades that to every page without its own — so sharing a landing
  page, guide, or glossary term (e.g. `/orcid-to-cv`, `/phd-cv`) on LinkedIn, X or
  Slack showed the generic homepage card. The layout now carries only page-neutral
  OG/Twitter defaults; the homepage keeps its own card, and every other page uses
  its already-correct per-page title + description.

## [0.2.0] - 2026-06-23

### Added

- **Three more bundled display faces** (SIL OFL, latin subset, embedded as
  `@font-face` data URIs like the existing three): **Space Grotesk**, **Newsreader**
  and **Fraunces**, used by the field public-page styles. `npm run fetch-fonts`
  regenerates them.

- **Three field-tuned public-page styles: "Codex", "Ledger" and "Atelier"**, for
  the disciplines the existing styles served least well.
  - **Codex** — for the **humanities**: a printed monograph in ivory book stock,
    old-style serif, a hardback oxblood book-spine in the left gutter, fleuron
    section marks and a drop-capped opening; your own (identifier-matched) name is
    set in oxblood small-caps. Pairs naturally with a books-first order and a
    notes-bibliography citation style.
  - **Ledger** — for **economics / quantitative social science**: a working paper.
    A navy-ruled cover masthead, an "Abstract"-labelled summary, numbered sections,
    monospace tabular detail and faint ruled baselines; your own name is cited in
    navy under a dotted rule.
  - **Atelier** — for **the arts, design & architecture**: a gallery portfolio.
    Bright gallery stock, an oversized display name, a museum-matted portrait,
    wide-tracked clay section labels and generous space; built to look complete
    from a hand-curated record (these fields have no open data source).
  - All three are restrained, DORA-safe, CSS-only and fully static under
    `prefers-reduced-motion`/print; credible-group (never show the mascot, never
    affect any export). Pick them under **Design → Public page style**.

- **Two more credible public-page styles: "Hanko" and "Pharmacopoeia"**, extending
  the field-built credible end of the catalogue alongside Posology.
  - **Hanko** — a Franco-Japanese editorial style: an ukiyo-e ink world, a
    monochrome sumi woodblock where each section's Japanese name is brushed in stroke
    by stroke beside the heading, over a faint Fuji and seigaiha band, an enso,
    drifting ginkgo and a single vermilion seal; your own (identifier-matched) name
    is signed under a fine vermilion rule.
  - **Pharmacopoeia** — an apothecary monograph: warm parchment under a faint
    hexagonal benzene-ring lattice, a double-ruled label masthead with a benzene
    watermark, hexagon-bulleted headings, and your own name picked out with a
    translucent amber highlighter.
  - Both are restrained, DORA-safe (no metric enlarged or coloured for emphasis),
    CSS-only and fully static under `prefers-reduced-motion`/print; like the other
    credible styles they never show the mascot and never affect any export. Pick
    them under **Design → Public page style**.

- **New "Posology" public-page style** — a credible flagship for the living public
  CV (`/p/<slug>`), built from a pharmacology dose–response (sigmoid) curve that
  doubles as the logistic function and the shape of a Σ. A thin teal curve in the
  left gutter draws itself in on load (with an EC₅₀ inflection marker), the
  page is set on faint clinical squared paper under a large Σ watermark, each
  section heading carries a data-point node, and the account holder's own
  (identifier-matched) name is stamped in a vermilion hanko seal. Restrained,
  DORA-safe (no metric is enlarged or coloured for emphasis), CSS-only, and fully
  static under `prefers-reduced-motion`/print. Like the other credible styles it
  never shows the mascot and never affects any export. Pick it under **Design →
  Public page style**.

- **US Letter page size.** A new "Page size" choice lets you export and preview on
  **US Letter** (8.5×11in) instead of the A4 default — the standard for North
  American academic and job applications. It sets the PDF/print paper and the
  WYSIWYG preview width together; the content column is unchanged, so only the
  paper (and where pages break) differs. Localized in all ten languages.

- **Side-by-side or stacked editor preview.** A new desktop toggle lets you put
  the live preview beside the editor (default) or stacked below it — handy on
  narrower laptop screens or when you want a full-width editor and preview. Your
  choice is remembered across sessions. (Phones keep the existing Editor/Preview
  tab switch.) Localized in all ten languages.

- **Import from JSON Resume.** Already have a CV in the popular
  [jsonresume.org](https://jsonresume.org) format? Paste it or upload the `.json`
  in the Profile editor and SigmaCV pulls in the parts open research data can't
  supply — work history, education, skills, awards, languages, volunteering,
  projects, and references — and fills any empty header/profile fields. It's
  strictly **additive**: it never overwrites data you already have, and it skips
  publications (those come from OpenAlex/ORCID, so importing them would just
  duplicate your work). Runs entirely in your browser; localized in all ten
  languages.

- **Private notes — a scratchpad only you can see.** The Profile editor now has a
  free-text notes field for drafts, reminders, and todos (e.g. "ask a co-author
  before publishing", "add the 2025 talk"). It lives in your saved CV but is
  **never rendered, exported, or published**: it's stripped at the single public
  gate, so it can't leak onto your public page or into any machine download
  (JSON / CSL-JSON / BibTeX). Optional, localized in all ten languages.

- **Your evidence, surfaced under each narrative module.** Below the writing prompt
  on each "Résumé for Researchers" section, the editor now shows the relevant
  outputs you already have — e.g. "You can draw on: 32 Publications · 6 Datasets &
  Software" under Contributions to knowledge, or your supervision and teaching
  counts under Contributions to individuals — so you can weave concrete
  contributions into the prose instead of recalling them from memory. It counts
  only what's actually on your CV (hidden / "not mine" items don't count),
  editor-only, localized in all ten languages.

- **Writing guidance for narrative-CV sections.** The four "Résumé for Researchers"
  / R4RI narrative modules (contributions to knowledge, to individuals, to the
  research community, and to society) now show a short prompt in the editor
  describing what belongs in each — a narrative CV is hard to start from a blank
  box. It's editor-only guidance (never rendered on your CV), localized in all ten
  languages, and only appears on those four modules (free-form prose sections are
  left untouched).

- **Manual page breaks for the PDF.** Each section in the content editor now has a
  "New page" toggle: turn it on and that section starts on a fresh page in the
  PDF/print export (e.g. begin Publications on its own page). It complements the
  automatic page-flow (which already keeps a heading with its first entry and never
  splits an entry) by giving you control over where a new page reads best. The
  first section never forces a break (no blank leading page); on-screen and the
  living public page are unaffected.

- **New public-page style: "Chronicle".** An archival, strictly monochrome career
  register — deep ink on aged paper, a classic serif with old-style numerals, a
  double-rule masthead and small-caps section labels. Its signature is a dated
  timeline for your Positions and Education: each role's years sit in a left margin
  against a hairline rule with a node tick, reading like a printed record of a
  career. Deliberately uses no accent colour (even the ORCID mark is rendered in
  ink). Public page only; like every showcase style it never touches your exports.

- **"What's new" entries are now clickable.** Each title in the living page's
  "Recently added" line links straight to that entry in the page above, where you
  can read the full citation and open its abstract, cite and full-text tools. The
  jumped-to entry is briefly highlighted. Every CV entry now carries a stable
  anchor; it's a same-page link (no JavaScript) and never appears on exports.

- **"Review new works before they appear" (opt-in).** A new design toggle changes
  how re-syncs treat works they've never seen. By default SigmaCV keeps adding
  newly-found publications automatically (the living-CV behaviour). Turn this on and
  each new work is instead held back as a review candidate — hidden from your CV and
  public page, badged "New" in the editor — until you confirm it with "Show" (or mark
  it "not mine"/"keep hidden"). It never touches works you've already curated, and
  never affects your first import. Localized in all ten languages.

- **A "What's new" line on the living public page.** Next to the "Updated …"
  line, a published page now shows the works your most recent sync actually added
  (e.g. "Recently added: <title> · <title>") — concrete proof to a visitor that the
  page keeps itself current. It lists only confirmed, still-visible additions
  (never unconfirmed review candidates, never anything you've since hidden, and
  never the first import), and like the rest of the living-page footer it never
  appears on exports. Localized in all ten languages.

- **Terms of Use.** A new `/terms` page (and `/[locale]/terms` for the other nine
  languages) sets out the contract for the hosted service that the privacy notice
  already presupposed: acceptance, what the free/open-source service is, accounts
  and eligibility, your content and the limited licence you grant to host and
  display it, acceptable use, a disclaimer that auto-generated CV data (from
  OpenAlex/ORCID/Crossref/DataCite) must be reviewed before you rely on or publish
  it, an "as-is" no-warranty clause, limitation of liability, suspension and
  termination, changes, intellectual property (the code stays under its open-source
  licence on GitHub; the SigmaCV name/branding do not), a pointer to the privacy
  notice, and governing law (Japan, where the operator is established, while
  expressly preserving the mandatory consumer-protection rights of your country of
  residence — e.g. in the EU). Linked from the site footer next to Privacy, listed
  in the sitemap with reciprocal hreflang, and localized into all ten languages.

- **Per-publication structured data on the living public page.** The public page's
  JSON-LD now describes each visible work as its own machine-readable entity —
  publications, preprints and conference papers as `ScholarlyArticle`, and the
  datasets/software section as `Dataset` / `SoftwareSourceCode` — each keyed by its
  DOI (`https://doi.org/…`) with the year, venue and an open-access flag, and
  attributed to the account holder. This makes a published CV's outputs
  discoverable by search and answer engines (e.g. Google Dataset Search) and lets
  them attribute the works to the right researcher, on top of the existing
  Person/ProfilePage identity. No effect on exports; nothing new is shown on the
  page itself.

- **A "PubMed" link on the living public page.** Each publication that carries a
  PubMed id now shows a small "PubMed" link alongside the existing Cite / Full
  text / Abstract tools, next to the DOI — a one-click jump to the record on
  PubMed for biomedical readers. Public page only (never on exports), and only
  when the id is present.

- **A "research output" summary (opt-in).** A new design toggle shows a compact
  breadth-of-output line in the research-summary block — counts by type for the
  outputs you actually have (e.g. "12 Publications · 3 Datasets & Software · 2
  Patents"), drawn only from your visible items. It reframes output as the breadth
  of your contributions rather than a single headline number, in keeping with
  responsible-assessment (R4RI/DORA) framing. Off by default; like the rest of the
  summary block it follows the block's placement, and the labels are localized.

- **Deep-linkable section headings on the living page.** Each section heading now
  has a stable id and a quiet "#" permalink that appears on hover (or keyboard
  focus), so a visitor can copy a link straight to your Publications, Grants, or
  any other section. It's a screen-only navigation aid — accessible (the link is
  announced with the section's name) and never printed, so exports are unchanged.

- **An "Our promises" trust statement.** The Transparency page now opens with a
  short, plain list of the things SigmaCV will never do — never email your
  co-authors on your behalf, never sell your data or show ads, never paywall your
  own data, never inflate your numbers, never publish anything without your
  say-so, never guess who you are from your name — closed by an open-source link
  so anyone can verify them in the code. A one-line version, with a link to the
  page, now also appears in the Publish panel, right at the moment you decide to
  make your CV public. Localized in all ten languages.

- **A "Font size" control in the design panel.** A new size selector (85%–120%)
  scales the whole CV's typography up or down in proportion — every section's
  headings, name, body and gaps grow or shrink together — so you can fit more on a
  page or make a short CV more generous, in both the editor preview and the export.
  It's independent of (and composes with) the existing Density setting.

- **A QR code on your exports that links to your living public page.** Opt-in (off by
  default) and only available once you've published a public page: a small QR code plus
  a "Live version" link is added to the bottom of your PDF and HTML exports, your DOCX
  (as an embedded image) and your LaTeX (via the `qrcode` package), and as a plain
  autolink in Markdown — so a printed or PDF CV always points back to the always-current
  online one. The QR encodes only your public page URL (no personal data or tokens), and
  it's never added to the parser-safe ATS template. Turn it on under Design → Document
  layout.

- **Icons for your contact details and profile links.** Your email, phone, address
  and website now show a small icon, and each profile link gets the right icon for
  its service — GitHub, LinkedIn, ORCID (in its signature green), Google Scholar,
  X, Mastodon, ResearchGate, YouTube, Bluesky — detected automatically from the
  link, with a neutral globe for anything else. A bare link with no label is also
  named for you ("GitHub" instead of a raw URL). The icons are monochrome so they
  match each template and the dark public-page styles, decorative (the text stays
  fully readable to screen readers and résumé parsers), and omitted from the
  parser-safe ATS template. The plain DOCX/Markdown/LaTeX exports gain the cleaner
  auto-labels (no icons).

- **Your public CV is now a research hub people can cite from and subscribe to.**
  Six additions to the living public page (`/p/<slug>`):
  - **Cite any publication in one click.** Every work gets a quiet "Cite" disclosure
    that downloads that single reference as BibTeX, RIS, or CSL-JSON — no need to grab
    the whole bibliography.
  - **Import straight into your reference manager.** Every publication carries embedded
    COinS metadata, so Zotero's (or Mendeley's) browser connector detects them all and
    lets you select and import several at once (the Google-Scholar-style multi-select).
    A quiet line at the foot of the page now points visitors to this, so the feature is
    discoverable and not just hidden in the markup.
  - **Follow a researcher's output by RSS/Atom.** Each living page now publishes a
    feed at `/p/<slug>/feed.xml` of recent works, auto-discovered by feed readers.
    A "Subscribe" control on the page opens to reveal the feed URL to paste into your
    reader (rather than just opening the raw feed XML, which browsers can't subscribe
    to on their own).
  - **An automatic "Research areas" summary.** An opt-in chip row of your most
    frequent fields, computed from open data (not a self-reported skills list, and
    excluding works you've hidden or marked "not mine"). Off by default.
  - **Read the abstract and jump to the open-access full text** inline under each
    work, as no-JS disclosures and links. An expanded abstract reads as a contained
    callout card (an accent left edge + a faint panel) rather than a wall of text down
    the left margin. Abstracts come from OpenAlex, and any it is missing are now
    gap-filled from Crossref — so the "Abstract" toggle appears on many more works
    (filled on a sync and kept across re-syncs).
  - **Pin "Selected publications."** Star individual works in the editor to float
    them to the top of their section with a quiet "Selected" mark; the pin survives
    re-sync.
  - **Filter a long publication list by year, work type, or open access** with
    server-rendered facet links (e.g. `?since=2021&type=review&oa=1`) — no JavaScript
    required. Work-type chips (Articles / Preprints / Reviews / Conference / Books /
    Datasets) appear only for the types you actually have.

  Everything here is localized in the ten supported languages, stays off every
  exported PDF/DOCX/LaTeX, and respects the page's strict no-JavaScript security
  policy.

- **Move — or hide — the research summary.** The block under your name (the metrics
  strip, the publications-per-year chart and the authorship breakdown) now has a
  placement control: keep it in the header (the default, unchanged), give it its own
  titled section right after your summary, push it to the end of the CV, or hide it
  entirely. When it stands on its own it gets a real heading (default "Research
  summary", and you can rename it), so it reads as its own section and is reachable
  by screen-reader heading navigation instead of being buried in the page header.
  Existing CVs are unaffected until you change the setting. Localized in all ten
  languages.

- **A gentle nudge away from a metrics-heavy header.** The editor's metrics
  section now opens with a short, DORA-aligned line — metrics are optional, and
  readers tend to weigh your narrative and the work itself over scores, so show
  them sparingly — with "DORA" linked to the declaration. And if you switch on
  four or more metrics at once, a quiet callout appears suggesting a shorter strip
  reads better and keeps the focus on your work. Neither removes any choice — they
  just steer toward a calmer header at the moment you're deciding. Localized in all
  ten languages.

- **Signing in now tells you what's happening.** If a sign-in fails (an OAuth
  hiccup, a denied permission, a provider being down) you land on a clear, friendly
  page that explains what went wrong and offers to try again, instead of a bare
  fallback. The sign-in buttons show a "Signing in…" state while they work (so the
  page never looks frozen and a double-click can't double-submit), and the email
  magic-link flow ends on a "check your inbox" confirmation. Localized in all ten
  languages.

- **Exporting shows progress — and tells you if it fails.** The Export button now
  shows an "Exporting…" state while your file is being produced (the PDF render can
  take a few seconds) and a failure surfaces a message in-app instead of dumping a
  raw error page. Localized in all ten languages.

- **A friendly page when a public CV link doesn't resolve.** Following a mistyped
  or unpublished `/p/…` link, or hitting the rate limit, now shows a small branded
  page with a way back to SigmaCV, rather than a bare line of text.

- **An optional SigmaCV-logo mascot that travels your living page.** Turn on a
  single little **SigmaCV logo** (the Σ mark, brought to life) that **rides down the
  left of the page with the scroll** and **changes its hat to match the section
  you're reading**: a mortarboard on Education, a coin on Grants, a microphone on
  Talks, a star on Awards, goggles on Datasets, a lightbulb on Patents, and more.
  There's just **one** mascot per page, and it's **skinned to each style's
  atmosphere** (a neon Σ on Cyberpunk, a brass Σ on Clockwork, a pixel Σ on
  Arcade…). It's available on **all the animated styles** — never on the credible
  styles (Folio/Meridian/Trajectory/Lumina) or in any export — **off by default**,
  100% CSS-only (no JavaScript, even for this), decorative (`aria-hidden`), and
  hidden automatically for visitors who prefer reduced motion, on narrow screens,
  and in print.

- **We now flag publications that may not be yours.** Open databases like OpenAlex
  match papers to authors automatically and, to avoid missing any, lean toward
  over-merging — so a paper by a different researcher with a similar name can land
  on your profile (most common for widely-shared and non-Latin-script names). SigmaCV
  now spots these: when a work was matched only by an OpenAlex author profile (no
  confirming ORCID) **and** it disagrees with the rest of your record — it shares
  **no co-authors** with your other work, plus either a clearly **different research
  field** or an **institution you've never been affiliated with** — it gets a calm
  "Review" badge that explains exactly why, and a count in the "Needs your attention"
  checklist. Nothing is ever removed automatically: confirm it with **"Yes, it's
  mine"** (it stays, and we stop asking), mark it **"not mine"**, or hide it — and if
  you share a common name and see several, **"They're all mine"** clears them in one
  click. The check is deliberately conservative (it would rather miss a few than
  wrongly question a paper that's yours), uses only your own profile signals (never
  any inference about names or origin), and these flags never appear on your public
  page or exports.

- **Three richly-animated styles for your published living page.** **Arcade** (a
  bright retro-platformer stage with parallax clouds, spinning coins, and entries
  that jump into place), **Meadow** (a hand-painted pastoral scene with rolling
  hills, a breathing sun, drifting clouds, and falling petals), and **Cyberpunk**
  (a neon-noir city with falling digital rain, a chromatic-aberration glitch on
  your name, and holographic shimmer). All original art — genre homages, not the
  trademarked works that inspired them. As always: 100% CSS-only under the strict
  no-JS CSP, accent-aware, full reduced-motion fallback, and never affects exports.

- **A "Clockwork" steampunk style for your published living page.** A dark
  brass-and-iron look where electric cords hang from a ceiling rail with glowing
  Edison bulbs that gently sway, brass gears turn slowly behind the page, your name
  sits on an engraved brass nameplate, and each entry is marked with a rivet. Like
  every public-page style it is 100% CSS-only under the strict no-JS CSP, tints its
  lamp glow with your accent colour, ships a full reduced-motion fallback, and never
  affects exports.

- **Four new styles for your published living page.** The public page (`/p/[slug]`)
  gains four polished, credible looks designed to read well to a hiring committee —
  **Folio** (a typeset scholarly-journal feel in warm serif), **Meridian** (austere
  Swiss/monochrome minimalism with numbered sections), **Trajectory** (a career
  timeline with a milestone rail), and **Lumina** (a refined dark cinematic stage) —
  surfaced at the top of the style picker. Each is 100% CSS-only under the page's
  strict no-JS CSP, rides your chosen accent colour, ships a full reduced-motion
  fallback, and never affects exports (PDF/DOCX/LaTeX stay on your document template).

- **Your public CV now links to co-authors who are also on SigmaCV.** When a
  co-author on one of your works has published their own search-indexable SigmaCV
  page, your public page's structured data (schema.org JSON-LD) now expresses that
  collaboration as a `knows` link to their profile — building a discoverable web
  of researcher CVs for search and AI answer engines. Matching is by **ORCID
  identifier only** (never by name), and a co-author is linked **only if they
  opted their own page into search indexing** — the same consent that lets search
  engines find their page. Nothing changes visibly on the page, and a co-author
  who unpublishes or turns off indexing is delinked automatically.

- **A "Living CV" badge for your README, site, or email signature.** Once your
  page is published, the publish panel has a new **"Get a badge"** section: a small,
  always-current SVG badge (a standard pill, a compact chip, or a richer card with
  your name and the month it last synced) that links back to your living public CV.
  Pick a style and light/dark/auto theme, preview it live, and copy a ready-made
  **Markdown / HTML / image-URL** snippet — plus a downloadable **QR code** for
  posters, slides, and business cards. It shows only your already-public data
  and **stops working the moment you unpublish**, it makes no third-party requests,
  and it is **deliberately metric-free** (no h-index or citation count) in keeping
  with the project's DORA stance — it advertises openness and freshness, not a rank.
  The badge also carries the same FAIR Signposting links as the public page, and
  the panel chrome is localized across all ten languages.

- **Edit a position's institution and dates, too.** Each position and education
  entry now has an **"Edit details"** panel to correct the **institution name** and
  the **start/end year** — with an **"Ongoing"** toggle for current roles. Like the
  role field, your edits are kept across re-syncs (the source value refreshes
  underneath, one click reverts), and the date range now reads in your CV's
  language ("present"/"until" localized across all ten languages and every export).
  Editing the institution name shows it verbatim (its automatic ROR link steps
  aside for your wording). Entries from before this change show "Re-sync to edit
  dates" until their next sync.

- **Your CV refreshes itself when you open the editor.** Opening `/cv` now
  re-syncs from the open sources in the background when your CV has gone stale
  (more than ~12 hours since its last sync) — your saved CV appears instantly and
  the “what’s new” banner shows up if anything changed. No waiting, and frequent
  visits don’t re-sync needlessly.

- **A clearer “what’s new” after a sync.** The post-sync banner now leads with the
  items that need a decision: **“N to review”** is a button that jumps straight to
  each review candidate (and cycles through them), while newly auto-included items
  stay quiet. When a sync brings in many items at once, the list collapses to
  per-section counts (“Publications 9 · Grants 4”) with a “+N more”, so a big sync
  never floods the editor. Localized in all ten languages.

- **The homepage marks publishing as optional.** Step 04 (“Publish a living page”)
  now carries an **“Optional”** badge — the first three steps already produce a
  complete CV. Localized in all ten languages.

- **A fillable “Role / title” for each position.** Positions and education entries
  now carry the **role/title as its own field** — pulled from ORCID when available
  (e.g. “Assistant Professor”), and an inviting **“Add your title…”** blank to fill
  when a source (such as an OpenAlex-inferred affiliation) doesn’t provide one. Your
  edit is kept across re-syncs while the source value keeps refreshing underneath
  (one click reverts to it), and the institution and dates stay sourced from
  ORCID/ROR. The role is stored as structured data, not just text. Localized in all
  ten languages.

- **Animated showcase styles for your public page.** Your living public CV page
  (the shareable `/p/…` link) can now use one of **nine optional animated styles**
  — Prism, Pop, Neon, Synthwave, Terminal, Riso, Aura, Mesh and Marquee — chosen
  in the editor under **Design → Public page style**. They are **web-only and
  never change your PDF, DOCX or LaTeX exports** (those stay clean); each adapts
  to your chosen accent colour, font and photo, ships a `prefers-reduced-motion`
  fallback, and renders under the same strict no-JavaScript page security policy.
  The default stays **“Match my document.”** A new **Document / Public page**
  toggle on the editor preview shows exactly how the page will look. Localized in
  all ten languages.

- **The homepage now shows the living public page.** A fourth **“Publish a living
  page”** step in the “How it works” flow introduces the re-syncing public page —
  with an animated preview of the optional showcase styles and a clear “online
  only; exports stay clean” note. Localized in all ten languages.

- **A light/dark theme toggle.** The site followed your OS appearance with no way
  to override it. It now **auto-detects and applies your OS preference**, and a
  compact **sun / moon** toggle in the homepage nav, the shared header, and the
  editor top bar lets you switch — your choice persists across visits (until then
  the page keeps following the OS, and the highlight tracks it if the OS flips).
  A tiny pre-paint script applies the theme before the first render, so there's no
  flash of the wrong theme — and because it's static and allow-listed by its hash
  in the CSP, the marketing pages stay statically rendered. If JS is off (or the
  script is ever blocked), dark mode still follows your OS, so nothing regresses.

- **A shared header and footer now connect every page.** The marketing and
  reference pages — the SEO landing pages, guides, glossary, examples, and the
  About / Privacy / FAQ / Accessibility / FAIR / Transparency / Principles pages —
  were previously dead ends: no top bar, no way to reach the guides, sign-in, or
  each other without the browser back button. They now share a sticky header (a
  clickable brand back to home, links to Guides / Examples / About, the language
  switcher, and a **Build my CV** call to action) and a full footer (every
  secondary destination). Localized across all ten languages; the header stays
  statically rendered, so the crawlable pages keep their SEO. The homepage keeps
  its own hero-integrated nav and footer, which the shared chrome is styled to
  match.

- **Clearer trust at the two moments that matter most.** The sign-in card now states,
  right under the ORCID button, that we only read your public ORCID record — never
  post, never write anything back. And the **Publish** control now spells out what
  becomes public (your name, ORCID, and the publications you've kept) and that your
  email, phone, and location stay private unless you opt in — shown _before_ you
  publish, not after.

- **Calmer review cues.** The ⚠ warning badge is now reserved for a genuine ORCID
  _conflict_ (a different iD on the matching author). Works that are probably yours —
  listed in your ORCID record, or matched to you by name and organization — get a
  quiet, neutral **Review** chip instead, so the editor stops looking alarming about
  records that are most likely fine. The **Buy me a coffee** link also now explains,
  on hover, that SigmaCV is free and not-for-profit and a coffee helps cover its
  running costs.

- **Your published CV page now shows it's a _living_ page.** A public `/p/…` page
  carries a visible "Updated _<date>_ · updates automatically" line, so a visitor
  (a hiring committee, a collaborator) can see at a glance that it's current — the
  whole point of a living CV, which a static PDF can't convey. The page also now
  emits schema.org structured data (with a `dateModified`) whether or not you've
  opted into search indexing — so tools and assistants you deliberately share the
  link with can read a structured profile (search engines still stay out unless
  you opt in).

- **A share moment when you publish.** Once your page is live, the Publish menu now
  shows the link prominently with one-tap **Open page** / **Copy link** and a nudge
  to add it to your ORCID record, website, or email signature — so the living page
  is something you actually share. Copying now announces itself to screen readers,
  and a failed publish/unpublish is surfaced instead of silently swallowed.

- **The re-sync digest now points at your living page.** When your CV is published,
  the "new entries" email leads with a link to your public page — the thing you
  share — with the editor link kept as the secondary "review and curate" action.

- **PDF exports are now tagged (accessible).** The exported PDF carries a proper
  structure tree (headings, lists, links) and a document outline derived from the
  CV's semantic HTML, plus its language — so screen readers can navigate it and it
  reflows, instead of being an untagged flat page. No change to how the PDF looks.

- **Auto-save in the editor.** Curation and styling changes now persist
  automatically a moment after you stop editing — no need to click Save. Edits
  are coalesced into a single write (debounced, well under the save rate limit),
  and the browser warns before you leave the page with an unsaved change still
  in flight. The Save button stays as an immediate-save fallback and a clear
  saved/saving indicator; a failed save keeps your changes pending (no silent
  data loss, no retry storm) and re-tries on your next edit.

- **"Needs your attention" checklist now jumps you to the item.** Each row of
  the editor's CV-health panel (review candidates, possible duplicates, ORCID
  conflicts, shown retracted works) is a link: clicking it expands the relevant
  section and scrolls the first such entry into view (duplicates open their
  compare panel), instead of leaving you to hunt through collapsed sections.

- **"Keep hidden" for review candidates.** An ORCID-listed work OpenAlex didn't
  attribute (or a name+org-matched grant/trial) can now be triaged a third way —
  besides "Show" and "not mine" — to keep it off your CV and stop flagging it,
  without recording a "not mine" disambiguation claim. The decision is kept in
  your display state, survives re-sync, and is never published.

- **"You may already have this" hint on ORCID-discovered candidates.** A pending
  ORCID-listed work whose DOI/PMID or title matches an entry already shown on
  your CV is flagged inline, so a likely duplicate is obvious before you add it.

- **Notification email for digests (double opt-in).** ORCID sign-in rarely
  provides an email address, so opted-in users often had nowhere to receive
  the re-sync digest. Turning on "Email updates" now reveals an address field:
  the entered address is stored pending and gets a confirmation link (signed,
  expiring token); only a confirmed address is ever used, with the login email
  as fallback. Included in the account data export; the digest run reports
  addressless opt-ins (`noAddress`).

- **Opt-in re-sync digest email.** A new account toggle (default OFF) emails
  you when a scheduled re-sync actually changed your CV — new entries (with up
  to five titles), review candidates, removals — in your CV's own language, at
  most once a month, with a one-click unsubscribe (RFC 8058) in every mail.
  Powered by the per-sync change report below; dormant unless SMTP
  (`EMAIL_SERVER`/`EMAIL_FROM`) is configured. New `digest-cron` compose
  sidecar pings the secret-guarded `/api/internal/digest` daily; the per-user
  monthly cadence lives server-side, so container restarts can't starve it.

- **"What changed in your last sync" report.** Every sync now records what it
  changed — newly-appeared items (with their section), items the sources no
  longer list, and how many arrived as review candidates — plus per-source item
  counts and fetch timings. The editor shows it as a dismissible banner (first
  sync gets a one-line import summary), so a re-sync silently merging three new
  works into a 400-item CV is no longer invisible. Persisted per user
  (`Cv.lastSyncReport`) and returned by `POST /api/cv/sync`.

- **Bulk curation.** Sections with five or more entries get a "Select multiple"
  mode: filter by title/venue text, year range, or review-flagged-only, then
  hide/show, mark "not mine" (eligible entries only, same per-row rule), or
  exclude the whole selection from the current view in one action. Keeps
  curation cost roughly constant in career length for prolific authors.

- **CV health checklist.** A compact "needs your attention" panel above the
  sections lists outstanding review candidates, unresolved duplicate hints,
  ORCID conflicts, and still-visible retracted works — factual counts only, no
  score. Hidden when there is nothing to do.

- **"This is my work" on structured manual entries.** A hand-entered
  publication can now be marked as the account holder's own (choosing which
  typed author is them) — it self-highlights like an imported work and records
  the same user-asserted `matchBasis: "claimed"` as the add-by-DOI flow.

- **Product Hunt launch kit** — a ready-to-use kit for launching SigmaCV on Product
  Hunt (`docs/product-hunt-launch-kit.md`): tagline/description options, topics,
  the maker's first comment, a gallery shot list with branded graphics
  (`docs/images/product-hunt-*`), a launch-day playbook, and a pre-launch checklist.
  Supports the discoverability roadmap (tool directories / listed where LLMs retrieve).

- **Server operations runbook** (`docs/SERVER-RUNBOOK.md`) — copy-paste VPS
  checklist: env audit, backup test-restore, OEP import check, SSH/fail2ban/
  unattended-upgrades hardening, image-refresh cadence, disk/log rotation,
  uptime + error alerting, and GDPR data-subject-request handling.

- **Academic CV examples gallery** (`/examples`) — illustrative example CVs by field and
  career stage (biology, computer science, psychology, economics, chemistry, physics,
  history, public health), for grad-school applicants, PhD students, postdocs and
  faculty. Each shows a **fictional** researcher with fabricated publications (clearly
  labelled an illustrative example), with the author's own name highlighted, and links
  to building your own. English for now.

- **Native head-term landing pages** — dedicated pages that target each market's own
  search term for an academic CV, at a native URL: **CV académique** (`/fr/cv-academique`),
  **wissenschaftlicher Lebenslauf** (`/de/…`), **CV académico** (`/es/…`), **CV accademico**
  (`/it/…`), **currículo acadêmico** (`/pt/…`), **академическое резюме** (`/ru/…`),
  **学术简历** (`/zh/…`), **アカデミックCV** (`/ja/…`) and **학술 CV** (`/ko/…`), each with
  native-first copy and full landing-page structured data. Copy is machine-drafted,
  flagged for native review.

- **Research Resource Identifier (RRID)** — SigmaCV is now registered in the
  [SciCrunch](https://scicrunch.org/) registry as **RRID:SCR_028552**, so papers
  can cite the tool unambiguously. Recorded in `CITATION.cff`, `codemeta.json`
  and the README (badge + "Citing" section).

- **Publish nudge** (10 languages) — a gentle, dismissible prompt in the editor
  invites you to publish a free, shareable public CV page. It appears only while
  your CV is unpublished, never publishes on your behalf (its button just takes
  you to the publish toggle — publishing stays a deliberate choice), and stays
  hidden once you publish or dismiss it.

- **More landing pages for common searches** (10 languages) — a page for turning a
  **Google Scholar** profile into a CV (honest about the open path: Scholar has no
  API, so SigmaCV uses ORCID/OpenAlex), an **ERC CV** page, and an **"import
  publications to your CV"** page — each with the same depth and structured data as
  the other landing pages.

- **Glossary** (`/glossary`) — plain-language "what is X" pages for the key terms
  behind an academic CV (ORCID, OpenAlex, FWCI, the h-index, CSL, the NIH
  biosketch, preprint, DORA, the Leiden Manifesto), each marked up as a schema.org
  `DefinedTerm` with an FAQ and links to related terms, guides and tools — now in
  **all 10 supported languages**, each a crawlable URL with reciprocal hreflang.

- **Persona landing pages** (10 languages) — dedicated pages for specific
  applicants and career stages: a **PhD-application CV** (`/phd-cv`), **postdoc
  CV** (`/postdoc-cv`), **grad-school CV** (`/grad-school-cv`), **faculty/tenure
  CV** (`/faculty-cv`) and **research CV** (`/research-cv`), each speaking to that
  searcher's needs, with the same depth and structured data as the other landing
  pages.

- **Guides** (`/guides`) — a new section of in-depth, free guides on writing,
  formatting and automating an academic CV: how to write one, academic CV vs
  résumé, how to list publications, how long it should be, a CV for grad-school
  applications, using metrics responsibly (DORA / Leiden), and academic CV format
  by country. Each guide is a proper article with a named author, dates, an FAQ,
  and links to related pages, and is included in the sitemap — now in **all 10
  supported languages**, each a crawlable URL with reciprocal hreflang.

- **Localized institution names** — positions and education entries now show the
  institution in the CV's own language when ROR publishes a name for it (e.g.
  「名古屋大学」 on a Japanese CV, "Université de Nagoya" on a French one),
  falling back to ROR's canonical display name otherwise. The choice is made at
  render time, so switching the CV language re-localizes without a re-sync, and
  the ROR record link still wraps the displayed name. A hand-edited line is left
  exactly as the user wrote it. Variants populate on the next re-sync.

- **Wikidata entity link** in the homepage structured data — the
  `Organization` and `SoftwareApplication` JSON-LD now list SigmaCV's Wikidata
  item ([Q140158386](https://www.wikidata.org/wiki/Q140158386)) under `sameAs`, so
  search engines and LLM knowledge graphs resolve the site and its Wikidata record
  as one entity.

- **"Who it's for" section on the homepage** (10 languages) — four audience cards
  (students & grad-school applicants, PhD students & postdocs, faculty &
  principal investigators, and clinicians / librarians / research offices) make it
  immediately clear who SigmaCV serves. Non-English copy is an initial translation
  pending native-speaker review.

- **"Don't have an ORCID iD yet?" helper** on the sign-in card (10 languages) — a
  collapsible explainer for visitors without an ORCID iD (students, early-career
  and lower-income-country researchers): what an ORCID iD is, why it matters (it's
  how SigmaCV reliably finds your work), and a link to register a free iD. Non-English
  copy is an initial translation pending native-speaker review.

- **Richer `SoftwareApplication` structured data** on the homepage — now declares
  the software version, publication date, the ten supported `inLanguage` values,
  and an app `screenshot`, on top of the existing free-offer, licence and feature
  list. (No `aggregateRating` — SigmaCV never asserts ratings it cannot verify.)

- **Deeper SEO landing pages** — the seven landing pages (ORCID-to-CV, NIH
  biosketch, academic CV template, OpenAlex CV, publication list, LaTeX CV, funder
  CV templates) now carry comprehensive, crawlable content in all 10 languages: an
  opening overview, a four-step "how it works" guide, a "why" section, an expanded
  five-question FAQ, and links to related pages. Each page also emits `HowTo`
  structured data (alongside the existing `FAQPage` and `BreadcrumbList`). The
  non-English copy is an initial translation pending native-speaker review.

- **`llms.txt` + `llms-full.txt`** served at the site root — a clean,
  authoritative, extractable description of what SigmaCV is, who it's for, its
  open data sources, export formats and key pages (plus a Q&A reference), so
  assistants like ChatGPT, Claude, Perplexity and Gemini can describe and
  recommend it accurately. No reviews, ratings or testimonials are ever asserted.

- **FAIR Signposting** — public CV pages emit HTTP `Link` headers (`type`,
  `author`, `describedby`, `license`) so machine agents can discover the author
  identifiers, typed machine representations, and reuse license from the headers
  alone.

- **`/principles` page** (10 locales) — a public "Standards & principles we align
  with" page covering the Barcelona Declaration, DORA, CoARA, the Leiden Manifesto,
  the Hong Kong Principles, The Metric Tide, and FAIR / FAIR4RS.

- **Profile-level open-access share** — an opt-in summary of how many of a CV's
  works are open access, alongside the per-work OA badges.

- **NIH iCite Relative Citation Ratio (RCR)** — an opt-in, field-normalized metric
  (biomedical / PMID-keyed), shown with a benchmark and a biomedical caveat.

- **CycloneDX SBOM** generated on release (`npm run sbom`) and attached to GitHub
  releases, plus a **Software Heritage** archival badge — software supply-chain
  transparency.

- **Signed releases** — release artifacts are now cryptographically signed with
  keyless [Sigstore](https://www.sigstore.dev/) signing (no long-lived keys): each
  release ships a SLSA build-provenance attestation and a detached `cosign`
  signature bundle for the SBOM, and release tags are signed. Verification
  instructions are in [`docs/RELEASES.md`](docs/RELEASES.md).

- **Published canonical JSON Schema** at `/schema/cv/v2.json`, derived from the
  source-of-truth Zod schema (`npm run gen:schema`), so other tools can validate and
  adopt the CV format.

- **RO-Crate export** — download a CV as a Research Object Crate (`.crate.zip`): an
  `ro-crate-metadata.json` (JSON-LD) describing the CV, its author (by ORCID) and
  license, bundled with the canonical JSON, CSL-JSON, BibTeX and HTML.

- **Richer public JSON-LD** — a published, indexable CV now exposes its funding
  (`MonetaryGrant` with funder + award id), positions (`Occupation`) and education
  (`EducationalOccupationalCredential`) as structured schema.org entities, not just
  the bare `Person`.

- **Retraction flags** — works recorded as retracted (via Crossref / Retraction
  Watch, by DOI) are shown by default with a prominent "Retracted" badge, and a new
  **"Hide retracted publications"** display toggle lets you exclude them entirely
  (from every output). When shown, the badge always makes the retraction clear.

- **OAI-PMH endpoint** (`/api/oai`) — repositories and aggregators can harvest the
  indexable public CVs as Dublin Core (`oai_dc`) over the standard OAI-PMH 2.0
  protocol (Identify, ListMetadataFormats, ListIdentifiers, ListRecords, GetRecord),
  with `from`/`until` selective harvesting and resumption tokens.

- **OpenSSF Scorecard** workflow (`.github/workflows/scorecard.yml`), **Dependabot**
  automated dependency updates (`.github/dependabot.yml`), and a **CodeQL** static
  analysis workflow (`.github/workflows/codeql.yml`) — software supply-chain +
  SAST security signals, with drafted OpenSSF Best Practices answers in
  `docs/openssf-best-practices.md`.

- **"FAIR for your CV" page** (`/fair`, 10 locales) — a public explainer of the
  machine-readable formats a published CV comes in (canonical JSON + schema,
  CSL-JSON/BibTeX, RO-Crate, documents, JSON-LD, OAI-PMH/Signposting), how to cite
  a CV, how repositories can harvest it, and how to self-host.

- **Transparency page** (`/transparency`, 10 locales) — exactly where each CV
  entry comes from (grouped open sources), how identifier vs. name+org matching
  decides what's included, how a published CV refreshes, what is logged (nothing,
  by default), and the controls you have over your data.

- **Per-metric field-normalisation tooltips** in the editor's metric picker (10
  locales) — hovering a metric explains whether it is field-normalised (FWCI, RCR
  — preferred under DORA / the Leiden Manifesto) or not (h-index, raw counts),
  putting responsible-reading guidance at the point of choice.

### Changed

- **The six field-tuned public-page styles share an atmosphere + floating
  reading-surface model.** Each is an _atmosphere layer_ (background, colour and
  light — the mood) with the text floating on a separate _reading surface_ (an
  opaque page with a soft shadow), so nothing textured or moving is ever behind a
  glyph — they read more easily than a plain page, not less. Each carries its own
  bundled display face and a unique page margin: **Posology** a cool instrument room
  with an engraved dose–response curve margin (Space Grotesk); **Hanko** an ukiyo-e
  ink world whose section headings are brushed in, stroke by stroke, in Japanese,
  with a vertical 履歴書 margin + a vermilion seal (Newsreader); **Pharmacopoeia** an
  amber-lamplit parchment with a botanical-specimen margin and a verdigris accent
  (Fraunces); **Codex** a lamplit reading room with an illuminated gilt-vine margin +
  versal (EB Garamond); **Ledger** a cool blueprint with a ledger-red line-number
  margin, numbered sections and an Abstract (Source Serif 4); **Atelier** a cool
  plaster gallery wall with an engraved brass plate and plate-numbered labels
  (Inter). Motion is one gentle load reveal plus, at most, a faint ambient confined
  to the surround; all of it stops under `prefers-reduced-motion`, and print is a
  clean black-on-white document.

- **Saved versions now remember their section order.** A named preset (your
  "full CV", "grant biosketch", "teaching CV"…) already captured the template,
  styling, metrics and which sections show; it now also captures the _order_ of
  your sections, so different versions can lead with different sections (e.g. a
  teaching version opening with Teaching, a research version opening with
  Publications) off the same underlying data. Existing presets are unaffected —
  applying one saved before this change leaves your current order untouched.

- **Choose your CV font — Source Serif, Inter, or EB Garamond — and it looks
  identical everywhere.** The font picker in the design panel now offers three
  bundled typefaces: Source Serif (a refined contemporary serif, the default),
  Inter (a clean modern sans), and EB Garamond (a classic old-style serif). Each is
  embedded in the document itself, so the typeface and line-breaks are the same in
  the editor preview, the exported PDF, and every visitor's view — instead of each
  device substituting whatever font it happened to have installed (which made the
  preview and the PDF look different). (Fonts ship for Latin scripts; Cyrillic and
  CJK gracefully fall back to a system font per character.)

- **Positions, Education and diplomas now read as two-line records instead of one
  run-on line.** Each entry leads with the role (or, for a degree, the degree and
  field) in a prominent line with the dates aligned to the right edge, over a
  quieter "department · institution" line — so a reader can skim job titles down
  the left and the timeline down the right, the way a strong academic CV reads.
  Sparse entries degrade gracefully (no role → the institution leads; no
  department or no dates → those simply don't appear). The ATS template keeps the
  dates inline (no right-aligned column) for résumé-parser safety, and the
  DOCX / LaTeX / Markdown exports and the Japanese 履歴書 layout are unchanged.

- **The editor preview now matches the PDF exactly (true WYSIWYG).** The live
  preview previously rendered the CV at the width of the editor pane, so on a
  smaller window it wrapped differently from the exported PDF — and on a narrow
  pane it even flipped to the stacked mobile layout. The preview now renders as a
  scaled A4 page, so line breaks, spacing, and layout are identical to what you
  export. The print page box was unified with the on-screen one — the page itself
  adds no margin and each template supplies its own gutter from its box — so the PDF
  matches the preview edge to edge. In particular, full-bleed templates (the
  Sidebar's coloured panel) now reach the top of the page in the PDF exactly as they
  do on screen, instead of sitting below a white strip.

- **Contact details now read as a clean, icon-led list.** Instead of one cramped
  "·"-separated run, each contact item (location, email, phone, website) and each
  profile link sits in a responsive grid — one per line in a narrow header (e.g. the
  sidebar column), about two per line when there's room — each with its leading icon
  (LinkedIn, GitHub, ORCID, etc. auto-detected). The parser-safe ATS template keeps
  its single plain-text line.

- **A label for a profile link is now optional.** Because recognised services
  (GitHub, LinkedIn, ORCID, Google Scholar, …) are detected from the URL and named
  automatically, the link editor now leads with the URL field and treats the label as
  an optional override — when a service is recognised its name shows as the field's
  placeholder, and a short note spells out that you can leave it blank. Any label you
  do set still wins.

- **The "Choose your public-page design" hint no longer overflows the Publish
  popover.** The tip text was shortened (all ten languages) and the button now wraps
  instead of forcing the panel wider (it was running off the side).

- **The CV header now leads with you, not your numbers.** When you turned on
  metrics, charts and the authorship table they stacked directly under your name —
  and on the dark public-page styles the two bright white cards out-shouted your
  name, which made the header hard to read. Now your **summary** sits right under
  your identity and ahead of those cards, and the optional metrics strip moved below
  it, laid out one metric per line — each with its plain-language meaning ("1.0 =
  world average for field & year") and its coverage caveat ("mean over 95 works")
  shown as visible text instead of a hover tooltip, so the context is legible to
  everyone and survives to the printed PDF. The open-access share now reads as a
  clean labelled row ("Open access — 45%") rather than a bare phrase wedged into the
  strip, and the publications-per-year chart and the authorship breakdown sit side by
  side as one group when there's room (stacking on narrow screens and in print). The
  charts were simplified too: the **citations-per-year chart is gone** (on a recent
  window it is depressed by citation lag — the latest years look empty regardless of
  impact — so it misled more than it informed), and the remaining
  **publications-per-year chart now uses a plain linear scale** instead of a
  hard-to-read logarithmic one. Applies to every template and the public page; the
  chart simplification also carries into the DOCX export, the PDF mirrors the live
  page, and the LaTeX year-by-year table (explicit numbers, not bars) is unchanged.

- **The editor's Design controls are reorganised so your two outputs read
  clearly.** The styling that affects everything — fonts, colours, density,
  citation style, metrics — now sits together under **Look & typography**, and
  the two choices that belong to one output each get their own clearly-labelled
  group placed side by side: **Document layout** (the template behind your PDF,
  DOCX, LaTeX and Markdown exports) and **Public page style** (the animated look
  of your shareable page). Everything stays inside the one Design tab — the
  shared settings live in a single place, so your document and your public page
  can't silently fall out of sync. Localized in all ten languages.

- **The Publish control is now a focused on/off decision.** The publish popover
  had grown crowded — toggle, live link, badge + QR embed, and privacy settings
  all stacked together (and ran off the screen). The share/embed tools — your
  public link, the "Living CV" badge, and the QR — now live on their own **Share**
  button that appears in the top bar once your page is live, so the Publish
  popover stays short: just the on/off toggle and the visibility settings (search
  indexing + which contact fields are public). The contact toggles sit in a
  tidier row, and every top-bar menu now scrolls internally instead of overflowing
  the viewport. Localized in all ten languages.

- **Jump straight from Publish to styling your public page.** Once your page is
  live, the Publish menu now has a one-click link that takes you directly to the
  **Public page style** picker in the editor — it switches to the Design view,
  opens that group, and scrolls it into view, so you don't have to hunt for it
  after publishing.

- **"Why SigmaCV" is now a scannable four-up.** The homepage trust section was three
  text-heavy cards (with "no ads" said twice). It's now four compact, icon-led cards
  with minimal copy — **Free · Private · Open source · Responsible** — adding the
  responsible-metrics point (opt-in, DORA-aligned) that sets SigmaCV apart for
  researchers. The detail still lives on the Privacy / Principles / Transparency pages.

- **Publishing is framed as something you'd want, not a disclosure.** The publish
  summary used to lead with what gets _exposed_; it now leads with the benefit — a
  living public page, one link that always re-syncs to your latest work, for your
  email signature / ORCID / website — then keeps the privacy reassurance. And while
  your CV is unpublished, the **Publish** control's dot shows a calm accent pulse
  (reduced-motion-safe) inviting you to share your page; it settles to a steady
  green once you're live.

- **Editor parts reordered to Profile · Design · Content.** The editor's segmented
  control now leads with **Profile** (Design stays in the middle, Content moves to
  the end), and the editor opens on Profile. The rendered CV and every control are
  unchanged — only the order and the default tab.

- **First-run prompts no longer pile up.** A brand-new user could land in the
  editor facing three onboarding prompts at once — the “what changed in your
  sync” banner, the “check these are yours” coachmark, and the “publish your
  page” nudge — all competing for attention. They’re now shown **one at a time**
  in a sensible order (what just synced → review tip → publish), each revealing
  the next only when you dismiss it, so the first run feels calm instead of busy.

- **Your freshly-built CV reads as ready, not as a to-do list.** The first-import
  message used to end with “review the flagged ones below,” which made curation
  feel mandatory. It now says your CV is ready to export or publish and that
  reviewing the flagged entries is _optional_ — because identifier-matched imports
  are already yours; the flags are just the few worth a glance.

- **Editor top bar tidied up.** The toolbar above the editor — which had grown to
  mix the document actions with publish settings and account/GDPR controls — now
  leads with a single primary **Export** control (the format chooser fused to the
  button) and a quiet auto-save indicator. **Publish** settings and the whole
  **account** area (sign out, email-digest preferences, data export, and the
  destructive account deletion) collapse into menus, so the bar stays compact and
  the irreversible "Delete account" is no longer one click away in the chrome. The
  menus are keyboard- and screen-reader-accessible (dialog disclosures, not menus,
  since they contain form fields; reduced-motion respected). Also fixes a
  dark-mode bug where buttons turned white on hover.

- **Editor panel is now subdivided into Content / Design / Profile.** The CV
  editor's left panel — previously one long scroll mixing identity fields,
  styling controls, and content curation — is now split into three labelled
  parts you switch between, with a persistent "needs your attention" strip that
  stays visible above them and jumps you to the flagged item (switching to
  Content first). The Design part groups its settings (Presets, Template,
  Metrics, Display) into collapsible sections so the rarely-touched options stay
  out of the way. Keyboard- and screen-reader-accessible (proper tabs with arrow
  navigation; reduced-motion respected). The rendered CV and every control are
  unchanged — only the panel's layout.

- **Registration is ORCID-only by default again.** Configuring SMTP
  (`EMAIL_SERVER`/`EMAIL_FROM`) no longer auto-enables magic-link email
  sign-in — SMTP alone now powers only the opt-in digest mailer. Email login
  is a separate, explicit `EMAIL_LOGIN_ENABLED="true"` opt-in.

- **Redesigned link-preview (Open Graph) cards.** The social-share images shown
  when a SigmaCV link is pasted into Slack/Teams/X/LinkedIn etc. got a modern
  brand refresh. The site-wide card (all ten locales) now mirrors the homepage
  hero: deep indigo gradient with soft glows, the Σ medallion wordmark, real
  extra-bold typography (Google-font subsets, with a safe fallback), open-data
  source chips, and a CV-document mock featuring the signature identifier-driven
  self-name highlight. Public CV pages (`/p/<slug>`) get a matching light card
  tinted by the CV's accent colour, with an initials avatar (CJK-aware),
  headline/affiliation lines, and a Σ watermark.

- **ORCID work types now refine section placement.** Classification into the
  Preprints section was previously driven only by OpenAlex venue heuristics, which
  treat any repository-deposited or venue-less work as a "preprint" — so
  self-deposited conference posters, lecture/teaching materials, and datasets
  (often on Zenodo) were mis-filed there. The build now reads each work's
  author-asserted ORCID work type (matched by DOI) and uses it to route the work:
  posters, conference abstracts, talks/teaching, datasets, software, and similar
  non-publication outputs go to a new **Other Research Outputs** section instead of
  Preprints (and are dropped if the same DOI is already listed as a Dataset or
  Conference item); a venue-less work ORCID marks as a publication
  (journal article, book chapter, report, …) is rescued into **Publications**; and
  ORCID preprints/working papers stay in Preprints. Works with no ORCID type signal
  are unchanged. Fail-soft: an ORCID hiccup simply leaves the existing routing in
  place.

- **Institution links open the institution's website** — on Positions and
  Education entries the institution name now links to its own homepage when ROR
  records one (from ROR's `links[].website`), instead of the ROR registry page.
  The ROR record stays reachable as the persistent identifier: it is the fallback
  when ROR has no website on file, and the small trailing "ROR" link shown when
  the institution name was edited out of the line.

- Per-work **open-access badges are now opt-in** (default off), consistent with the
  metrics-default-none, DORA-aligned stance.

### Fixed

- **Long DOI/URL links no longer spill out of publication boxes on the public
  page.** On the bordered "panel" public-page styles (e.g. Cyberpunk) and inside
  the sidebar template's narrow column, a long DOI such as
  `https://doi.org/10.1016/j.acvd.2025.06.017` ran past the right edge of its
  entry box on a phone, because a URL is a single unbreakable token. Bibliography
  entries now break such links so they stay inside the box at any width.

- **Editor top bar no longer overlaps the page on a phone.** On a narrow screen
  the top-bar controls wrap onto several rows; the bar was being compressed below
  its content height (it sits in a full-height column), so the trailing controls
  — the "Buy me a coffee" button and the account menu — spilled out and overlapped
  the hint banner beneath it. The bar now keeps its full height and the rest of
  the page sits cleanly below it.

- **Datasets & Software entries now show their authors (and highlight yours).** A
  Zenodo deposit (a dataset or a software release) was listed as just its title,
  publisher, year, type and DOI — with **no authors at all**, so your own name
  never appeared. The creators are now read from DataCite and shown as an
  abbreviated author list (e.g. "Chrétien, B."), and when your ORCID is among them
  your name is highlighted like on any other work. Takes effect on your next re-sync.

- **Your name is now highlighted on ORCID-listed papers OpenAlex split across
  profiles.** OpenAlex sometimes attributes one of your papers to an orphan author
  profile (no ORCID, a different author id) — so even though the paper is yours
  (your ORCID record lists it), nothing on the authorship matched your identifier
  and your name wasn't bold. Ownership is still identifier-driven (your ORCID lists
  the DOI); we now fill in your name from your profile so it highlights across every
  output and the public page. Highlighting is also **case-insensitive** now, so a
  name stored with odd casing (e.g. "ChréTien") still matches. Takes effect on your
  next re-sync.

- **Your name is now highlighted on publications you add by DOI.** When you
  claimed a work whose record didn't carry your ORCID (so you picked yourself
  from the author list), your name wasn't bold/highlighted the way it is on
  auto-synced works — because only your full name was matched, while the citation
  style renders an abbreviated form (e.g. "Chrétien, B."). The claim flow now uses
  the same rich name variants (including your family name) as manual entries, so
  the highlight applies consistently across every export and the public page.

- **A long Positions/Education title no longer pushes its dates onto a separate
  line.** When a role or degree title was long enough to wrap, the date range
  dropped below it onto its own line; now the dates stay pinned to the top-right of
  the first line and the title wraps beneath them — the way a clean academic CV
  reads. (The parser-safe ATS template, with its inline dates, is unchanged.)

- **The research-summary block now has the same gap below it as every other
  section.** When placed in its own labelled block (above or below the sections),
  it sat flush against the next section's heading on templates that tuck their
  first section up (the Sidebar); it now keeps a full section-sized gap.

- **PDF export works again.** A Playwright dependency bump changed the bundled
  Chromium revision without updating the Docker runtime's Playwright base image, so
  the headless browser the PDF renderer launches no longer existed and every PDF
  export failed with "Export failed". The runtime base image is back in lockstep
  with the `playwright` package, and a CI check now fails the build if the two ever
  drift apart again.

- **The research-summary heading now matches your other section titles.** When you
  move the research-summary block to its own section ("top"/"bottom"), its heading is
  now rendered in the exact same font, size, weight, casing, colour and accent
  treatment as your real section titles (Publications, Education, …), on every
  template and every public-page style — instead of a plain mismatched heading.

- **The ORCID iD on your CV header now shows the green ORCID icon.** The dedicated
  "ORCID: …" line in the header gained the official green iD mark, matching the icons
  already shown for your other contact details and profile links. It's decorative
  (screen readers still read the "ORCID" label and the iD) and, like the other icons,
  omitted from the parser-safe ATS template.

- **Profile links are usable again — and the editor fields no longer collapse.** On a
  narrow profile panel the "label" and "URL" inputs in the Links editor shrank to a
  sliver next to the "Remove link" button, making a link effectively impossible to
  type. They now wrap onto their own rows with a sensible width.

- **A LinkedIn (or GitHub/ORCID/…) URL entered in the Website field now shows its
  brand icon and a clean label** (e.g. the LinkedIn mark + "LinkedIn") instead of a
  bare globe and the full URL — matching how profile links are already auto-detected.
  A generic website keeps the globe and its URL text.

- **Switching on open-access badges no longer silently adds a percentage to the top
  of your CV.** The per-publication "OA" badges and the header open-access share are
  now two separate switches, so choosing badges does exactly that — and nothing else.
  Already-published CVs are unaffected: the share keeps showing wherever it did until
  you change the setting. The new control is localized in all ten languages.

- **The chart's year labels now meet the contrast minimum.** The small year labels
  under the publications-per-year chart were a touch too light for WCAG AA; they are
  now darker.

- **The top-bar menus (Publish / Share / Account) now close when you click
  anywhere.** Clicking on the CV preview left a menu stubbornly open, because the
  preview is a self-contained frame whose clicks never reached the page that was
  listening for them — and the preview is the biggest, most natural place to
  click. Now a single invisible layer sits over the preview while a menu is open,
  so clicking it (or anywhere else, or pressing Escape, or the ✕) dismisses the
  menu cleanly. Only one menu is open at a time, switching between them is a
  single click, and the panels collapse toward the button they belong to.

- **Contrast and readability fixes across light, dark and the public-page styles
  (WCAG AA).** In dark mode, links and accent text were too faint to read (and the
  theme-toggle's own active state nearly vanished) — accent colours are now floored
  for dark surfaces, and the soft "hint"/badge callouts read as dark panels instead
  of bright lavender boxes. On the public-page showcase styles, several heading
  chips, section titles and links sat below AA (some white-on-pastel headings were
  nearly unreadable); those are darkened to clear the bar. The travelling Σ mascot
  is now visible on every skin (it was hard to see on the arcade and mesh looks),
  and in-text profile/contact/ID links keep a visible underline on screen and in
  the PDF, so a link is never signalled by colour alone.

- **The public CV reads well on a phone.** The header now stacks so your **name
  leads** instead of being squeezed beside your photo, and the page uses tighter
  margins on small screens. Charts and the publication trend now carry their data
  in text for screen-reader and touch users, the sections sit in a proper `main`
  landmark, and the co-authors block is a real heading.

- **Editor reliability & accessibility.** The "publish your page" prompt's button
  now actually opens the Publish menu and focuses the toggle (it previously did
  nothing); a publish failure shows a visible message rather than silently snapping
  the toggle back; the delete-account dialog can no longer lose keyboard focus mid-
  deletion; and small controls (colour swatches, the delete-preset ×, the theme
  toggle) meet the minimum touch-target size. Localized pages also declare their
  language for assistive tech.

- **Animated public-page styles keep the top of your Publications readable.** On
  the most motion-heavy living-page styles (Prism, Synthwave, Riso, Mesh and the
  others), the scroll “reveal” was applied to each whole section at once. On a tall
  section like Publications that meant its first entries stayed faded, dark or
  blurred while you were already reading them — and on Prism they scrolled under a
  see-through, blurred sticky heading you couldn’t read past, while Riso’s reveal
  scaled the whole block so Education and Publications overlapped. The reveal now
  animates each heading and entry on its own as it scrolls in (the same approach the
  Terminal style already used), so the page is just as lively but the top of every
  section is crisp and readable; Prism’s sticky heading is now opaque. Applies to
  the public page only — exports were never affected.

- **Better text contrast across the animated public-page styles.** A contrast pass
  over all nine styles fixed several spots where small secondary text (the footer
  provenance/licence/“made with” lines) sat below the WCAG AA readability threshold:
  the footer text was darkened on the light styles (Pop, Riso, Mesh) and lightened on
  the dark ones, and the translucent panels were made a little more opaque (Prism,
  Synthwave) — with Aura’s colour glow toned down — so text stays legible where the
  moving background is brightest. The styles look the same; the fine print is just
  easier to read. Public page only.

- **A light accent colour can no longer make your name or headings unreadable.**
  The accent colour picker has a free colour field, so it was possible to choose a
  pale colour (a bright yellow, a light cyan) that rendered the Modern template’s
  name, the Classic/Sidebar section headings, every link, and the Sidebar’s
  white-on-colour panel at far below a readable contrast. The accent is now floored
  to a readable contrast on white before it’s drawn — darkened just enough, keeping
  its hue — so the document stays legible (and prints legibly) whatever colour you
  pick. The six built-in accent swatches are already well above the floor and are
  unchanged.

- **Publication titles no longer show raw formatting tags like `<scp>`.** Some
  journals deposit a title with inline typographic markup — for example Wiley sets
  “VigiBase” in small caps as `<scp>VigiBase</scp>` — and that unsupported tag was
  leaking into the title on your CV (e.g. “…Analysis Using <scp>VigiBase</scp>”).
  Such tags are now removed when your CV is built, while genuine emphasis your
  citation style can render — italics, superscripts, subscripts (`<i>`, `<sup>`,
  `<sub>`) — is preserved. Takes effect on your next re-sync.

- **You can now add dates to a degree that ORCID listed without any.** Education
  entries (and positions) whose source carried no dates used to dead-end on a
  “Re-sync to edit dates” note — but re-syncing never helped when ORCID simply has
  no dates for that degree. The **start/end year** fields are now offered for any
  entry with a known institution, so you can fill a range in directly; an entry with
  no dates yet starts with an editable (not pre-“Ongoing”) end year. The re-sync note
  remains only for older entries that lack the structured institution needed to
  rebuild the line.

- **Your software and datasets no longer land in “Preprints.”** A Zenodo (or other
  repository) deposit — like a software release or a dataset — was being filed
  under Preprints, because OpenAlex tags everything from a repository as a preprint
  and has no “software” type. Such outputs now route to **Datasets & Software**,
  never Preprints — including software with no DataCite record (e.g. a **CRAN R
  package**, whose DOI lives at Crossref), which OpenAlex tags as a dataset and which
  now appears in Datasets & Software as a proper citation rather than in “Other
  Research Outputs.” ORCID-typed datasets and software land there too.
  When the same deposit is already listed in Datasets & Software (matched through
  your ORCID on DataCite), the duplicate OpenAlex copy is now dropped — even when
  Zenodo’s **concept DOI and version DOI differ**, which previously defeated the
  de-duplication and showed the work twice. We also now find your DataCite deposits
  whether your ORCID is recorded in its **bare** (`0000-…`) or full-URL form (Zenodo
  stores the bare form, so these were being missed entirely), and **collapse a
  deposit’s concept and version DOIs into a single entry** instead of listing every
  release. Every Datasets & Software entry now **shows its DOI** — a clickable link
  on the web (and the PDF), and the full `https://doi.org/…` in DOCX, LaTeX and
  Markdown — matching the citation-style entries already in the section.

- **The Role / title field accepts spaces.** Typing a multi-word role such as
  “Group Leader” works again — the field was wiping a trailing space on every
  keystroke, so you could never get past the first word.

- **A failed save or sync now reads as an error, not a success.** The editor’s
  status indicator showed the same neutral/green dot for “Saved.” and for
  “Sync failed.” — so a failure could be mistaken for success at a glance. The
  dot (and text) now turn **red** on failure and stay green on success.

- **A failed first sync no longer looks like “you have no publications.”** When the
  very first import from OpenAlex failed (a network hiccup, OpenAlex briefly down),
  the editor showed the same neutral “No CV yet” empty state as a genuinely empty
  profile, with the real error buried in a status line that vanished on refresh —
  so a brand-new user could think the tool simply found nothing for them. A failed
  sync now shows a distinct, clearly-worded **“We couldn’t reach OpenAlex”** state
  (reassuring them their account is fine) with a **Try again** button, separate from
  the empty state. Localized in all ten languages.

- **Dark-mode contrast in the editor.** A handful of editor controls (the
  save-status pill, source/“you” badges, hover states on icon and “mine”
  buttons, the section-toggle hover, the drag handle, scrollbar thumbs and the
  publish dot) used fixed grey values that didn’t invert in dark mode, so they
  showed light-on-dark — washed out or hard to read. They now use the same
  semantic surface/border/muted tokens as everything else, so they’re correct in
  dark mode and pixel-identical in light mode.

- **The ja-JP grants placeholder suggested a French funder** (ANR JCJC); each
  locale's example now names a familiar national funder (科研費, NSFC, DFG,
  NRF, CNPq, PRIN, AEI, РНФ, NIH; fr-FR keeps ANR).

- **PDF export failed in production** (`{"error":"Failed to generate export."}`)
  — the standalone (Docker) build's file trace dropped
  `playwright-core/browsers.json`, which Playwright loads via a dynamic require
  the tracer can't follow, so the PDF renderer could not even load `playwright`
  at runtime. The file is now pinned into the export route's
  `outputFileTracingIncludes`. Dev servers were unaffected (they resolve from
  the real `node_modules`), which is why the regression only showed up deployed.

- **Research consent re-consent is now enforced** — the consent gate that guards
  ALL research logging (off in production) now requires the user's stored
  `researchConsentVersion` to match the current `RESEARCH_CONSENT_VERSION`, not
  just a `true` flag. Previously, bumping the version (the documented step when
  re-enabling logging under a new IRB protocol) would NOT have forced re-consent:
  a user who agreed under the old terms would have been logged under the new ones.
  Stale consent no longer authorises logging (GDPR/APPI; IRB audit trail).

- **Atomic persistent rate limiter** — the Postgres-backed limiter
  (`RATE_LIMIT_PERSIST=true`) now opens each fixed window with a single atomic
  `INSERT … ON CONFLICT DO UPDATE` instead of a read-then-write. The previous
  read (`findUnique`) then write (`upsert`) had a TOCTOU gap where two concurrent
  first-requests could both observe "no row" and both open the window at count 1,
  letting one extra request past the cap at each window boundary. The in-memory
  limiter (single-instance default) was already race-free.

- **Publication / preprint links are now clickable and open in a new tab** —
  across the live preview, the public page and the PDF. citeproc emitted DOIs and
  URLs as plain text, so a reader couldn't follow a publication to its source; the
  citation engine now renders them as `<a>` links, every link in a rendered CV
  carries `target="_blank" rel="noopener noreferrer"`, and the preview iframe is
  allowed to open those links in a new tab (without re-enabling scripts on the
  sandboxed CV markup). Hand-built links (contact, website, ORCID, ROR, licence)
  open in a new tab too.

- **NIH iCite RCR now actually populates.** The iCite client read the value under
  `relative_citation_ratio`, but a field-filtered iCite response returns it under
  the short alias `rcr`, so the Relative Citation Ratio was never stored and "Mean
  RCR" always read "(no data)". The client now reads `rcr` (with a fallback to the
  long name). After a re-sync, biomedical works with a PMID carry their RCR.

- **The editor's metric picker shows the RCR value when present.** The picker read
  author-level `owner.metrics`, but the field-normalized means (RCR, FWCI mean,
  top-10% share) are recomputed over the curated works at render time and are not
  stored there — so "Mean RCR" read "(no data)" even when the CV rendered a value.
  The picker now derives the same curated figures the CV displays.

- **The "Responsible-metrics preset" now matches its label.** It promised
  "field-normalised indicators only" but selected the (non-normalized, IF-like)
  2-year mean citedness while omitting the field-normalized iCite RCR. It now
  selects exactly the field-normalized indicators (FWCI mean + RCR mean), derived
  from the single source of truth so it can't drift.

### Security

- **Public CV pages gain exactly one, hash-pinned inline script.** They remain
  strictly no-JS by default; the only script ever served is a bare
  `IntersectionObserver` (used by the Hanko brush-kanji headings to draw once on
  enter), permitted by
  an exact `script-src 'sha256-…'` of that script and nothing else — no
  `'unsafe-inline'`. Any injected or modified script has a different hash and stays
  blocked. The directive is emitted (in both the `<meta>` and HTTP-header CSP) only on
  pages that actually carry the trusted script, so every other style is still fully
  no-JS. A test re-derives the hash so the script can't drift from its CSP entry.

- **Credentials pasted into a profile link or website no longer leak into your CV.**
  If a URL with embedded `user:password@` userinfo was entered for your website or a
  profile link, that credential could show up in the visible contact line and in the
  plain Markdown / LaTeX / DOCX exports. The userinfo is now stripped from the
  displayed URL everywhere (the clickable link was already protected).

- **Defense-in-depth hardening on the public-page error responses.** A three-
  reviewer security pass found no exploitable issues, and closed a few hardening
  gaps: the styled 404 / 429 notice pages now carry the live page's anti-framing
  headers (`X-Frame-Options: DENY` + `frame-ancestors 'none'`); the OG-card 404
  picks up the `noindex` / `no-store` / `nosniff` / `no-referrer` headers it was
  missing; and the notice helper escapes its text for defense in depth.

- **Public `.json` data minimization** — the machine-readable public CV download
  (`/p/<slug>.json`) no longer carries fields it had no reason to expose: the
  embedded profile photo (a ~1 MB base64 headshot, dropped from the machine file
  even though the HTML page may still render it) and the resolved custom CSL XML
  blob are stripped; and the internal disambiguation/research signals on each
  work (`reviewFlag`, `duplicateOf`, `matchBasis`, `claimed`) plus the owner's
  `dismissedDuplicates` curation bookkeeping are stripped at the single public
  projection gate — these advisory hints (e.g. "this attribution is doubtful")
  were never on the rendered page and must not leak into a downloadable file.

- **DBLP PID allow-list** — the DBLP person id resolved from a SPARQL response is
  now shape-validated (`[A-Za-z0-9/_-]`, no `..`) before it is interpolated into
  the profile-fetch URL, so a malformed/hostile value can't add a query, fragment,
  or traversal segment that re-points the outbound request (defense-in-depth).

- **HSTS at the edge** — Caddy now sends `Strict-Transport-Security` on every
  response. The header was previously configured in `next.config.ts` but never
  emitted in the Docker deployment (its `AUTH_URL` condition is evaluated at
  build time, when the variable isn't set), so production served without HSTS.

- **No default Plausible DB password** — the optional analytics profile no
  longer falls back to `postgres` when `PLAUSIBLE_DB_PASSWORD` is unset; it now
  fails closed (Postgres refuses a blank password).

- **`nofollow ugc` on user-typed CV links** — the free-text website and profile
  links on a published CV no longer pass link equity (spam-CV SEO hardening);
  identifier-derived links (DOI, ORCID, ROR) are unchanged.

## [0.1.0] - 2026-06-08

Initial public release of SigmaCV — open infrastructure for responsible research
assessment that auto-generates academic CVs from open research data.

### Added

- CV auto-built from OpenAlex and ORCID (with Crossref, DataCite, ROR, Open Editors
  Plus and other open sources), assembled into a single canonical object.
- Identifier-driven self-name highlighting (matched by ORCID / OpenAlex ID, never by
  name string).
- Renderers for HTML, PDF, DOCX, LaTeX, Markdown, BibTeX, CSL-JSON, JSON Résumé, the
  NIH biosketch, and ERC / MSCA / NSF / JSPS grant CVs — all from one canonical source
  so citations are identical everywhere.
- Curation UI (remove "not mine", reorder, show / hide, rename), a 58-model CV-model
  catalog, and a living public page that re-syncs.
- FAIR public surface: schema.org JSON-LD, content negotiation (CSL-JSON / BibTeX),
  sitemap with hreflang, and opt-in field-normalized metrics (DORA-aligned).
- Privacy by design: per-field publish consent, data export, and account deletion
  (GDPR / Japan APPI); 10 UI locales; self-hostable via Docker Compose.

[Unreleased]: https://github.com/BasileChretien/sigmacv/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/BasileChretien/sigmacv/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/BasileChretien/sigmacv/releases/tag/v0.1.0
