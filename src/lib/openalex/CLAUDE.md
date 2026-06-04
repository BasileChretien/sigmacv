# openalex

Client + mappers for the OpenAlex API (the primary data source). All calls send a polite-pool `mailto` and go through the shared `http.ts` wrapper; tests mock `fetch` (no network).

- **`client.ts`** — paged fetch of works (`cursor`-based, `per-page=200`).
- **`resolveAuthor.ts`** — ORCID → all OpenAlex author IDs (one iD can map to **several** author IDs; collect them all).
- **`toCsl.ts`** — Work → CSL-JSON: type mapping, authorships, `issued`/container/biblio, DOI, id = OpenAlex short id. Author names are `display_name` (no given/family) — split heuristically with a `literal` fallback, and **CJK family-name ordering** is handled so names aren't mis-split. This is the highest-value mapper; changes here ripple into every citation.
- **`deriveMetrics.ts`** — field-normalized metrics from the works (FWCI etc.); metrics are opt-in, default none.
- **`types.ts`** — OpenAlex response shapes.
