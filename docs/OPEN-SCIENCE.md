# Open science & FAIR statement

SigmaCV is built as **open infrastructure for responsible research assessment**,
not just a CV utility. This document states how the project realizes the
[FAIR principles](https://www.go-fair.org/fair-principles/) — for the **CVs it
produces** (data) and for **SigmaCV itself** (research software, per
[FAIR4RS](https://doi.org/10.15497/RDA00068)) — and how it aligns with reform
initiatives such as [DORA](https://sfdora.org/) and
[CoARA](https://coara.eu/).

This is a living document. Items marked _planned_ are tracked in the
[open-science roadmap](OPEN-SCIENCE-ROADMAP.md).

## Principles in practice

### Findable

- Every CV derives from a single **canonical object** with a stable identity and
  a pinned `schemaVersion`.
- Published public pages (`/p/<slug>`) carry **schema.org `Person` / `ProfilePage`
  JSON-LD** and are listed in a `sitemap.xml` with `hreflang` alternates — but
  only when the owner explicitly opts a page into indexing (privacy by default).
- The account holder is identified by **persistent identifier (ORCID, OpenAlex),
  never a name string**, so records resolve unambiguously.
- SigmaCV itself is citable: see [`CITATION.cff`](../CITATION.cff),
  [`codemeta.json`](../codemeta.json), and a release DOI via Zenodo (_planned_).

### Accessible

- Public CVs are served over open HTTP and are **machine-readable**: the public
  page negotiates `application/ld+json`, CSL-JSON, and BibTeX in addition to HTML
  (_planned_), so any tool can retrieve a published record.
- Owners can **export their full account** (canonical CV + research log) and
  **delete their account** at any time (GDPR / Japan APPI).
- The source is open (Apache-2.0) and the whole stack is **self-hostable** with
  Docker Compose — no dependency on a single hosted instance.

### Interoperable

- All outputs derive from the canonical object via one `Renderer` interface — no
  per-format pipelines — and **citations come only from CSL/citeproc**, so they
  are identical across HTML, PDF, DOCX, LaTeX, Markdown, and BibTeX.
- The project uses **standard vocabularies and persistent identifiers**: ORCID,
  OpenAlex IDs, DOIs, ROR for institutions, with CSL-JSON / JSON Résumé /
  funder-CV exports and richer identifier coverage (PMID, Funder Registry,
  CRediT) _planned_.
- The **canonical CV JSON Schema is published** as a versioned, documented
  artifact so other tools can adopt it (_planned_).

### Reusable

- Each work records its **provenance** — which source it came from
  (OpenAlex / ORCID / Crossref / DataCite / ROR / manual), how the self-match was
  made, and whether metadata was gap-filled — plus CV-level generation and
  last-synced timestamps.
- Owners can attach a **reuse license** (e.g. CC0 or CC BY) to a published CV
  (_planned_), declared in both the human page and its structured data.
- The code carries a clear license ([Apache-2.0](../LICENSE)), machine-readable
  metadata, and versioned releases.

## Responsible research assessment

- **Metrics are opt-in and default to none.** When shown, field-normalized
  measures are preferred over the h-index, consistent with the **DORA** position
  that research should be assessed on its own merits rather than journal-based
  proxies.
- **Self-name highlighting and ownership are identifier-driven**, reducing the
  name-based errors that distort author-level metrics.
- **Narrative and funder-aligned CVs are first-class.** The R4RI / Royal-Society
  contribution modules (knowledge, individuals, community, society) are ordinary
  free-text **prose sections**, and a 58-model **CV-model catalog** offers
  one-click, reversible layouts for grant funders (incl. the DORA-aligned
  narrative formats: UKRI R4RI, Royal Society, SNSF, NWO, Wellcome), public
  institutions / jobs, and industry/clinical CVs — making contribution-focused
  assessment the easy path.
- **"Not mine" corrections are preserved**, not deleted, and (with consent) can
  flow back to improve the shared scholarly record (_planned, v2_) — the tool
  gives back to the commons rather than only consuming it.

## Standards & principles we align with

SigmaCV is built on, and helps put into practice, the open-science and
responsible-assessment frameworks below. A public, plain-language version of this
list lives at **[/principles](https://sigmacv.org/principles)**.

- **[Barcelona Declaration on Open Research Information](https://barcelona-declaration.org/)
  (2024)** — SigmaCV runs entirely on open research information (OpenAlex, ORCID,
  Crossref, DataCite) and publishes every CV as open, machine-readable metadata —
  the openness the Declaration champions.
- **[DORA](https://sfdora.org/)** — research is assessed on its own merits:
  metrics are opt-in and default to none, and field-normalized measures are
  preferred over journal-based proxies such as the Journal Impact Factor.
- **[CoARA](https://coara.eu/)** — narrative and contribution-focused CVs are
  first-class (UKRI R4RI, Royal Society, SNSF, NWO, Wellcome), supporting the move
  to qualitative, responsible assessment.
- **[Leiden Manifesto](https://doi.org/10.1038/520429a)** — quantitative
  indicators stay optional and contextual, supporting expert judgement rather than
  replacing it.
- **[Hong Kong Principles](https://doi.org/10.1371/journal.pbio.3000737)** — open
  access, open data and code, and (where available) retraction status are surfaced,
  rewarding the transparency and reliability the Principles promote.
- **[The Metric Tide](https://doi.org/10.13140/RG.2.1.4929.1363)** — when metrics
  appear they carry their provenance and limitations, reflecting the dimensions of
  responsible metrics: robustness, humility, transparency, diversity, reflexivity.
- **[FAIR](https://www.go-fair.org/fair-principles/) &
  [FAIR4RS](https://doi.org/10.15497/RDA00068)** — the CVs are Findable, Accessible,
  Interoperable and Reusable (persistent identifiers, schema.org, content-negotiated
  machine formats), and SigmaCV itself follows FAIR for Research Software.

## Privacy, consent & research ethics

- Personal data is handled under **GDPR and Japan APPI**: data minimization,
  **per-field publish consent**, account export, and account deletion.
- SigmaCV doubles as a **research vehicle** (tool/infrastructure, author-
  disambiguation-error, and self-presentation studies). All research logging is
  **consent-gated and off by default**, governed by an IRB protocol (internal);
  confirmatory analyses are pre-registered
  ([`docs/preregistration/`](preregistration/README.md)).

## How to engage

- Cite SigmaCV using [`CITATION.cff`](../CITATION.cff).
- Self-host your own instance — see [`DEPLOY.md`](../DEPLOY.md).
- Contribute — see [`CONTRIBUTING.md`](../CONTRIBUTING.md) and
  [`CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md).
