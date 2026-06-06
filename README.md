# SigmaCV

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)
[![Open science: FAIR](https://img.shields.io/badge/open%20science-FAIR-2ea44f.svg)](docs/OPEN-SCIENCE.md)
[![Cite this repository](https://img.shields.io/badge/cite-CITATION.cff-informational.svg)](CITATION.cff)

Auto-generate clean, customizable **academic CVs** from open research data
(OpenAlex, ORCID). Log in, see your publications auto-populated, curate them
("not mine", reorder, choose sections), style them (citation style, self-name
highlighting), and export to PDF — all derived from a single **canonical CV
object** so every output is consistent.

> Working name; ties to the Sigma-Score bibliometric index. Open infrastructure
> for responsible research assessment — see [`CLAUDE.md`](CLAUDE.md) for the
> full project context.

## MVP status

This repository currently implements the **MVP vertical slice**:

1. Repo + Docker Compose scaffold (app · Postgres · Caddy)
2. **ORCID OAuth** login (Auth.js v5; sandbox by default)
3. Resolve the user's **OpenAlex author ID(s)** from their ORCID iD and pull works
4. The **canonical CV object** schema (single source of truth)
5. One clean **HTML template** with **CSL citations** (`citeproc-js`) and
   **identifier-driven self-name highlighting**
6. **PDF export** (Playwright / headless Chromium)
7. **Curation UI** — "not mine", reorder, section show/hide & rename, CSL style

### Also implemented (post-slice)

- **Four templates + constrained customization** — `classic`, `modern`,
  `minimal`, `compact` (two-column), plus accent colour, font pairing (serif /
  sans / Palatino), and density.
- **Multi-format export** — DOCX, LaTeX (`.tex`), and Markdown (YAML
  frontmatter, Hugo-compatible) in addition to PDF, all from the same canonical
  object and citeproc output so citations are identical everywhere.
- **"Not mine" vs "Hide"** — display hiding is distinct from a disambiguation
  assertion. "Not mine" persists in the canonical object, is logged as a
  distinct `disambiguation_assertion`, and is surfaced by
  `pendingNotMineAssertions()` as the read-interface for a future upstream push.
- **Consent + research logging** — opt-in (`default off`); logs corrections,
  assertions, and composition snapshots. Full data **export** and account
  **deletion** (GDPR/APPI). Nothing is logged without consent.
- **Opt-in metrics** — author metrics from OpenAlex plus derived
  field-normalized measures (mean work FWCI, top-10% share) and a clearly
  flagged, non-rendering **Sigma-Score placeholder**; default none.
- **Google + email sign-in** — alongside ORCID (enabled when configured; email
  is a passwordless magic link).
- **Living public CV page** — publish a public page at `/p/<slug>`, kept fresh
  by a **scheduled re-sync** (cron container → guarded `/api/internal/resync`).
- **Editorial roles (OEP)** — optional, from a configurable `OEP_DATA_URL`.
- **Grants** — a funding section aggregated from OpenAlex grant fields.
- **E2E harness** — Playwright journeys (`e2e/`) against a live app + Postgres.

Still intentionally **out of scope** (per the brief): an institutional data
API, pushing "not mine" corrections upstream to OpenAlex, writing to ORCID
(member API), multi-funder national grant-API federation, and payments.

## Architecture (load-bearing)

- **Canonical CV object** (`src/lib/canonical/schema.ts`) — one Zod-validated
  JSON document = curated data **plus** display choices. The single source of
  truth, stored in `Cv.document`.
- **Renderers** (`src/lib/render/`) — HTML / PDF (and later DOCX / LaTeX /
  Markdown) all derive from the canonical object via one `Renderer` interface.
  No per-format pipelines: PDF is just the HTML renderer + Playwright.
- **Citations** — CSL via `citeproc-js`, identical across every output.
- **Self-name highlighting** — matched by **author identifier**
  (ORCID / OpenAlex ID), never a name string. Works for common names and
  non-Latin scripts.

## Tech stack

Next.js 15 (App Router) · TypeScript · PostgreSQL + Prisma · Auth.js v5 ·
`citeproc-js` · Playwright · Zod · Vitest. Deploy: Docker Compose on a single
EU VPS.

## Local development

### Prerequisites
- Node.js ≥ 20
- A PostgreSQL database (run one with `docker compose up -d postgres`, or use any local/managed Postgres)
- An ORCID API client (sandbox is free — see below)

### Setup
```bash
cp .env.example .env          # then fill in the values
npm install                   # also runs `prisma generate`
npm run fetch-csl             # vendor CSL styles + en-US locale
npx prisma migrate dev        # create the schema in your database
npx playwright install chromium   # only needed for PDF export
npm run dev                   # http://localhost:3000
```

### Registering an ORCID sandbox client
1. Create a sandbox account at <https://sandbox.orcid.org>.
2. Go to **Developer Tools** and register an application.
3. Set the redirect URI to `http://localhost:3000/api/auth/callback/orcid`.
4. Copy the Client ID / Secret into `.env`; keep `ORCID_ENVIRONMENT=sandbox`.

> Sandbox ORCID iDs won't have OpenAlex records. To see real publications, use
> `ORCID_ENVIRONMENT=production` with a production ORCID client, or test the
> OpenAlex pull independently against a real iD.

## Scripts
| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Run Vitest unit tests |
| `npm run fetch-csl` | Download CSL styles + locale into `src/lib/citeproc/assets` |
| `npm run db:migrate` | `prisma migrate dev` |

## End-to-end tests (Playwright)

E2E specs in `e2e/` drive the real app + a real Postgres through the core
journeys (curate → save → export → publish → public page). Auth is exercised by
**seeding a database session** (no OAuth roundtrip); OpenAlex is served by a
local fixture server via the `OPENALEX_API_BASE` override. Unit tests (Vitest,
`tests/`) stay separate.

```bash
cp .env.e2e.example .env.e2e
docker compose -f docker-compose.e2e.yml up -d   # test Postgres on :5433
npm run e2e:install                              # Chromium + deps
npm run db:push:e2e                              # create the test schema
npm run e2e
```
The harness refuses to run unless `DATABASE_URL` names a `*_e2e` database.

## Deployment (Docker Compose)
```bash
cp .env.example .env          # set AUTH_URL, SITE_ADDRESS (your domain), secrets
docker compose up --build -d
```
Caddy terminates TLS and proxies to the app; the app applies migrations on
startup and renders PDFs in-process.

## Open science & FAIR

SigmaCV is open infrastructure for **responsible research assessment**, built to
the [FAIR principles](https://www.go-fair.org/fair-principles/) for both the CVs
it produces and the software itself. See
[`docs/OPEN-SCIENCE.md`](docs/OPEN-SCIENCE.md) for the full statement and
[`docs/OPEN-SCIENCE-ROADMAP.md`](docs/OPEN-SCIENCE-ROADMAP.md) for the sequenced
roadmap. Highlights:

- **Identifier-driven, never name-based** — authorship is matched by ORCID /
  OpenAlex ID, so records resolve unambiguously.
- **Provenance on every record** — source, match basis, sync timestamps.
- **Privacy by default** — per-field publish consent, account export and
  deletion (GDPR / Japan APPI); public pages are non-indexable until opted in.
- **Opt-in, field-normalized metrics** (default none), consistent with
  [DORA](https://sfdora.org/).
- **Self-hostable** — the whole stack runs on your own VPS with Docker Compose
  (see [`DEPLOY.md`](DEPLOY.md)); no lock-in to a hosted instance.

Contributions are welcome — see [`CONTRIBUTING.md`](CONTRIBUTING.md) and
[`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

## Citing SigmaCV

If you use SigmaCV in your research, please cite it using the metadata in
[`CITATION.cff`](CITATION.cff) (GitHub's "Cite this repository" renders it
automatically). Machine-readable software metadata is also provided in
[`codemeta.json`](codemeta.json), and archival deposits are configured via
[`.zenodo.json`](.zenodo.json) (a release DOI is minted on the first tagged
release).

## License
[Apache-2.0](LICENSE). Bundled CSL styles are CC BY-SA 3.0 — see [`NOTICE`](NOTICE).
