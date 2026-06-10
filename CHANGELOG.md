# Changelog

All notable changes to SigmaCV are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **"Who it's for" section on the homepage** (10 languages) — four audience cards
  (students & grad-school applicants, PhD students & postdocs, faculty &
  principal investigators, and clinicians / librarians / research offices) make it
  immediately clear who SigmaCV serves. Non-English copy is an initial translation
  pending native-speaker review.
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
