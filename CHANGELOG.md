# Changelog

All notable changes to SigmaCV are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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

### Changed

- Per-work **open-access badges are now opt-in** (default off), consistent with the
  metrics-default-none, DORA-aligned stance.

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
