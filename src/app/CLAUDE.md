# app

Next.js 16 App Router: routes, server actions, and API handlers.

`src/proxy.ts` (the Next 16 rename of `middleware.ts`) sets the per-request CSP only: locale resolution lives in the route files, auth gating in the API routes and pages themselves. The CSP rules (two production shapes, `npm run e2e:prod`, `not-found.tsx`) are in the root `CLAUDE.md`.

## Routes

- Marketing/legal pages (`page.tsx`, `about/`, `privacy/`) are mirrored under **`[locale]/`** for the ten locales; the bare versions default to en-US. `manifest.ts`, `robots.ts`, `opengraph-image.tsx` are the PWA/SEO surfaces.
- **`cv/page.tsx`** — the protected editor (server component that checks the session, loads the CV, then hands off to the client `CvWorkspace`).
- **`p/[slug]/route.ts`** — serves the living public CV page (re-syncs from sources).
- **`search/`** (+ its `[locale]` twin) — the name lookup: OpenAlex author search, ORCID-bearing rows only, no figure, its own rate buckets, `no-store`. See `src/lib/openalex/authorSearch.ts`.
- **`i/compare/`** (+ twin) — the institution comparison view: two or three organisations' stored OpenAlex snapshots side by side, alphabetical, noindex, never a rank. See `src/lib/institutions/compare.ts`. `i/compare.json` is its counts-only CC0 export (`compareExport.ts`).
- **`fonts/inter.ts`** — the app-shell font (Inter), loaded with `next/font/local` from the files committed in `fonts/inter/`. Never add a font through `next/font/google`: it fetches Google's stylesheet on every build, and that fetch fails builds at random (vercel/next.js#99114). `tests/app-shell-font.test.ts` enforces it. The CV document's own fonts are a separate system (`src/lib/render/fonts/`).

## API (`app/api/**`)

Handlers are **thin**: validate the request with Zod, call into `lib/`, return a consistent envelope. No business logic here.

- `cv/route.ts` (GET load / PATCH save the canonical doc), `cv/sync`, `cv/preview` (doc→HTML for the live editor), `cv/publish`, `cv/style/resolve`.
- `account/consent`, `account/export` (data portability), `account/route.ts` (deletion).
- `internal/resync` — cron entrypoint for scheduled public re-sync (auth-guarded).
- `auth/[...nextauth]` — Auth.js handler.

`auth-actions.ts` holds server actions. Read config only through `lib/env.ts`. Expensive routes are rate-limited (`lib/rateLimit.ts`).
