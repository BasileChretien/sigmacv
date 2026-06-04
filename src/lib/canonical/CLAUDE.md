# canonical

The **single source of truth**. A `CanonicalCv` (curated data + display choices) is one Zod-validated object that every renderer and the public page derive from.

- **`schema.ts`** — the Zod schema + inferred types. `CANONICAL_SCHEMA_VERSION` is pinned; section types + default order, "not mine" reason codes, authorship roles, owner metrics/contact/links all live here. Change shape only deliberately (it's persisted as `Cv.document` JSON and read by every format).
- **`build.ts`** — assembles a `CanonicalCv` from resolved author + works; computes `authoredBySelf` + `selfNameVariants` by **identifier match** (never name string).
- **`curate.ts`** — the curation operations. **Pure and immutable**: every op returns a new object, never mutates. This is where reorder / show-hide / rename / "not mine" live.
- **`assertions.ts`** — keeps the "not mine" research signal (`notMine` + reason) separate from display hiding. `isHidden(item)` is the single predicate renderers use.
- **`enrich.ts`** — folds in ROR (affiliations) and Crossref data.

Invariant: **"not mine" sets `included:false`, it does not delete** — the correction is preserved for the disambiguation study.
