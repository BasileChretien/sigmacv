# AGENTS.md

This file provides guidance to AI coding agents (Codex, and any other agent that reads `AGENTS.md`)
when working with code in this repository.

> **Mirror of [`CLAUDE.md`](CLAUDE.md).** The two files are identical apart from this header — keep them
> in sync when either changes. Per-directory guidance lives in the nested `CLAUDE.md` files under `src/`,
> `prisma/` and `tests/`; agents reading this file should read those too.

> **Not a user guide.** This is AI-assistant / contributor guidance (architecture + operations notes), not user documentation. New here? Start with the **[README](README.md)**.

## Project: SigmaCV

Open-source web app that auto-generates clean, customizable academic CVs from open research data (OpenAlex, ORCID, Crossref, Open Editors Plus). Free for individuals. Live at https://sigmacv.org. _(Working name. The “Sigma-Score” it alludes to is a design concept, **not an implemented metric** — no such index ships, and none should be added without discussion.)_

It is open infrastructure for **responsible research assessment**, run not-for-profit, and a **research vehicle** (consent-gated logging): keep that data available only with explicit consent, and never optimize for raw consumer growth at the expense of these.

User flow: ORCID / Google / email login → CV auto-populated from open sources → **curate** (remove "not mine", reorder, choose sections) → **style** (CSL style, self-name highlight, optional metrics, template) → **export** (PDF / DOCX / LaTeX / Markdown) or **publish** a living public page that re-syncs.

Stack: Next.js 16 + TypeScript · PostgreSQL + Prisma · Auth.js (ORCID/Google/email) · `citeproc-js` · Playwright (HTML→PDF) · `docx` · `.bib`+`.tex` · Markdown + YAML frontmatter. One EU Hetzner VPS, Docker Compose (app + Postgres + Caddy + render worker).

## Architecture (load-bearing — do not deviate without discussion)

- **Canonical CV object**: one structured JSON document (`src/lib/canonical/schema.ts`) = curated data + display choices. Single source of truth.
- **Renderers**: HTML / PDF / DOCX / LaTeX / Markdown all derive from the canonical object. No per-format pipelines.
- **Citations**: CSL via `citeproc-js`, using the CSL styles repo. Identical across every output.
- **Name highlighting**: match the account holder by **author identifier (ORCID / OpenAlex ID), never by name string**.
- **Curation**: "not mine" hides (`included:false` + a reason), never deletes. Display curation is local. Pushing "not mine" upstream to OpenAlex is v2 and **stays OFF** (`OPENALEX_CURATION_ENABLED` unset; `src/lib/openalex/assert.ts` makes no network call while unset, and its payload is PROVISIONAL until OpenAlex's curation API contract is confirmed).

## External data sources

Clients live under `src/lib/<source>/`, send a polite-pool `mailto`/User-Agent, go through `http.ts`, are **fail-soft** (a hiccup never breaks a sync) and are tested with mocked `fetch`. Each source's details and terms: [`docs/DATA-SOURCES.md`](docs/DATA-SOURCES.md).

- **Matching rule (load-bearing):** **identifier-matched** outputs (ORCID / DOI) auto-include; **name+org-matched** outputs (registries and funders with no ORCID) are **review candidates**, built `included:false` with `meta.reviewFlag="name-matched"` and a review badge, never auto-included. Never name-only: `src/lib/grants/match.ts` `matchesNameAndOrg` returns false with no org.
- **Editor-only data:** publisher self-archiving policies, deposit routes and PubMed guideline citations are computed by the **owner sync only** (never the anonymous preview) and shown in the editor only, never on a public page or the rendered CV. See `src/lib/archiving/CLAUDE.md` and `src/lib/pubmed/CLAUDE.md`.
- **Jisc Open Policy Finder terms (case CS-00957483) — keep them true:** shown privately to each researcher in their own editor, credited with a link to the journal's record and the date retrieved; never on a public page, in an export or redistributed (`src/lib/cv/licensedPolicies.ts` drops them from every download); lookups by ISSN only, for the owner's own closed articles, during their own sync, each journal at most once a week. The key goes only in the `x-api-key` header: never print it, never put it in a URL.
- Sources: OpenAlex (primary works source), ORCID public API, Crossref (DOI gap-fill + grants), Open Editors Plus (Postgres table), DataCite + OpenAIRE, DBLP, UKRI / NIH / NSF, ClinicalTrials.gov + EU CTIS + WHO ICTRP (dormant table), EPO OPS (dormant without credentials), Wikidata (owner identity only), ROR (provenance only), Open Policy Finder + OA.Works (publisher policies), PubMed E-utilities.

## Metrics

Opt-in, user-chosen, **default none**; prefer field-normalized over h-index. **There is no SigmaCV-computed composite score, and adding one is a load-bearing decision, not a feature.** The catalog (`src/lib/render/metrics.ts` `METRIC_DEFS`) offers the NIH iCite `rcr_mean` (the only one SigmaCV computes) plus five pass-throughs of OpenAlex's own author figures. MNCS, mean FWCI and the by-year top-decile share are computed and stored but **deliberately withheld**, each biased in a documented way: read the rationale in `metrics.ts` and `openalex/deriveMetrics.ts` before proposing a new aggregate.

## Privacy & ethics (mandatory)

Personal data under GDPR + Japan APPI: data minimization, per-field publish consent, account deletion + data export. Research logging only behind explicit consent, under IRB, with confirmatory analyses pre-registered.

- **Research logging stays OFF** (`RESEARCH_LOGGING_ENABLED`) until the consent panel of Nagoya study 2026-0310 (`src/lib/research/consent/`) is live in production. Consent text exists in Japanese and English only (`APPROVED_CONSENT_LOCALES`). The research export stays gated (`RESEARCH_EXPORT_*`) until its de-identified fields are finalised against the pre-registration. See `src/lib/research/CLAUDE.md`.
- The privacy notice's claim that analytics never record a previewed ORCID iD rests on the scrub in `src/lib/analytics/plausibleInit.ts` and the ClickHouse purge in `scripts/deploy.sh`: keep both, and re-check the outgoing event after any Plausible upgrade.
- Art. 21 objections (`PREVIEW_SUPPRESSED_ORCID_HMACS`, the `PreviewSuppression` table) are keyed by `PREVIEW_SUPPRESSION_KEY`, not `AUTH_SECRET`; rotating that key means recomputing every entry.
- Narrative AI drafting is bring-your-own-key: the server holds no key and presets no provider (no `AI_*` env); `/api/cv/narrative-draft` is a stateless, SSRF-hardened relay that stores and logs nothing.

## Production and deploys

**Merging is deploying.** The server deploys `main` within about 15 minutes (`scripts/auto-deploy.sh` in cron; `docs/SERVER-RUNBOOK.md` §10). A change that needs a server-side step first (a new `.env` value, a data import) takes that step before the merge, or pauses the deployer with `touch .deploy-state/paused`.

- Deploy-time configuration, optional and dormant sources with their imports (OEP, Open Policy Finder, EPO, WHO ICTRP, FORRT) and the maintainer's launch tasks: [`docs/GO-LIVE-CHECKLIST.md`](docs/GO-LIVE-CHECKLIST.md). Security rationale and operator requirements: [`SECURITY.md`](SECURITY.md). Secrets go in the server's `.env` only; `.env.production.example` is the template.
- Keep the hardening: Postgres has no host `ports:` mapping (`expose` only); the `Caddyfile` rules (real-peer `X-Forwarded-For`, `request_body max_size`, 404 on `/api/internal/*`, 405 on methods the app never serves); the container runs non-root with `cap_drop: ALL` + `no-new-privileges`.
- Never commit a WHO ICTRP seed (WHO's terms forbid redistributing it). Cite FORRT/FReD wherever replication data is shown. After rebuilding the OEP seed, copy its collection dates into `OEP_SNAPSHOT` (`src/lib/oep/snapshot.ts`).
- Public wording: SigmaCV "aligns with" DORA and CoARA. The DORA signature is Basile's as an individual; never claim signatory status for SigmaCV unless the organisation itself is registered.

## Dependencies

What keeps them current, and why each exclusion exists: [`docs/DEPENDENCY-HYGIENE.md`](docs/DEPENDENCY-HYGIENE.md).

- Dependabot patch and minor PRs for npm and GitHub Actions merge themselves once the required checks pass. Majors, Docker and Compose images, and `playwright` stay manual.
- No CI job builds the Dockerfile or the compose stack, so green checks on an image bump prove nothing: read the diff. `deploy.sh` runs a bare `docker compose up -d`, which recreates **every** service whose image changed.
- **Never merge a `postgres` major casually** (the app DB, `plausible_db` and `metabase_db` hold v16 data; a major is a dump/restore), nor a `clickhouse/clickhouse-server` bump (Plausible CE pins it). The auto-deployer holds postgres, clickhouse and plausible image changes for a hand deploy.
- The `playwright` npm version, the Dockerfile's Playwright image tag and the builder's Node major move together (`tests/dockerfile-playwright-sync.test.ts`).
- **`allowScripts`** (`package.json`, enforced from npm 12) approves `esbuild`, `prisma` and `@prisma/engines`, name-only (not version-pinned). When an install reports blocked scripts, review the package, then `npm install-scripts approve <pkg> --no-allow-scripts-pin`; never `--all`. The Dockerfile's global `prisma` install passes `--allow-scripts=prisma,@prisma/engines`.
- **`overrides`** pin transitive dependencies past advisories their parent has not picked up; `npm audit` is expected to report 0 vulnerabilities. Drop an override once it is redundant.

## Database / Prisma

The dev DB (Neon) is push-managed: `predev` runs `scripts/ensure-db.mjs`, which pushes the schema only when it changed; `npm run db:sync` does it on demand. Never a bare `npx prisma …` (it misses `.env` and fails with `P1001`); an unsynced schema shows up as an opaque Auth.js "server configuration" error. `npm run db:migrate` is the migration path (fresh DB / Docker). The client is generated into `src/generated/prisma/` (gitignored, never hand-edited), so a fresh clone or worktree needs `npm install` before `npm run typecheck`. More: `prisma/CLAUDE.md`.

## Commands

```bash
npm run dev            # Next dev server (predev auto-syncs the DB schema)
npm run build          # production build
npm run typecheck      # tsc --noEmit  (run this after every code change)
npm test               # vitest run — full unit/integration suite
npm run coverage       # vitest run --coverage — ENFORCES the gate; this is what CI runs
npm run e2e            # Playwright E2E (needs e2e DB; e2e:install first)
npm run e2e:prod       # builds, then checks pages run their scripts under the PRODUCTION CSP (no DB)
npm run fetch-csl      # vendor the CSL styles + en-US locale into citeproc assets
npm run gen:schema     # regenerate public/schema/cv/v2.json from the Zod canonical schema
npm run models:sources # is each CV model's funder document still current? (docs/CV-MODELS.md)
npm run deadcode       # knip: unused files / exports / dependencies (exit 0 = clean)
npm run sbom           # CycloneDX SBOM; release.yml attaches it to GitHub releases
npx vitest run tests/curate.test.ts   # one file (-t "name" for matching tests)
```

**Verify loop after any `src/lib` change:** `npm run typecheck`, then `npm run coverage`. The gate (`vitest.config.ts`, scoped to `src/lib/**`) fails below **stmts 98 / branches 87 / funcs 99 / lines 99**, and CI runs it inside the required `Format · Typecheck · Test · Build` check. A failing test suppresses the coverage table: fix the tests first. Mark genuinely unreachable defensive branches with `/* v8 ignore next N -- reason */`. Remove one-off QA artifacts (`.preview/`, `tests/_*_gen.test.ts`, `scripts/_*.mjs`) before committing. More: `tests/CLAUDE.md`.

**After changing `src/lib/canonical/schema.ts`:** run `npm run gen:schema` and commit the regenerated `public/schema/cv/v2.json` (`tests/cv-json-schema.test.ts` fails on drift).

**Changelog:** record notable user-facing changes under `[Unreleased]` in `CHANGELOG.md` (Keep a Changelog). Open-science / FAIR work is tracked in [`docs/OPEN-SCIENCE-ROADMAP-2.md`](docs/OPEN-SCIENCE-ROADMAP-2.md) and stated in [`docs/OPEN-SCIENCE.md`](docs/OPEN-SCIENCE.md).

**`CLAUDE.md` and `AGENTS.md` change together:** below their headers they must be identical (`tests/agents-md-mirror.test.ts`).

## Where the code lives (`src/`)

- **`app/`** — Next.js App Router: localized public pages under `app/[locale]/`, API routes in `app/api/**`, the living public page at `app/p/[slug]/route.ts`. More: `src/app/CLAUDE.md`.
- **CSP:** `proxy.ts` (Next 16's rename of `middleware.ts`) sets the per-request CSP only. Production has two shapes, a nonce for routes rendered per request and inline-script hashes read off the build for prerendered ones (`src/lib/security/csp.ts`). `npm run e2e` runs `next dev`, whose policy allows every script, so a CSP change is proven only by `npm run e2e:prod`.
- **`app/not-found.tsx`** is `force-dynamic` (so it gets a nonce) and must never read the request (`headers()`, `cookies()`, `connection()`): Next renders it into every page as its not-found boundary, and every prerendered page would turn dynamic.
- **`lib/`** — all domain logic, the only tree the coverage gate measures. More: `src/lib/CLAUDE.md` and the nested files under it.
- **`components/`** — React client components (editor, preview, publish/consent/account controls). `generated/prisma/` — generated client. `types/` — ambient `.d.ts`.

Deferred (not without discussion): institutional API · ORCID write · national grant-API federation · payments · Europass export · CRediT roles · the upstream-curation UI.

## Internationalization

Ten locales: **en-US, zh-CN, es-ES, fr-FR, de-DE, ja-JP, pt-BR, it-IT, ko-KR, ru-RU**. UI and render strings live in `src/lib/i18n/*` as typed records keyed by locale; **adding a key forces a value in all ten** (TypeScript fails the build otherwise). For bulk multi-locale edits, write a file-based Node script with the editor, not a heredoc (the shell mangles backslashes).
