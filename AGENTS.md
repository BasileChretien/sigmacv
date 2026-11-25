# AGENTS.md

This file provides guidance to AI coding agents (Codex, and any other agent that reads `AGENTS.md`)
when working with code in this repository.

> **Mirror of [`CLAUDE.md`](CLAUDE.md).** The two files are identical apart from this header — keep them
> in sync when either changes. Per-directory guidance lives in the nested `CLAUDE.md` files under `src/`,
> `prisma/` and `tests/`; agents reading this file should read those too.

> **Not a user guide.** This is AI-assistant / contributor guidance (architecture + operations notes), not user documentation. New here? Start with the **[README](README.md)**.

## Project: SigmaCV

Open-source (permissive licence) web app that auto-generates clean, customizable academic CVs from open research data (OpenAlex, ORCID, Crossref, Open Editors Plus). Free for individuals. _(Working name. The “Sigma-Score” it alludes to is a design concept, **not an implemented metric** — no such index ships, and none should be added without discussion. May be renamed.)_

Beyond a useful tool, this is open infrastructure for **responsible research assessment**, run not-for-profit, and a consent-gated **research vehicle**: keep research data available only with explicit consent, and do not optimize for raw consumer growth at the expense of either.

User flow: ORCID / Google / email login → CV auto-populated from open sources → **curate** (remove "not mine", reorder, choose sections) → **style** (CSL citation style, self-name highlight, optional metrics, template) → **export** (PDF / DOCX / LaTeX / Markdown) or **publish** a living public page that re-syncs.

Status, open maintainer tasks and dormant features: [`docs/STATUS.md`](docs/STATUS.md).

## Architecture (load-bearing — do not deviate without discussion)

- **Canonical CV object**: one structured JSON document = curated data + display choices. Single source of truth. Its schema and the `Renderer` interface are frozen contracts.
- **Renderers**: HTML / PDF / DOCX / LaTeX / Markdown all derive from the canonical object. No per-format pipelines.
- **Citations**: CSL via `citeproc-js`, using the CSL styles repo. Identical across every output.
- **Name highlighting**: match the account holder by **author identifier (ORCID / OpenAlex ID), never by name string**.
- **Curation**: display curation (what shows on the CV) is free and local; "not mine" hides (`included:false`), never deletes. Pushing "not mine" upstream to OpenAlex is v2 and stays off (below).
- **Deferred** (roadmap, not without discussion): upstream corrections UI, ORCID write, institutional API, payments, Europass export, CRediT roles.

## Stack

Next.js + TypeScript · PostgreSQL + Prisma · Auth.js (ORCID/Google/email) · `citeproc-js` · Playwright (HTML→PDF) · `docx` lib · `.bib`+`.tex` for LaTeX · Markdown + YAML frontmatter. Deploy: single EU Hetzner VPS, Docker Compose (app + Postgres + Caddy + render worker).

## External data sources

All external clients live under `src/lib/<source>/`, send a polite-pool `mailto`/User-Agent, go through `http.ts`, and are **fail-soft** (a hiccup never breaks a sync). Endpoints, terms and details per source: [`docs/DATA-SOURCES.md`](docs/DATA-SOURCES.md).

**The matching rule is load-bearing**: **identifier-matched** outputs (ORCID/DOI) auto-include; **name+org-matched** outputs (registries/funders with no ORCID) are **review candidates** — built `included:false` with `meta.reviewFlag="name-matched"`, surfaced with a review badge, never auto-included (`src/lib/grants/match.ts` `matchesNameAndOrg` returns false with no org → never name-only).

- Identifier-matched: **OpenAlex** (primary works source, metrics, grant fields), **ORCID** public API (free, non-commercial; Member API/write deferred), **Crossref** (DOI gap-fill + Grant Linking System grants), **DataCite** + **OpenAIRE** (datasets & software, deduped by DOI), **DBLP** (conference papers), **Wikidata** (owner `sameAs` only, not a CV item), **ROR** (provenance only).
- Name+org review candidates: **UKRI / NIH / NSF** grants; **ClinicalTrials.gov**, **EU CTIS** and **WHO ICTRP** trials (ICTRP has no live API: the dormant `IctrpTrial` table); **EPO OPS** patents (dormant without credentials).
- **Open Editors Plus** — editorial roles from the `OepEditorialRole` table; the `scraped` tier auto-includes, `propagated` and `openalex` are review candidates.
- **Owner sync only, never the anonymous preview, never on the CV or any public surface:** the journal's self-archiving policy `meta.selfArchiving` (Jisc Open Policy Finder first, OA.Works fallback), the deposit routes (both `src/lib/archiving/CLAUDE.md`), and the PubMed guideline citations `meta.guidelineCitations` (`src/lib/pubmed/guidelineCitationsPass.ts`).
- **Jisc Open Policy Finder data is bound by the terms agreed with Jisc (case CS-00957483, 2026-09-17).** In short: shown privately to each researcher in their own editor, credited with a link and the retrieval date; never on a public page, in an export, or redistributed; looked up by ISSN only, for the owner's own closed articles, during their own sync, a journal at most once a week; the owner's downloads drop the records (`src/lib/cv/licensedPolicies.ts`). The full terms, which bind, are in `docs/DATA-SOURCES.md`: keep them true.

## Metrics

Opt-in, user-chosen, **default none**. Prefer field-normalized over h-index. **There is no SigmaCV-computed composite score, and adding one is a load-bearing decision, not a feature.** The catalog (`METRIC_DEFS` in `src/lib/render/metrics.ts`) offers six: NIH iCite `rcr_mean`, the only one SigmaCV computes, plus five pass-throughs of OpenAlex's own author figures. Three computed aggregates (MNCS, mean FWCI, by-year top-decile share) are deliberately withheld — read the rationale in `metrics.ts` and `openalex/deriveMetrics.ts` before proposing a new aggregate.

## Privacy & ethics (mandatory)

Personal data under GDPR + Japan APPI. Data minimization; per-field publish consent; account deletion + data export. Research logging only behind explicit consent, under IRB (study 2026-0310, see `src/lib/research/CLAUDE.md`); pre-register confirmatory analyses.

Public wording: SigmaCV "aligns with" DORA and CoARA. Basile is an individual DORA signatory; SigmaCV is not an organisation signatory nor a CoARA member. Claim signatory status only for the entity that holds it.

## Production configuration

Full checklist: [`docs/GO-LIVE-CHECKLIST.md`](docs/GO-LIVE-CHECKLIST.md); rationale in [`SECURITY.md`](SECURITY.md); server procedures in [`docs/SERVER-RUNBOOK.md`](docs/SERVER-RUNBOOK.md). Rules that hold for every change:

- Secrets go in the server's `.env` only, generated with `openssl rand`, never committed; `.env.production.example` is the template.
- `AUTH_URL` is the canonical HTTPS origin: it anchors OAuth callbacks and the CSRF same-origin check (fails closed in prod) and must match the ORCID app's redirect-URI host. `/object` needs a second redirect URI, `…/api/auth/callback/orcid-object`.
- Postgres stays unpublished (compose `expose` only, never a host `ports:` mapping). Keep Caddy's hardening (`X-Forwarded-For` overwrite, `request_body max_size`, 404 on `/api/internal/*`, 405 on unserved methods) and the non-root, `cap_drop: ALL`, `no-new-privileges` container.
- Switches that stay OFF: `RESEARCH_LOGGING_ENABLED` until the consent panel is live in production; `RESEARCH_EXPORT_*` until its fields are finalised against the pre-registration; `OPENALEX_CURATION_ENABLED` (the "not mine" push, `src/lib/openalex/assert.ts`, makes no network call while unset).
- Narrative AI drafting is bring-your-own-key: the server holds no key and presets no provider (`src/lib/ai/*`); `/api/cv/narrative-draft` is a stateless, SSRF-hardened relay that stores and logs nothing. There is no `AI_*` env; do not add one.
- Reference-data imports (`npm run oep:import`, `ictrp:import`, `forrt:import`) run from a full checkout with `npm install` done, against the production `DATABASE_URL`, never inside the standalone container (`tsx` is a dev dependency).
- After rebuilding the OEP seed (`python scripts/oep-build-seed.py`), copy the collection dates it prints into `OEP_SNAPSHOT` (`src/lib/oep/snapshot.ts`).
- WHO's terms forbid redistributing ICTRP data: never commit an ICTRP seed. Wherever FReD replication data is shown or reused, cite FORRT/FReD.
- Analytics never record a previewed ORCID iD: the client scrub in `src/lib/analytics/plausibleInit.ts` plus the ClickHouse purge in `scripts/deploy.sh`. After any Plausible upgrade, confirm the outgoing event body carries `/preview/_`. `PREVIEW_SUPPRESSED_ORCID_HMACS` is keyed by `PREVIEW_SUPPRESSION_KEY`, not `AUTH_SECRET`; rotating that key means recomputing every entry.
- The Open Policy Finder key travels only in the `x-api-key` header: never print it or put it in a URL. If Jisc withdraws it, unset the variable.

## Dependencies and deploys

What Dependabot covers, the exclusions and why: [`docs/DEPENDENCY-HYGIENE.md`](docs/DEPENDENCY-HYGIENE.md).

- **Merging is deploying**: the server deploys main within about 15 minutes (`scripts/auto-deploy.sh`, `docs/SERVER-RUNBOOK.md` §10). A change that needs a server-side step first (a new `.env` value, a data import) takes that step before the merge, or pauses the auto-deployer (`touch .deploy-state/paused`).
- Patch and minor npm and GitHub Actions PRs merge themselves; majors, Docker and Compose images, and `playwright` stay manual. CI builds no image, so read image-bump diffs yourself: `deploy.sh` runs a bare `docker compose up -d`, which recreates every service whose image changed.
- Never merge a `postgres` major casually (the app DB, `plausible_db` and `metabase_db` hold v16 data), and move `clickhouse/clickhouse-server` only with Plausible.
- The `playwright` npm version and the Dockerfile's Playwright image tag move together (`tests/dockerfile-playwright-sync.test.ts`); the builder's Node major follows that image.
- `allowScripts` in `package.json` (npm 12) approves `esbuild`, `prisma` and `@prisma/engines`, by name only. When an install reports blocked scripts, review the package, then `npm install-scripts approve <pkg> --no-allow-scripts-pin`, never `--all`.
- `overrides` pin transitive dependencies past advisories; `npm audit` should report 0 vulnerabilities. Drop an override once its parent catches up.

## Commands

```bash
npm run dev            # Next dev server (predev auto-syncs the DB schema)
npm run build          # production build
npm run typecheck      # tsc --noEmit  (run this after every code change)
npm test               # vitest run — full unit/integration suite (~4,800 tests)
npm run coverage       # vitest run --coverage — ENFORCES the gate; this is what CI runs
npm run e2e            # Playwright E2E (needs e2e DB; e2e:install first)
npm run e2e:prod       # builds, then checks in a browser that pages run their scripts under the PRODUCTION CSP (no DB)
npm run fetch-csl      # vendor the CSL styles + en-US locale into citeproc assets
npm run gen:schema     # regenerate public/schema/cv/v2.json from the Zod canonical schema
npm run models:sources # is each CV model's funder document still current? (monthly in CI; docs/CV-MODELS.md)
npm run deadcode       # knip: unused files / exports / dependencies (config in knip.json; exit 0 = clean)
npm run sbom           # write a CycloneDX SBOM (sbom.cdx.json); release.yml attaches it to GitHub releases
npm run db:push        # sync the dev DB after editing prisma/schema.prisma (db:sync on demand)
npx vitest run tests/template-style.test.ts   # one file; -t "name" runs the tests matching a name
```

- **Verify loop after any `src/lib` change:** `npm run typecheck`, then `npm run coverage`. The gate (`vitest.config.ts`, scoped to `src/lib/**`) fails below **stmts 98 / branches 87 / funcs 99 / lines 99**, and CI runs it inside the required `Format · Typecheck · Test · Build` check. Details: `tests/CLAUDE.md`.
- After changing `src/lib/canonical/schema.ts`, run `npm run gen:schema` and commit `public/schema/cv/v2.json` (`tests/cv-json-schema.test.ts` fails on drift).
- The dev DB is push-managed: never a bare `npx prisma …` (it falls back to a placeholder URL, `P1001`). A fresh worktree needs `npm install` before `typecheck`. Details: `prisma/CLAUDE.md`.
- Remove one-off QA artifacts (`.preview/`, `tests/_*_gen.test.ts`, `scripts/_*.mjs`) before committing.
- Record notable user-facing changes in `CHANGELOG.md` (`[Unreleased]`). Releases and the Zenodo DOI write-back: `docs/RELEASES.md`. Open-science work: `docs/OPEN-SCIENCE-ROADMAP-2.md`, stated in `docs/OPEN-SCIENCE.md`.
- `AGENTS.md` mirrors this file below its header: make every edit in both (`tests/agents-md-mirror.test.ts`).

## Where the code lives (`src/`)

- **`app/`** — Next.js App Router: localized public pages under `app/[locale]/`, API routes in `app/api/**`, the living public CV page at `app/p/[slug]/route.ts`. `proxy.ts` sets the per-request CSP only, and a CSP change is proven only by `npm run e2e:prod`. See `src/app/CLAUDE.md`.
- **`lib/`** — all domain logic, the only path the coverage gate covers: `canonical/` (schema, `build`, pure immutable `curate`, `enrich`, `cvModels.ts`), `render/`, `citeproc/`, one folder per external client, `cv/` (`sync`, `resync`, public JSON-LD), `i18n/`, `research/`, Postgres-backed rate limiting (`rateLimit.ts`). Nested `CLAUDE.md` files cover each.
- **`components/`** — React client components (the `/cv` editor + preview, publish/consent/account controls).
- **`generated/prisma/`** — generated Prisma client (do not edit). `types/` — ambient `.d.ts` (CSL, next-auth).

## Internationalization

Ten locales: **en-US, zh-CN, es-ES, fr-FR, de-DE, ja-JP, pt-BR, it-IT, ko-KR, ru-RU**. UI/render strings live in `src/lib/i18n/*` as typed records keyed by locale; **adding a key forces a value in all ten** (TypeScript fails the build otherwise). For bulk multi-locale edits, write a file-based Node script with the editor, not a heredoc (the shell mangles backslashes).
