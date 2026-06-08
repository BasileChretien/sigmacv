# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: SigmaCV

Open-source web app that auto-generates clean, customizable academic CVs from open research data (OpenAlex, ORCID, Crossref, Open Editors Plus). Free for individuals. _(Working name; ties to the Sigma-Score bibliometric index — may be renamed.)_

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

All external clients live under `src/lib/<source>/`, send a polite-pool `mailto`/User-Agent, go through `http.ts`, and are **fail-soft** (a hiccup never breaks a sync). The matching rule is load-bearing: **identifier-matched** outputs (ORCID/DOI) auto-include; **name+org-matched** outputs (registries/funders with no ORCID) are **review candidates** — built `included:false` with `meta.reviewFlag="name-matched"`, surfaced with a review badge, never auto-included (`src/lib/grants/match.ts` `matchesNameAndOrg` returns false with no org → never name-only).

- **OpenAlex API** — free; `mailto` polite pool; publications, metrics, grant fields. The primary works source.
- **ORCID public API** — free, non-commercial; OAuth for authenticated iD + public data. _(Member API / write = deferred, paid.)_
- **Crossref** — bibliographic gap-fill by DOI **and** grants via the Grant Linking System (`fetchCrossrefGrantsByOrcid`, ORCID-matched).
- **Open Editors Plus** — editorial roles (owner's dataset, Postgres table).
- **DataCite** + **OpenAIRE** — datasets & software (ORCID-matched, merged + deduped by DOI). OpenAIRE uses a cached refresh-token (`OPENAIRE_REFRESH_TOKEN`, optional → anonymous).
- **DBLP** — conference papers (SPARQL ORCID→PID→XML, auto-included).
- **UKRI / NIH / NSF** — national funder grants (name+org review candidates; keyless).
- **ClinicalTrials.gov** (v2) + **EU CTIS** (`ctis-public-api`, undocumented) + **WHO ICTRP** — clinical trials (name+org review candidates) into the Clinical Trials section. ICTRP has no live API → a **dormant** `IctrpTrial` table fed by `npm run ictrp:import` (see go-live checklist).
- **EPO OPS** — patents by inventor (OAuth client-credentials `EPO_OPS_KEY`/`SECRET`, XML). Name+org review candidates → Patents section. Dormant without credentials.
- **Wikidata** — owner identity (`wdt:P496` ORCID match) → `owner.wikidataUri`/`wikidataSameAs`, surfaced as `sameAs` in the public JSON-LD (not a CV item).
- **ROR** — institution canonicalization (provenance-only).

## Curation model

- **Display curation** (what shows on the CV) = free, local, all the MVP needs.
- **Upstream assertion** (push "not mine" to OpenAlex) = v2; rides OpenAlex's curation API. NOT in MVP.

## Metrics

Opt-in, user-chosen, **default none**. Prefer field-normalized over h-index. Sigma-Score is one optional metric.

## Privacy & ethics (mandatory)

Personal data under GDPR + Japan APPI. Data minimization; per-field publish consent; account deletion + data export. Research logging only behind explicit consent, under IRB; pre-register confirmatory analyses.

## 🚀 Production go-live checklist (DO THIS BEFORE EXPOSING PUBLICLY)

The app passed three security audits; the hardening it relies on must be **configured at deploy time**. Full detail + rationale in [`SECURITY.md`](SECURITY.md). Before opening to real users:

- [ ] **`POSTGRES_PASSWORD`** — set a strong value (`openssl rand -base64 24`). Deployment now _fails fast_ if unset (no committed default).
- [ ] **`AUTH_SECRET`** — ≥ 32 chars (`openssl rand -base64 33`). Enforced in prod by `env.ts`.
- [ ] **`AUTH_URL`** — the canonical **HTTPS** origin (e.g. `https://cv.example.org`). Anchors OAuth callbacks **and** the CSRF same-origin check (which fails closed in prod). Must match the ORCID redirect-URI host.
- [ ] **`ORCID_ENVIRONMENT=production`** + a **production** ORCID app (client id/secret); `OPENALEX_MAILTO` set (polite pool).
- [ ] **`RATE_LIMIT_PERSIST=true`** — durable, cross-instance rate limiting (defaulted on in the compose files).
- [ ] **Open Editors Plus data** — after the DB is migrated, run `npm run oep:import` once with `DATABASE_URL` pointed at the **production** database (run it from a full checkout with `npm install` done — same as `research:export`; `tsx` is a dev dependency, so this is NOT run inside the standalone container). Re-run on each dataset refresh. It loads the editorial-roles reference table (`OepEditorialRole`, ~347k rows from the committed 3.6 MB seed `prisma/seed-data/oep-editorial-roles.ndjson.gz`); without it the Editorial Roles section is simply empty. To rebuild the seed from an updated OEP parquet: `python scripts/oep-build-seed.py` (needs pyarrow).
- [ ] **EPO patents (optional)** — set `EPO_OPS_KEY`/`EPO_OPS_SECRET` from a free OPS app (<https://developers.epo.org>) to enable the Patents section. Without them the EPO client is dormant (OPS has no anonymous access) and Patents stays empty — no other effect.
- [ ] **WHO ICTRP (optional, DORMANT)** — the `IctrpTrial` table is empty by design: WHO's terms forbid redistributing the dataset, so there is **no committed seed**. To enable ICTRP trials: (1) clear the non-commercial / weekly-refresh / attribution use with WHO (`ictrpinfo@who.int`); (2) download the free WHO ICTRP weekly export; (3) convert it to gzip-NDJSON (per `scripts/ictrp-import.ts`); (4) run `npm run ictrp:import <path>` against the **production** `DATABASE_URL` (same checkout caveat as `oep:import`). The importer drops CT.gov/EU rows (already pulled directly) and must be **re-run weekly** to honour WHO's currency term. Empty table = ClinicalTrials.gov + EU CTIS still work; ICTRP just adds nothing.
- [ ] **Postgres stays unpublished** to the internet — compose uses `expose` only; never add a host `ports:` mapping for it.
- [ ] **Caddy** overwrites `X-Forwarded-For` with the real peer + sets `request_body max_size`, and 404s `/api/internal/*` (already in `Caddyfile` — don't remove).
- [ ] **Container** runs non-root with `cap_drop: ALL` + `no-new-privileges` (already in the Dockerfile + compose).
- [ ] **Research logging stays OFF** (`RESEARCH_LOGGING_ENABLED` unset) and the **research export stays gated** until IRB approval; finalise the export's de-identified fields against the pre-registration before ever enabling.
- [ ] **Upstream OpenAlex curation stays OFF** (`OPENALEX_CURATION_ENABLED` unset) — the "not mine" push (`src/lib/openalex/assert.ts`, endpoint `/api/cv/assert`) is disabled-by-default v2 scaffolding that makes **no** network call while unset; keep it off until the real OpenAlex curation API contract is confirmed and the **PROVISIONAL** payload finalised.
- [ ] **Accepted residuals** (documented in `SECURITY.md`): ORCID has no PKCE (upstream); DB session token at rest (rely on Neon/Postgres encryption-at-rest); revisit if the threat model changes.

Generate secrets with `openssl rand`, put them in the server's `.env` only (never commit), and keep `.env.production.example` as the template.

### Open-science launch tasks (maintainer, one-time)

The FAIR/open-science work is implemented (full status in [`docs/OPEN-SCIENCE-ROADMAP.md`](docs/OPEN-SCIENCE-ROADMAP.md)). These remaining steps are **mine to do**, not code — do them around launch:

- [ ] **Mint the software DOI** — cut a tagged GitHub release so Zenodo deposits it (config in `.zenodo.json`). Then write the DOI back into `CITATION.cff`, `.zenodo.json`, and the README "Citing" section, and bump `version`/`date-released` in `CITATION.cff` + `codemeta.json` + `.zenodo.json` to match the tag.
- [ ] **Sign DORA** (<https://sfdora.org/>) and record CoARA alignment; the stance is already stated in [`docs/OPEN-SCIENCE.md`](docs/OPEN-SCIENCE.md).
- [ ] **Before ANY confirmatory research analysis** — complete the placeholders in `docs/preregistration/study-2-*.md` and `study-3-*.md`, register on OSF, record the **IRB № + OSF DOI**, and freeze the analysis script _before_ touching data. Keep `RESEARCH_LOGGING_ENABLED` off until IRB approval, and **bump `RESEARCH_CONSENT_VERSION`** when you turn it on so users re-consent under the approved terms.
- [ ] **Tool / infrastructure paper** (paper #1) — cite the Zenodo DOI above.
- [ ] **Outreach** — the reusable kit is in [`docs/OUTREACH.md`](docs/OUTREACH.md) (libraries / DORA-CoARA / OpenAlex user group).

> Deferred features (not blockers; tracked in the roadmap): Europass export (controlled-vocabulary ELM graph), CRediT roles (no per-author source in OpenAlex), and the upstream-curation UI (feature disabled).

## Scope

- **MVP slice**: ORCID login → OpenAlex pull → canonical object → one HTML template (CSL + name highlight) → PDF export → curation UI.
- **Then**: more templates + constrained customization · other export formats · living public page · OEP roles · opt-in metrics · consent + logging · OpenAlex grant fields.
- **Deferred**: institutional API · upstream corrections · ORCID write · national grant-API federation · payments.

## Working conventions

Open-source (permissive license). Secrets in env only. Define and freeze the **canonical CV schema** and the **renderer interface** early — everything depends on them. Build the MVP vertical slice end-to-end before broadening.

### Database / Prisma workflow

The dev DB (Neon) is **push-managed**, so after changing `prisma/schema.prisma` the DB must be synced with `npm run db:push` (it uses `dotenv -e .env`; a bare `npx prisma …` falls back to a placeholder URL and fails with `P1001`). This is now **automatic**: `predev` runs `scripts/ensure-db.mjs`, which fingerprints the schema and runs `db push` only when it changed (instant no-op otherwise; non-fatal if the DB is unreachable). Forgetting to sync previously surfaced as an opaque Auth.js _"server configuration"_ error on the first authenticated request. `npm run db:sync` runs it on demand; `npm run db:migrate` is the migration-history path (fresh DB / Docker). Migration files under `prisma/migrations/` are kept consistent with the schema by tests.

The Prisma client is generated into **`src/generated/prisma/`** (committed, `postinstall` regenerates it). Treat it as build output — never hand-edit.

## Commands

```bash
npm run dev            # Next dev server (predev auto-syncs the DB schema)
npm run build          # production build
npm run typecheck      # tsc --noEmit  (run this after every code change)
npm test               # vitest run — full unit/integration suite (~800 tests)
npm run coverage       # vitest run --coverage — ENFORCES the gate (see below)
npm run e2e            # Playwright E2E (needs e2e DB; e2e:install first)
npm run fetch-csl      # vendor the CSL styles + en-US locale into citeproc assets
```

Run a single test file / case:

```bash
npx vitest run tests/template-style.test.ts          # one file
npx vitest run -t "Sidebar template"                 # tests matching a name
npx vitest tests/curate.test.ts                       # watch one file
```

**Verify loop after any `src/lib` change:** `npm run typecheck` then `npm run coverage`. The coverage gate (configured in `vitest.config.ts`, scoped to `src/lib/**`) fails the run below **stmts 98 / branches 87 / funcs 99 / lines 99**. The codebase convention for genuinely unreachable defensive branches is an inline `/* v8 ignore next N -- reason */` comment (grep for examples). One-off QA artifacts (throwaway `.preview/` files, `tests/_*_gen.test.ts`, `scripts/_*.mjs`) must be removed before committing.

## Where the code lives (`src/`)

- **`app/`** — Next.js App Router. Public pages also exist under **`app/[locale]/`** (localized routes; `middleware.ts` handles locale + auth gating). API routes live in `app/api/**` (`cv` load/save/sync/preview/publish, `account` consent/export/delete, `internal/resync` cron). `app/p/[slug]/route.ts` serves the living public CV page.
- **`lib/`** — all domain logic; the **only** path the coverage gate covers. Subsystems: `canonical/` (the Zod schema + `build` + pure immutable `curate` ops + `enrich` + the `cvModels.ts` catalog — 58 one-click funder/job/industry CV layouts applied reversibly; the R4RI/Royal-Society narrative modules are ordinary prose sections, not a separate subsystem), `render/` (the renderer family — see its own CLAUDE.md), `citeproc/` (CSL engine, style catalog, vendored assets, identifier-driven highlight), `openalex/`·`orcid/`·`crossref/`·`datacite/`·`ror/`·`oep/` (external clients; all use a polite-pool `mailto` and are unit-tested with mocked `fetch`), `cv/` (`sync` rebuild, scheduled `resync`, public JSON-LD), `i18n/` (UI strings), `research/` (consent-gated logging + diff). Rate limiting is Postgres-backed (`rateLimit.ts` + `rateLimitStore.ts`).
- **`components/`** — React client components (the `/cv` editor + preview, publish/consent/account controls).
- **`generated/prisma/`** — generated Prisma client (do not edit). `types/` — ambient `.d.ts` (CSL, next-auth).

## Internationalization

Ten locales: **en-US, zh-CN, es-ES, fr-FR, de-DE, ja-JP, pt-BR, it-IT, ko-KR, ru-RU**. UI/render strings live in `src/lib/i18n/*` as typed records keyed by locale; **adding a key forces a value in all ten** (TypeScript fails the build otherwise). For bulk multi-locale edits, use a file-based Node script (the shell mangles backslashes in heredocs/here-strings — write scripts with the editor, not heredocs).
