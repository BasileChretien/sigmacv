# SigmaCV: open, FAIR infrastructure for generating academic CVs from open research data

> **DRAFT v0.1** — a first structured draft to build on, not a finished manuscript.
> Placeholders are marked `‹…›`. Fill in co-authors, the Zenodo DOI, and any
> concrete usage/adoption figures before submission. Candidate venues:
> *Quantitative Science Studies* (QSS), *Scientometrics*, *PeerJ Computer
> Science*, *SoftwareX*, or *Journal of Open Source Software* (JOSS, for a short
> software paper). This draft is written venue-agnostic and long-form; trim to
> the target venue.

## Authors

- **Basile Chrétien** ¹ ² — PharmD, MSc, MPH — ORCID 0000-0002-7483-2489
  (corresponding: chretien.basile.jean.bernard.u4@s.mail.nagoya-u.ac.jp)
- ‹co-authors, if any›

¹ Department of International Medical Education, Nagoya University Graduate School
of Medicine, Nagoya, Japan.
² Neuropresage Team, Normandie University, UNICAEN, INSERM, UMR-S U1237 (PhIND),
GIP Cyceron, 14000 Caen, France.

## Abstract

Curricula vitae (CVs) are central to hiring, promotion, and grant evaluation, yet
researchers maintain them by hand, re-formatting the same publication list for
each funder and template, and the resulting documents are neither machine-readable
nor reproducible. At the same time, the research-assessment community
(DORA, CoARA, the Leiden Manifesto) is moving away from journal-level proxies and
toward narrative, contribution-focused evaluation. We present **SigmaCV**, an
open-source web application that automatically assembles a clean, customizable
academic CV from open research data (OpenAlex, ORCID, Crossref, ROR, DataCite) and
renders it to many formats from a single source of truth. SigmaCV is designed as
**open, FAIR infrastructure for responsible research assessment** rather than a
consumer product: the account holder is identified by persistent identifier
(ORCID / OpenAlex ID) and *never* by name string; every record carries provenance;
metrics are opt-in, default-none, and field-normalized; and a published CV is a
machine-readable artifact (schema.org JSON-LD, content-negotiated CSL-JSON and
BibTeX) under an author-chosen reuse license. The tool natively supports the
emerging **narrative-CV** formats (UKRI Résumé for Research and Innovation; the
Royal Society Résumé for Researchers) as first-class prose sections, and a
catalog of one-click, reversible structured layouts for grant calls (ERC, MSCA,
NIH/NSF, JSPS/KAKENHI, …), public institutions, and industry/clinical CVs. SigmaCV is also a **research
vehicle**: with explicit, IRB-governed consent it records author-disambiguation
corrections and self-presentation choices to support two pre-registered
observational studies. The system is Apache-2.0 licensed, self-hostable via Docker
Compose, and privacy-first (GDPR / Japan APPI: per-field publish consent, data
export, account deletion). We describe the architecture, the FAIR and
responsible-assessment design decisions, and the privacy/ethics model, and we
discuss limitations and a roadmap that includes pushing curation corrections back
to the open scholarly graph.

**Keywords:** academic CV; curriculum vitae; research assessment; responsible
metrics; FAIR; open infrastructure; ORCID; OpenAlex; author disambiguation;
narrative CV; bibliometrics; CSL.

## 1. Introduction

Academic careers run on the CV, but producing one is repetitive, error-prone, and
duplicative. A researcher's publication list already exists, in structured form,
in open bibliographic databases — yet most CVs are hand-maintained word-processor
documents that drift out of date, must be re-formatted per funder template, and
are opaque to machines. Meanwhile, two pressures are reshaping how scholarly
records are assessed. First, **responsible research assessment** — articulated by
the San Francisco Declaration on Research Assessment (DORA), the Leiden Manifesto,
and the Coalition for Advancing Research Assessment (CoARA) — argues against
journal-level proxies (e.g., the Journal Impact Factor) and for field-normalized
indicators and qualitative, contribution-focused evaluation. Funders are
operationalizing this through **narrative CVs** (UKRI's Résumé for Research and
Innovation; the Royal Society's Résumé for Researchers; analogous formats at the
Swiss National Science Foundation and the Dutch Research Council). Second, the
**open-metadata ecosystem** has matured: OpenAlex provides a fully open index of
works, authors, and institutions; ORCID provides persistent author identifiers;
ROR identifies institutions; Crossref and DataCite provide DOIs for articles and
data.

These pressures motivate a tool that (i) builds an accurate CV from open data with
minimal effort, (ii) is itself open and FAIR rather than an extractive data silo,
and (iii) embodies responsible-assessment principles by construction.

**Contributions.** We present SigmaCV and make the following contributions:

1. An architecture in which a single **canonical CV object** (a versioned,
   validated JSON document combining curated data and display choices) is the sole
   source of truth, and every output format — HTML, PDF, DOCX, LaTeX, Markdown,
   BibTeX, CSL-JSON, JSON Résumé, and funder-structured drafts — is a pure function
   of it, so citations and content are identical across formats.
2. **Identifier-driven self-attribution and name highlighting**: the account
   holder is matched to authorships by ORCID / OpenAlex identifier, never by name
   string, which avoids the systematic errors of name matching for common names
   and non-Latin scripts.
3. A **FAIR-by-design public surface**: published CVs are machine-readable
   (schema.org `Person`/`ProfilePage` JSON-LD, content-negotiated CSL-JSON and
   BibTeX), carry provenance and an author-chosen reuse license, and are governed
   by per-field publish consent.
4. Native support for **responsible-assessment outputs**: opt-in, default-none,
   field-normalized metrics; narrative-CV prose sections; and a catalog of
   one-click, reversible CV-model layouts for grant funders, public institutions,
   and industry/clinical roles.
5. A **consent-gated research-vehicle design** that turns routine use (mine/not-mine
   corrections; CV-composition choices) into data for two pre-registered,
   IRB-governed observational studies, while defaulting all logging off.

## 2. Background and related work

**Researcher profile systems.** ORCID provides identifiers and a basic record;
Google Scholar, ResearchGate, and Academia.edu provide profiles but are closed,
often extractive, and not designed around reproducible, machine-readable output.
Reference managers (Zotero, Mendeley) and LaTeX packages (e.g., `moderncv`,
`europecv`) help typeset CVs but do not assemble them from open data. SigmaCV
differs in being open-source, non-extractive, identifier-driven, and FAIR-first,
and in deriving every format from one canonical object.

**Open scholarly metadata.** OpenAlex offers an open, queryable index that makes
automated CV assembly feasible without proprietary databases; ORCID supplies the
persistent identifier that anchors correct self-attribution; ROR canonicalizes
institutions; Crossref and DataCite resolve DOIs. SigmaCV is a *consumer* of this
commons and is designed to eventually *contribute back* (Section 6.3).

**Citation rendering.** SigmaCV uses the Citation Style Language (CSL) via
`citeproc-js` with the community CSL styles, so a single style choice applies
identically across every output — a property that hand-maintained CVs lack.

**Responsible assessment and narrative CVs.** DORA, the Leiden Manifesto, and
CoARA call for assessment that avoids journal-level proxies and values a broader
range of contributions; narrative-CV frameworks operationalize this. SigmaCV
encodes these as defaults (metrics off; field-normalized preferred) and as
first-class features (narrative prose sections; the CV-model catalog).

## 3. Design principles and architecture

SigmaCV is built around four load-bearing principles.

**(P1) One canonical object; many renderers.** A `CanonicalCv` is a single,
schema-versioned, Zod-validated JSON document = curated data + the user's display
choices. Every renderer (HTML/PDF/DOCX/LaTeX/Markdown/BibTeX/CSL-JSON/JSON
Résumé/funder drafts) is a pure function of this object; there are no per-format
data pipelines. This guarantees that what the user curates once appears
consistently everywhere, and that citations — produced only through CSL/citeproc —
are byte-identical across formats.

**(P2) Identifier-driven, never name-based.** Self-attribution (`authoredBySelf`)
and self-name highlighting are computed by matching the account holder's ORCID and
OpenAlex author identifiers against each work's authorships; the matched name *as
printed on that work* is captured for highlighting. Name strings are never used to
decide ownership, eliminating a major source of disambiguation error for common
names and CJK scripts and making the highlight robust across name variants.

**(P3) Curation as immutable, reversible operations.** Curation ("not mine",
reorder, show/hide, rename, style) is a set of pure functions that return new
objects. "Not mine" *hides* a work and records a structured reason; it never
deletes it, preserving the correction signal for research (Section 7) and for a
future upstream push (Section 6.3).

**(P4) FAIR and privacy by construction.** Provenance is attached to every record
(source, match basis, sync timestamps); public output passes through a single
consent-gating projection; metrics are opt-in and default-none. These are
architectural invariants, not configuration.

**System overview.** SigmaCV is a Next.js (App Router) + TypeScript application
with a PostgreSQL/Prisma datastore and Auth.js authentication (ORCID OIDC, Google,
and passwordless email). External clients for OpenAlex, ORCID, Crossref, ROR,
DataCite, and Open Editors Plus each use a polite-pool contact and a shared,
rate-limited fetch wrapper. PDF rendering is performed by printing the HTML
template through headless Chromium (Playwright). The whole stack is packaged for a
single-VPS deployment via Docker Compose (application + Postgres + Caddy for
automatic TLS).

## 4. Implementation

**Data assembly.** On first sign-in, SigmaCV resolves the user's OpenAlex author
identifier(s) from their ORCID iD, pulls their works, and assembles the canonical
object. ORCID's public API contributes positions, education, awards, service,
peer-review, and funding; Crossref gap-fills bibliographic metadata; ROR
canonicalizes institutional affiliations (and now records the ROR identifier);
DataCite contributes datasets and software. All external calls are unit-tested
against mocked responses, so the build is deterministic and offline-testable.

**Rendering and citations.** Output formats derive from the canonical object via a
single `Renderer` interface. Citations are produced once, through CSL/citeproc,
from vendored CSL styles and locales, ensuring identical formatting across HTML,
PDF, DOCX, LaTeX, Markdown, BibTeX, and CSL-JSON.

**Internationalization.** The interface and rendered strings are available in ten
locales (en, zh, es, fr, de, ja, pt, it, ko, ru); the string tables are typed so
that adding a key forces a value in every locale at compile time.

## 5. Features

- **Curate.** Remove misattributed works ("not mine" with a reason), reorder,
  choose and rename sections; "selected publications" limits for two-page CVs.
- **Style.** Choose a CSL citation style; identifier-driven self-name highlight;
  templates and constrained customization (accent colour, fonts, density).
- **Export.** PDF, DOCX, LaTeX, Markdown, BibTeX, CSL-JSON, JSON Résumé, and
  funder-structured Markdown drafts (NIH biosketch; ERC; MSCA; NSF; JSPS/KAKENHI).
- **Publish.** A *living* public page that re-syncs from open sources; it is
  machine-readable (schema.org JSON-LD; content-negotiated CSL-JSON / BibTeX /
  JSON) and indexable only on explicit opt-in.
- **Narrative / prose sections.** The R4RI / Royal Society contribution modules
  (contributions to the generation of knowledge; to the development of
  individuals; to the wider research community; to broader society) plus a generic
  statement are first-class **prose sections** — a heading and free-text body —
  added from the ordinary "Add a section" menu and managed like any other section
  (reorder, show/hide, rename); the top Summary is the personal statement. Their
  user-supplied body is escaped/safe-transformed by every renderer.
- **CV-model catalog.** A catalog of one-click, reversible layouts that
  reconfigure the canonical CV (selecting, ordering, and re-titling sections —
  never deleting curated data) to the structure expected by a given call or
  employer. It spans three categories: grant funders worldwide (ERC, MSCA,
  Horizon, DFG, SNSF, NWO, ANR, Wellcome, UKRI R4RI, Royal Society, NIH, NSF,
  JSPS/KAKENHI, AMED, NSFC, …), public-institution / job CVs (Europass, US/UK/DE
  academic, the Japanese rirekisho and shokumu-keirekisho, UN P.11), and
  industry / clinical CVs (ICH-GCP investigator CV for clinical trials / FDA Form
  1572, biotech R&D résumé, physician CV, Medical Affairs). A clear caveat notes
  that final submission for many funders goes through each funder's own portal.
- **Opt-in metrics.** Default none; when shown, field-normalized indicators (mean
  field-weighted citation impact, top-percentile share) are preferred over the
  h-index, consistent with DORA.

## 6. FAIR and responsible-assessment alignment

### 6.1 FAIR

- **Findable.** Records resolve by persistent identifier (ORCID/OpenAlex); public
  pages carry schema.org JSON-LD and appear in a sitemap with `hreflang`
  alternates (opt-in); the software itself is citable (CITATION.cff, codemeta.json,
  a Zenodo release DOI ‹DOI›).
- **Accessible.** Public CVs are served over open HTTP and content-negotiate
  machine-readable representations; users can export their full account and delete
  it; the stack is self-hostable.
- **Interoperable.** Every output derives from one object; citations use CSL;
  identifiers (ORCID, OpenAlex, DOI, ROR) and exchange formats (CSL-JSON, JSON
  Résumé, BibTeX) are standard.
- **Reusable.** Each record carries provenance and a match basis; published CVs can
  declare a reuse license (e.g., CC0 / CC BY); the code is Apache-2.0 with versioned
  releases (FAIR4RS).

### 6.2 Responsible assessment

Metrics default to none and prefer field-normalized indicators over journal-level
proxies; self-attribution is identifier-driven; narrative prose sections and the CV-model
catalog make contribution-focused, funder-aligned CVs first-class. These choices
operationalize DORA/CoARA at the level of the tool's defaults.

### 6.3 Giving back to the commons (planned)

Because "not mine" corrections are preserved with their match basis and reason,
they constitute high-quality author-disambiguation signal. A planned, opt-in,
audited mechanism will push these corrections upstream to OpenAlex's curation
interface, so routine CV curation *improves the shared scholarly graph* rather than
only consuming it. This capability is gated off by default pending confirmation of
the upstream API and ethics review.

## 7. Privacy, consent, and the research-vehicle design

SigmaCV is, by intent, infrastructure for three studies: (1) this
tool/infrastructure paper; (2) an author-disambiguation-error study built from
users' mine/not-mine corrections (stratified by the identifier match basis and a
build-computed review flag); and (3) a self-presentation / metric-norms study
built from CV-composition choices.

Personal data is handled under the EU GDPR and Japan's APPI: **data minimization,
per-field publish consent, full data export, and account deletion**. All research
logging is **off by default** behind a single master switch and is shown only to
users who give explicit, versioned research consent; withdrawal erases previously
collected events. The de-identified research export pseudonymizes subjects with a
keyed HMAC, emits only pre-registered event types, and produces the
re-identification key table separately, held by a designated personal-information
manager and never given to the analyst. Confirmatory analyses are pre-registered.
No confirmatory analysis runs before its plan is registered and the relevant IRB
approval is recorded.

## 8. Quality assurance and verification

SigmaCV is developed with a comprehensive automated test suite (≈‹N› unit and
integration tests with an enforced coverage gate on the domain layer, plus
end-to-end browser journeys covering authentication, curation, export, publishing,
CV-model application, and the machine-readable public formats). The codebase
underwent multiple security reviews focused on consent-gating, output escaping
(JSON-LD/HTML/BibTeX), the machine-readable public API, and the (default-off)
upstream-curation client; the production container is non-root with dropped
capabilities and an unpublished database. The Docker deployment has been verified
end-to-end (image build → database migration → DB-backed routes serving). ‹A user
study / adoption analysis is future work — add figures once available.›

## 9. Limitations and future work

- Accurate assembly depends on the completeness of open sources (OpenAlex/ORCID);
  works missing or misattributed upstream require manual correction (which the tool
  captures and will push back).
- Funder-structured exports are faithful *drafts*; final submission uses each
  funder's own system (e.g., SciENcv for NIH/NSF; the EU Funding & Tenders portal;
  e-Rad/researchmap for KAKENHI). Pixel-exact replicas of official templates are
  intentionally out of scope.
- Non-English narrative and interface copy benefit from native-speaker review.
- Planned: upstream curation push; richer identifier coverage (Funder Registry,
  CRediT); additional templates; an adoption/usage evaluation.

## 10. Availability and reproducibility

- **Source:** ‹https://github.com/BasileChretien/sigmacv› — Apache-2.0.
- **Archive / DOI:** Zenodo ‹DOI on first tagged release›.
- **Cite:** see `CITATION.cff`; machine-readable metadata in `codemeta.json`.
- **Run it:** self-hostable via Docker Compose on a single VPS (see `DEPLOY.md`);
  no dependency on a hosted instance.
- **Data sources:** OpenAlex, ORCID (public API), Crossref, ROR, DataCite, Open
  Editors Plus — all open and accessed via polite-pool contacts.

## 11. Conclusion

SigmaCV shows that an everyday researcher tool — a CV generator — can be built as
open, FAIR infrastructure that advances responsible research assessment rather than
working against it. By deriving every output from a single canonical object,
attributing authorship by identifier rather than name, defaulting metrics off and
field-normalized, making published CVs machine-readable and licensable, and turning
routine curation into consented research signal (and, soon, into corrections that
improve the shared scholarly graph), SigmaCV aligns a useful tool with the goals of
the open-science and assessment-reform communities.

---

### Acknowledgements
‹advisors, institutions, funders›

### Author contributions (CRediT)
B.C.: conceptualization, software, methodology, writing — original draft. ‹others›

### Competing interests
‹none / declare›

### Data availability
This paper describes software; no human-subject data is reported. Source code and
metadata are available as in Section 10. The consent-gated research datasets
(studies 2–3) are governed separately under their IRB protocol and pre-registration.

### References (to be formatted to the target venue)
1. Declaration on Research Assessment (DORA). https://sfdora.org/
2. Coalition for Advancing Research Assessment (CoARA). https://coara.eu/
3. Hicks D., Wouters P., Waltman L., de Rijcke S., Rafols I. The Leiden Manifesto for research metrics. *Nature* 520, 429–431 (2015).
4. Priem J., Piwowar H., Orr R. OpenAlex: a fully-open index of scholarly works, authors, venues, institutions, and concepts. arXiv:2205.01833 (2022).
5. ORCID. https://orcid.org/
6. Research Organization Registry (ROR). https://ror.org/
7. Crossref. https://www.crossref.org/ ; DataCite. https://datacite.org/
8. Citation Style Language (CSL). https://citationstyles.org/
9. Wilkinson M. et al. The FAIR Guiding Principles for scientific data management and stewardship. *Scientific Data* 3, 160018 (2016).
10. Barker M. et al. Introducing the FAIR Principles for research software (FAIR4RS). *Scientific Data* 9, 622 (2022).
11. UK Research and Innovation. Résumé for Research and Innovation (R4RI).
12. Royal Society. Résumé for Researchers.
13. ‹add: relevant author-disambiguation, self-presentation, and CV-tool references›
