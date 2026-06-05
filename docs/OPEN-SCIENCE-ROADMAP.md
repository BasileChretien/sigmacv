# Open-science / FAIR + growth roadmap

A sequenced plan for making SigmaCV more **findable, accessible, interoperable,
and reusable**, and for turning that openness into adoption. Companion to
[`OPEN-SCIENCE.md`](OPEN-SCIENCE.md).

Status keys: ✅ done · 🔜 in progress · ⬜ planned.

## Cross-cutting requirements (every code phase)

- Verify loop after any `src/lib` change: `npm run typecheck` then
  `npm run coverage` (gate scoped to `src/lib/**`: stmts 98 / branches 87 /
  funcs 99 / lines 99). Unreachable defensive branches use
  `/* v8 ignore next N -- reason */`.
- Any new user-facing or render string must be defined for **all ten locales**
  (TypeScript fails the build otherwise). Bulk locale edits via a file-based
  Node script, not shell heredocs.
- Schema additions are **additive** (optional / `.default()`) so `schemaVersion`
  stays `1`; only a structural/breaking change bumps it and fills in
  `migrateCanonicalDocument()`.
- Content-negotiation / public-API work fails **closed** on consent (only
  `published` CVs, only `projectCvForPublic()` output, `publicIndexable`
  separate) and is rate-limited.

## Phase 0 — Repo hygiene & credibility (no code)

| # | Item | Status |
|---|---|---|
| 0.1 | `CITATION.cff` | ✅ |
| 0.2 | `.zenodo.json` + tagged release → software DOI | ✅ file · ⬜ release/DOI |
| 0.3 | `codemeta.json` | ✅ |
| 0.4 | `CONTRIBUTING.md` + `CODE_OF_CONDUCT.md` | ✅ |
| 0.5 | `docs/OPEN-SCIENCE.md` (FAIR statement) + this roadmap | ✅ |
| 0.6 | README: FAIR/citing section, badges, self-host callout | 🔜 |
| 0.7 | Sign DORA / note CoARA alignment (maintainer action) | ⬜ |

## Phase 1 — Canonical schema foundations (backbone; 2–5 depend on it)

| # | Item | Files | Status |
|---|---|---|---|
| 1.1 | License field `display.cvLicense` (+ `license.ts` helper) | `canonical/schema.ts`, `canonical/license.ts` | ✅ |
| 1.2 | Per-work `meta.license` from OpenAlex | `build.ts`, `openalex/*`, `schema.ts` | ✅ |
| 1.3 | Persist ROR IDs → `meta.rorId` (+ on positions/affiliations) | `canonical/enrich.ts`, `schema.ts` | ✅ |
| 1.4 | PMID extraction → `meta.pmid` | `build.ts`, `openalex/*`, `schema.ts` | ✅ |
| 1.5 | Funder IDs on grants → `meta.funderId/funderName/awardId` (ORCID-driven + OpenAlex backfill) | `orcid/*`, `build.ts`, `schema.ts` | ✅ |
| 1.6 | Per-item `meta.lastVerifiedAt` | `build.ts`, `schema.ts` | ✅ |
| 1.7 | CRediT roles `meta.creditRoles` (optional, larger) | `schema.ts`, `build.ts` | ⬜ deferred |

## Phase 2 — FAIR public surface (depends on Phase 1)

| # | Item | Files | Status |
|---|---|---|---|
| 2.1 | Enrich public JSON-LD → full schema.org/Person (affiliation/ROR, sameAs, license) | `lib/cv/publicJsonLd.ts` | ✅ |
| 2.2 | Content negotiation on the public route (`ld+json`, CSL-JSON, BibTeX, JSON) + suffix paths | `lib/cv/publicFormats.ts`, `app/p/[slug]/route.ts` | ✅ |
| 2.3 | Gate closed + rate-limit the machine-readable responses | route (reuses limiter + projection) | ✅ |
| 2.4 | OG/Twitter meta tags + per-CV OG image (`/p/[slug]/og`) | `lib/cv/{publicMeta,ogImage}.ts` | ✅ |
| 2.5 | Visible license line on the public HTML page | `lib/render/templates/shared.ts` | ✅ |

## Phase 3 — Interoperable export formats (renderer-switch pattern)

Recipe: add to `RENDER_FORMATS` (`render/types.ts`) → new `render/<fmt>.ts`
implementing `Renderer` → case in `getRenderer()` → add to `EXPORTABLE`
(`api/cv/export/[format]/route.ts`) → i18n strings → tests across 10 locales.
Closest analog: `render/bibtex.ts`.

| # | Format | Status |
|---|---|---|
| 3.1 | CSL-JSON export (items already carry `csl`) — lowest effort | ✅ |
| 3.2 | JSON Résumé | ✅ |
| 3.3 | NIH SciENcv / biosketch (Markdown) | ✅ |
| 3.4 | Europass | ⬜ deferred — official ELM model is a controlled-vocabulary JSON-LD graph |

## Phase 4 — Growth loop (public-page virality + SEO)

| # | Item | Status |
|---|---|---|
| 4.1 | Tasteful "Made with SigmaCV" footer (opt-out, public page only) → referral backlink | ✅ |
| 4.2 | SEO landing pages `/orcid-to-cv` + `/nih-biosketch` (×10 locales; native-review pending) | ✅ |
| 4.3 | Strengthen JSON-LD entity graph (`sameAs` → OpenAlex + ORCID) | ✅ |
| 4.4 | Library / CoARA / OpenAlex-user-group outreach kit ([`OUTREACH.md`](OUTREACH.md)) | ✅ |

## Phase 5 — Give back to the commons (flagship differentiator, v2)

Infrastructure exists today: `canonical/assertions.ts` exposes
`pendingNotMineAssertions()` (read-only). Gated behind a feature flag until the
OpenAlex curation API is confirmed available.

| # | Item | Status |
|---|---|---|
| 5.1 | OpenAlex curation write-client (flag-gated, disabled by default) | ✅ scaffold |
| 5.2 | Endpoint + explicit user opt-in + audit log + rate limit | ✅ |
| 5.3 | Surface "your correction improved the shared record" in the UI | ⬜ deferred — feature disabled until API confirmed |

## Phase 6 — Research-vehicle hardening (parallel, tied to IRB)

| # | Item | Status |
|---|---|---|
| 6.1 | Pre-registration scaffolds for studies 2 & 3 (`docs/preregistration/study-*.md`) | ✅ template (placeholders for the researcher) |
| 6.2 | `RESEARCH_LOGGING_ENABLED` + `OPENALEX_CURATION_ENABLED` stay off until IRB / API | ✅ verified default-off |
| 6.3 | Tool/infrastructure paper (paper 1); cite the Zenodo DOI from 0.2 | ⬜ maintainer action |

## Recommended execution order

1. Phase 0 (parallel, unblocks credibility + DOI).
2. Phase 1.1–1.4 (license + ROR/PMID/work-license) — smallest, unblocks most.
3. Phase 3.1 (CSL-JSON) + Phase 2.1–2.3 (JSON-LD + content negotiation) — highest
   FAIR payoff per unit effort.
4. Phase 4.1 (attribution footer) — turns on the growth loop early.
5. Phase 3.2–3.3 (JSON Résumé, SciENcv) + Phase 4.2 (SEO landing pages).
6. Phase 1.5–1.7, 2.4–2.5 — round out PIDs and metadata.
7. Phase 5 — once OpenAlex curation access is confirmed.
8. Phase 6 — gated on IRB; logging stays off until approved.
