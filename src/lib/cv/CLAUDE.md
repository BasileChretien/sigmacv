# cv

CV lifecycle operations over the persisted `Cv.document`.

- **`sync.ts`** — (re)build a user's `CanonicalCv` from the open sources while **preserving their curation** (display choices, "not mine" decisions, ordering, manual entries). New works are merged in; user corrections are never clobbered.
- **`resync.ts`** — the scheduled public re-sync (driven by `app/api/internal/resync` cron) so a published "living" page stays current. Ordering of new vs. existing items is deterministic.
- **`publicJsonLd.ts`** — emits schema.org JSON-LD for the public CV page (SEO / structured data).

These compose `canonical/build` + `canonical/curate`; keep merge logic here, not in route handlers.
