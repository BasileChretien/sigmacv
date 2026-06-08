# lib

All domain logic. This is the **only** tree the coverage gate measures (`src/lib/**`, thresholds in `vitest.config.ts`): after changes here run `npm run typecheck` then `npm run coverage`.

## The spine: canonical object → renderers

`canonical/schema.ts` defines the **single source of truth** — one Zod-validated `CanonicalCv` = curated data + display choices (`schemaVersion` is pinned and migrations are explicit). Everything downstream is a pure function of it:

- `canonical/build.ts` assembles a `CanonicalCv` from external data; `canonical/curate.ts` holds the **pure, immutable** curation ops (toggle "not mine", reorder, show/hide, rename) — never mutate in place, always return a new object. `canonical/enrich.ts` adds ROR/Crossref data; `canonical/assertions.ts` separates the "not mine" research signal from display hiding.
- `render/` turns the canonical object into every output format (see `render/CLAUDE.md`).

## Load-bearing invariants

- **Name highlighting is identifier-driven** — match the account holder by ORCID / OpenAlex author ID, **never** by name string (common names / CJK scripts would false-match). `citeproc/highlight.ts`.
- **"Not mine" hides, never deletes** — it sets `included:false` (+ a reason code) so the disambiguation-correction signal is preserved for research.
- **Citations come only from citeproc** so every format is identical. `citeproc/engine.ts` builds the CSL engine from vendored assets (`npm run fetch-csl` populates them); `citeproc/styleCatalog.ts` + `customStyle.ts` manage selectable styles.

## External clients (`openalex/ orcid/ crossref/ datacite/ ror/ oep/`)

Each wraps one open API. All send a polite-pool `mailto`, go through the shared `http.ts` fetch wrapper, and are **unit-tested with mocked `fetch`** (no network in tests). `openalex/toCsl.ts` (Work→CSL-JSON) and `resolveAuthor.ts` (ORCID→author IDs, handles the multi-ID case) are the highest-traffic mappers.

## Cross-cutting

- `cv/sync.ts` rebuilds a CV from sources; `cv/resync.ts` is the scheduled public re-sync; `cv/publicJsonLd.ts` emits structured data for the public page.
- `i18n/` — typed per-locale string records for **ten** locales; adding a key forces all ten (compile error otherwise).
- `research/` — consent-gated logging + `diff`; only writes when the user has opted in (GDPR/APPI, IRB).
- `rateLimit.ts` + `rateLimitStore.ts` — Postgres-backed limiting on expensive routes.
