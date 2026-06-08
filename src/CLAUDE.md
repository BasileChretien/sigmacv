# src

Next.js 15 App Router application code. See the repository-root `CLAUDE.md` for the load-bearing architecture and commands; this file covers what's specific to `src/`.

## Layout

- **`app/`** — routes + server actions + API. Public marketing/legal pages are duplicated under **`app/[locale]/`** for the ten supported locales; the bare versions default to en-US. `middleware.ts` handles locale resolution and gates `/cv` behind auth. API handlers under `app/api/**` are thin: they validate input (Zod), call into `lib/`, and shape responses — keep business logic in `lib/`, not in route files.
- **`lib/`** — all domain logic and the only tree the coverage gate measures. (Has its own `CLAUDE.md`.)
- **`components/`** — React client components for the editor/preview and account/publish/consent controls.
- **`generated/prisma/`** — generated Prisma client. **Build output — never hand-edit**; `postinstall` / `npm run db:generate` regenerates it.
- **`types/`** — ambient declarations (`csl.ts`, `next-auth.d.ts`).
- **`auth.ts` / `auth.config.ts`** — Auth.js v5 (ORCID OIDC + Google + email). `env.ts` is the Zod-validated env boundary — read config through it, never `process.env` directly.

## Conventions

- Server-only modules must not be imported into client components. The editor talks to the server through `app/api/cv/*`.
- Validate every request body/query at the route with Zod before it reaches `lib/`.
