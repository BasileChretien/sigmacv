# prisma

Database schema + migrations (PostgreSQL). The Prisma **client** is generated into `src/generated/prisma/` (never edited by hand).

## Data model (`schema.prisma`)
- Auth.js standard models: `User`, `Account`, `Session`, `VerificationToken`. `User` adds `orcid` (`@unique`) and the research-consent fields (`researchConsent` default `false`, `researchConsentAt`, `researchConsentVersion`).
- **`Cv`** — one row per user; `document Json` holds the entire `CanonicalCv` (the single source of truth). Migrations of that JSON shape are handled in code via `schemaVersion`, not SQL.
- **`ResearchEvent`** — append-only research log. **Nothing is written here unless `User.researchConsent` is true**, and it cascade-deletes with the user (GDPR/APPI).
- `RateLimitWindow` — backs the Postgres rate limiter.

## Workflow
The dev DB (Neon) is **push-managed**: `npm run db:push` (or the automatic `predev` → `scripts/ensure-db.mjs`, which fingerprints the schema and pushes only on change). Use `dotenv -e .env` (the npm scripts do) — a bare `npx prisma …` falls back to a placeholder URL and fails `P1001`. `npm run db:migrate` is the migration-history path for a fresh DB / Docker. Migration files under `migrations/` are kept consistent with `schema.prisma` by tests — regenerate them when you change the schema.
