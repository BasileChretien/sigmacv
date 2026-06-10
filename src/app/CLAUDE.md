# app

Next.js 15 App Router: routes, server actions, and API handlers.

## Routes

- Marketing/legal pages (`page.tsx`, `about/`, `privacy/`) are mirrored under **`[locale]/`** for the ten locales; the bare versions default to en-US. `manifest.ts`, `robots.ts`, `opengraph-image.tsx` are the PWA/SEO surfaces.
- **`cv/page.tsx`** — the protected editor (server component that loads the CV, then hands off to the client `CvWorkspace`). Gated by `proxy.ts` (the Next 16 rename of `middleware.ts`).
- **`p/[slug]/route.ts`** — serves the living public CV page (re-syncs from sources).

## API (`app/api/**`)

Handlers are **thin**: validate the request with Zod, call into `lib/`, return a consistent envelope. No business logic here.

- `cv/route.ts` (GET load / PATCH save the canonical doc), `cv/sync`, `cv/preview` (doc→HTML for the live editor), `cv/publish`, `cv/style/resolve`.
- `account/consent`, `account/export` (data portability), `account/route.ts` (deletion).
- `internal/resync` — cron entrypoint for scheduled public re-sync (auth-guarded).
- `auth/[...nextauth]` — Auth.js handler.

`auth-actions.ts` holds server actions. Read config only through `lib/env.ts`. Expensive routes are rate-limited (`lib/rateLimit.ts`).
