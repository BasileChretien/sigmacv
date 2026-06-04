# e2e/fixtures

Fixtures for the Playwright E2E suite (`e2e/journeys/`, run with `npm run e2e`; `npm run e2e:install` first to get Chromium; `global-setup.ts`/`global-teardown.ts` bracket the run).

E2E runs against a **separate** database (`.env.e2e`, synced via `npm run db:push:e2e`) — never the dev/prod DB.

- `openalex-server.ts` — a local stand-in for the OpenAlex API so journeys are deterministic and offline (no live polite-pool calls).
- `db.ts` / `seed.ts` — provision and seed the e2e database with known users/CVs.
- `auth.ts` — establishes an authenticated session without going through the live ORCID OAuth dance.

Keep fixtures hermetic: a journey must not depend on network, wall-clock, or data left by another journey.
