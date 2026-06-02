# CLAUDE.md

## Project: SigmaCV
Open-source web app that auto-generates clean, customizable academic CVs from open research data (OpenAlex, ORCID, Crossref, Open Editors Plus). Free for individuals. *(Working name; ties to the Sigma-Score bibliometric index — may be renamed.)*

## Why this exists (context, not feature scope)
Beyond a useful tool, this is open infrastructure for **responsible research assessment** and a **research vehicle**. It should support three papers: (1) a tool/infrastructure paper; (2) an author-disambiguation-error study built from user "mine/not-mine" corrections; (3) a self-presentation / metric-norms study built from CV-composition choices. Design decisions should keep that data available (with consent). Do not optimize for raw consumer growth at the expense of these.

## What it does (user flow)
ORCID / Google / email login → CV auto-populated from open sources → **curate** (remove "not mine", reorder, choose sections) → **style** (CSL citation style, self-name highlight, optional metrics, template) → **export** (PDF / DOCX / LaTeX / Markdown) or **publish** a living public page that re-syncs.

## Architecture (load-bearing — do not deviate without discussion)
- **Canonical CV object**: one structured JSON document = curated data + display choices. Single source of truth.
- **Renderers**: HTML / PDF / DOCX / LaTeX / Markdown all derive from the canonical object. No per-format pipelines.
- **Citations**: CSL via `citeproc-js`, using the CSL styles repo. Identical across every output.
- **Name highlighting**: match the account holder by **author identifier (ORCID / OpenAlex ID), never by name string**.

## Stack
Next.js + TypeScript · PostgreSQL + Prisma · Auth.js (ORCID/Google/email) · `citeproc-js` · Playwright (HTML→PDF) · `docx` lib · `.bib`+`.tex` for LaTeX · Markdown + YAML frontmatter. Deploy: single EU Hetzner VPS, Docker Compose (app + Postgres + Caddy + render worker).

## External data sources & constraints
- **OpenAlex API** — free; `mailto` polite pool; publications, metrics, grant fields.
- **ORCID public API** — free, non-commercial; OAuth for authenticated iD + public data. *(Member API / write = deferred, paid.)*
- **Crossref** — metadata gaps; Grant Linking System for grant DOIs (later).
- **Open Editors Plus** — editorial roles (owner's dataset).

## Curation model
- **Display curation** (what shows on the CV) = free, local, all the MVP needs.
- **Upstream assertion** (push "not mine" to OpenAlex) = v2; rides OpenAlex's curation API. NOT in MVP.

## Metrics
Opt-in, user-chosen, **default none**. Prefer field-normalized over h-index. Sigma-Score is one optional metric.

## Privacy & ethics (mandatory)
Personal data under GDPR + Japan APPI. Data minimization; per-field publish consent; account deletion + data export. Research logging only behind explicit consent, under IRB; pre-register confirmatory analyses.

## Scope
- **MVP slice**: ORCID login → OpenAlex pull → canonical object → one HTML template (CSL + name highlight) → PDF export → curation UI.
- **Then**: more templates + constrained customization · other export formats · living public page · OEP roles · opt-in metrics · consent + logging · OpenAlex grant fields.
- **Deferred**: institutional API · upstream corrections · ORCID write · national grant-API federation · payments.

## Working conventions
Open-source (permissive license). Secrets in env only. Define and freeze the **canonical CV schema** and the **renderer interface** early — everything depends on them. Build the MVP vertical slice end-to-end before broadening.
