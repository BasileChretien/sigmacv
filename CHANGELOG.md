# Changelog

All notable changes to SigmaCV are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Notification email for digests (double opt-in).** ORCID sign-in rarely
  provides an email address, so opted-in users often had nowhere to receive
  the re-sync digest. Turning on "Email updates" now reveals an address field:
  the entered address is stored pending and gets a confirmation link (signed,
  expiring token); only a confirmed address is ever used, with the login email
  as fallback. Included in the account data export; the digest run reports
  addressless opt-ins (`noAddress`).

### Changed

- **Registration is ORCID-only by default again.** Configuring SMTP
  (`EMAIL_SERVER`/`EMAIL_FROM`) no longer auto-enables magic-link email
  sign-in — SMTP alone now powers only the opt-in digest mailer. Email login
  is a separate, explicit `EMAIL_LOGIN_ENABLED="true"` opt-in.

### Added

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

### Changed

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

### Fixed

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

### Security

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

### Changed

- **Institution links open the institution's website** — on Positions and
  Education entries the institution name now links to its own homepage when ROR
  records one (from ROR's `links[].website`), instead of the ROR registry page.
  The ROR record stays reachable as the persistent identifier: it is the fallback
  when ROR has no website on file, and the small trailing "ROR" link shown when
  the institution name was edited out of the line.

### Fixed

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

### Added

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

- Per-work **open-access badges are now opt-in** (default off), consistent with the
  metrics-default-none, DORA-aligned stance.

### Fixed

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

[Unreleased]: https://github.com/BasileChretien/sigmacv/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/BasileChretien/sigmacv/releases/tag/v0.1.0
