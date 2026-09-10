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
- Published, **search-indexable** CVs are also harvestable over **OAI-PMH**
  (`/api/oai`) in two metadata formats: Dublin Core (`oai_dc`) and the
  **OpenAIRE Guidelines for Literature Repositories v4** (`oaire`), one record
  per CV plus one per work the public page lists (the page's own selection,
  minus retracted works), so open repositories, CRIS systems and aggregators
  can collect the open record. The `oaire` format is the identifier-keyed one:
  each work carries the owner's ORCID on their own author entry (located by the
  identifier-derived author position, never by name — co-authors are names
  only), the DOI, a COAR access right derived honestly from the stored
  open-access determination ("open access" when an open copy is indexed,
  "metadata only access" when none is, omitted when undetermined — never a
  compliance verdict), a COAR resource type, the reuse licence when a known
  Creative Commons licence is recorded, and a link to the CV page (a work
  without a DOI is identified by its own entry's URL on that page); the
  CV-level record names the self-declared current affiliation (as a plain
  name — the ROR identifier is what the set is keyed on) **only when the owner
  also opted into "list under my current affiliation"**, the same consent that
  gates the sets below; an indexable CV without that opt-in is harvested with
  no institution attached. Nothing in either format goes beyond what the
  public page and its `.json` already expose. The consent model
  is explicit and layered: nothing is harvestable without the owner's indexing
  opt-in, whose consent copy names the endpoint; and the `ror:<id>` **sets**
  (one per institution) contain only CVs whose owner _separately_ opted into
  "list under my current affiliation" — each set is labelled as a
  self-declared current affiliation, never as an institution's record of its
  output. The privacy notice names OAI-PMH harvesters as recipients.
- **Institution pages and the comparison view** (`/i/<ror>`, `/i/compare`) show
  open-access counts and their stated shares — for one organisation, or for two
  or three a reader chooses, in alphabetical order, with denominators, refresh
  dates and the method on the page — a self-monitoring aid in the spirit of the
  Baromètre de la Science Ouverte, never a ranking, composite or league table.
  The comparison is also served as counts-only JSON under CC0 (`/i/compare.json`),
  with a citation request and the method version in the envelope.
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
- The **canonical CV JSON Schema is published** as a versioned, self-contained
  artifact at [`/schema/cv/v2.json`](https://sigmacv.org/schema/cv/v2.json) (derived
  from the source-of-truth Zod schema) so other tools can validate and adopt the
  format.

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
- SigmaCV also includes **consent-gated research logging**, off by default and
  governed by an IRB protocol (internal). Any confirmatory analysis is
  pre-registered and runs only after ethics approval.

## How to engage

- Cite SigmaCV using [`CITATION.cff`](../CITATION.cff).
- Self-host your own instance — see [`DEPLOY.md`](../DEPLOY.md).
- Contribute — see [`CONTRIBUTING.md`](../CONTRIBUTING.md) and
  [`CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md).
