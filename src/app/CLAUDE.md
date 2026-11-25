# app

Next.js 15 App Router: routes, server actions, and API handlers.

## Routes

- Marketing/legal pages (`page.tsx`, `about/`, `privacy/`) are mirrored under **`[locale]/`** for the ten locales; the bare versions default to en-US. `manifest.ts`, `robots.ts`, `opengraph-image.tsx` are the PWA/SEO surfaces.
- **`cv/page.tsx`** — the protected editor (server component that loads the CV, then hands off to the client `CvWorkspace`). It checks the session itself (`auth()`, redirect to `/` without one).
- **`p/[slug]/route.ts`** — serves the living public CV page (re-syncs from sources).
- **`search/`** (+ its `[locale]` twin) — the name lookup: OpenAlex author search, ORCID-bearing rows only, no figure, own rate buckets, `no-store` — see `src/lib/openalex/authorSearch.ts`.
- **`i/compare/`** (+ twin) — the institution comparison view: two or three organisations' stored OpenAlex snapshots side by side, alphabetical, noindex, never a rank — see `src/lib/institutions/compare.ts`; `i/compare.json` is its counts-only CC0 export (`compareExport.ts`).

## `proxy.ts` and the CSP

`src/proxy.ts` (the Next 16 rename of `middleware.ts`) sets the per-request CSP only: locale resolution lives in the route files and auth gating in the API routes/pages themselves.

- The CSP has two production shapes, a nonce for routes rendered per request and inline-script hashes read off the build for prerendered ones — see `src/lib/security/csp.ts`. `npm run e2e` runs `next dev`, whose policy allows every script, so a CSP change is only proven by `npm run e2e:prod`.
- `not-found.tsx`, the 404, is `force-dynamic` so that it gets a nonce, and must never read the request (`headers()`, `cookies()`, `connection()`): Next renders it into the tree of every page as that page's not-found boundary, and every prerendered page would turn dynamic.
- **`fonts/inter.ts`** — the app-shell font (Inter), loaded with `next/font/local` from the files committed in `fonts/inter/`. Never add a font through `next/font/google`: it fetches Google's stylesheet on every build, and that fetch fails builds at random (vercel/next.js#99114). `tests/app-shell-font.test.ts` enforces it. The CV document's own fonts are a separate system (`src/lib/render/fonts/`).

## API (`app/api/**`)

Handlers are **thin**: validate the request with Zod, call into `lib/`, return a consistent envelope. No business logic here.

- `cv/route.ts` (GET load / PATCH save the canonical doc), `cv/sync`, `cv/preview` (doc→HTML for the live editor), `cv/publish`, `cv/style/resolve`.
- `account/consent`, `account/export` (data portability), `account/route.ts` (deletion).
- `internal/resync` — cron entrypoint for scheduled public re-sync (auth-guarded).
- `auth/[...nextauth]` — Auth.js handler.

`auth-actions.ts` holds server actions. Read config only through `lib/env.ts`. Expensive routes are rate-limited (`lib/rateLimit.ts`).
