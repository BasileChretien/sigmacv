# openalex

Client + mappers for the OpenAlex API (the primary data source). All calls send a polite-pool `mailto` and go through the shared `http.ts` wrapper; tests mock `fetch` (no network).

- **`client.ts`** — paged fetch of works (`cursor`-based, `per-page=200`).
- **`resolveAuthor.ts`** — ORCID → all OpenAlex author IDs (one iD can map to **several** author IDs; collect them all).
- **`authorNames.ts`** — repairs each work's author list where the payload arrives (both work fetchers in `client.ts`): the name printed on the work (`raw_author_name`) replaces a profile name that is garbled (U+FFFD) or in another script than a Latin byline; a byline deposited twice is collapsed (`text/authorRuns.ts`: a run of ≥ 3 names, never across two different ORCIDs, never above 500 authors), keeping the better-identified copy (the owner's author id, then an ORCID); names are cleaned (`text/personName.ts`). Stored CVs get the same STRING repair on read (`canonical/migrateAuthorNames.ts`) — never a collapse there: stored names are profile names, which collide on large collaborations — and frozen snapshots skip it.
- **`toCsl.ts`** — Work → CSL-JSON: type mapping, authorships, `issued`/container/biblio, DOI, id = OpenAlex short id. Author names are `display_name` (no given/family) — split heuristically with a `literal` fallback, and **CJK family-name ordering** is handled so names aren't mis-split. This is the highest-value mapper; changes here ripple into every citation.
- **`deriveMetrics.ts`** — field-normalized metrics from the works (FWCI etc.); metrics are opt-in, default none.
- **`types.ts`** — OpenAlex response shapes.
