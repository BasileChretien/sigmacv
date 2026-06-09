# Analytics (cookieless, first-party, self-hosted)

How SigmaCV measures usage **without** breaking its own privacy promise. Two
self-hosted tools, both in `docker-compose.yml` behind an `analytics` profile:

| Tool          | Answers                                                                                         | Data source                                  | Reached at              |
| ------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------- | ----------------------- |
| **Plausible** | live visitors, daily traffic, referrers, countries, devices, top pages                          | a cookieless tag on the site                 | `plausible.sigmacv.org` |
| **Metabase**  | signups/day, provider mix, publish rate, sync health, **aggregate** affiliation distribution, … | a **read-only** role on the SigmaCV Postgres | `admin.sigmacv.org`     |

**Scope is aggregate-only.** Never build per-identified-person profiles here;
anything tied to the research questions (mine/not-mine corrections) stays inside
the consent + IRB-gated `ResearchEvent` pipeline (`src/lib/research/`), not this.

**Privacy posture.** Everything is cookieless and first-party — no third parties,
no cross-site tracking. This keeps the privacy notice's "no cookie banner needed"
claim accurate (see `src/lib/i18n/privacy.ts`). Plausible's script sets no cookies
and stores no persistent identifier.

---

## What runs where

All five analytics containers are **internal-only** (`expose`, never `ports`) and
gated behind the Compose `analytics` profile, so a plain `docker compose up -d`
does **not** start them and behaves exactly as before.

- `plausible` (app) + `plausible_db` (its config Postgres) + `plausible_events_db`
  (ClickHouse event store, tuned for <16 GB RAM — fine on the 8 GB VPS).
- `metabase` (BI) + `metabase_db` (its own config Postgres — holds dashboards,
  NOT analytics data).

Caddy fronts two extra site blocks: `plausible.sigmacv.org` (public — the tracking
script + event endpoint must be reachable; the dashboard is guarded by Plausible's
own login) and `admin.sigmacv.org` (Metabase, guarded by Metabase's own login).

---

## One-time setup

### 1. DNS

Add two A-records pointing at the VPS (same IP as `sigmacv.org`):

```
plausible.sigmacv.org   A   <vps-ip>
admin.sigmacv.org       A   <vps-ip>
```

### 2. Read-only DB role (for Metabase)

Metabase reads the SigmaCV DB through a role that physically cannot write. Run
once, inside the running Postgres container, with a strong password
(`openssl rand -base64 24`):

```bash
docker compose exec postgres psql -U sigmacv -d sigmacv
```

```sql
CREATE ROLE metabase_ro LOGIN PASSWORD 'CHANGE_ME';
GRANT CONNECT ON DATABASE sigmacv TO metabase_ro;
GRANT USAGE ON SCHEMA public TO metabase_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO metabase_ro;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO metabase_ro;
```

Verify it's read-only:

```sql
SET ROLE metabase_ro;
SELECT count(*) FROM "User";          -- works
INSERT INTO "User"(id) VALUES ('x');  -- ERROR: permission denied  ✅
RESET ROLE;
```

> Run the `ALTER DEFAULT PRIVILEGES` line as the table owner (`sigmacv`) so
> future tables (e.g. a later `UsageEvent`) are auto-granted SELECT.

### 3. Secrets + env

Fill the **Analytics** block in `.env` (template: `.env.production.example`).
Generate the secrets, piping each through `| tr -d '\n'` so it stays on one line:

- `PLAUSIBLE_SECRET_KEY_BASE` = `openssl rand -base64 48` (≥ 64 chars)
- `PLAUSIBLE_TOTP_VAULT_KEY` = `openssl rand -base64 32` — **REQUIRED**: Plausible
  v3 refuses to boot if it's blank, and it must be Base64-encoded 32 bytes (**not**
  hex), or you'll get `TOTP_VAULT_KEY must be Base64 encoded 32 bytes`.
- `METABASE_DB_PASSWORD` / `PLAUSIBLE_DB_PASSWORD` = `openssl rand -base64 24`

Set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=sigmacv.org` and
`NEXT_PUBLIC_PLAUSIBLE_SRC=https://plausible.sigmacv.org/js/script.js`.

> Only set the two `NEXT_PUBLIC_PLAUSIBLE_*` vars when you actually run the
> analytics profile — otherwise the site ships a tracking tag pointing at a host
> that isn't running.

### 4. Deploy with the analytics profile

```bash
git pull
docker compose --profile analytics up -d --build
```

The `--build` rebuilds the app so the (build-time-inlined) `NEXT_PUBLIC_PLAUSIBLE_*`
tag is baked in. Omit `--profile analytics` on future deploys to leave analytics
untouched; include it whenever you want the analytics containers reconciled.

### 5. First-run app setup

- **Plausible** → visit `https://plausible.sigmacv.org`, register your admin
  account, then add a site with domain **`sigmacv.org`**. Now set
  `PLAUSIBLE_DISABLE_REGISTRATION=true` in `.env` and
  `docker compose --profile analytics up -d` again so no stranger can sign up.
- **Metabase** → visit `https://admin.sigmacv.org`, create the admin user, then
  **Add a database** → PostgreSQL:
  - Host `postgres`, Port `5432`, Database `sigmacv`
  - User `metabase_ro`, Password = the role password from step 2.

---

## Starter Metabase questions (SQL, read-only)

```sql
-- Signups per day
SELECT date_trunc('day', "createdAt") AS day, count(*)
FROM "User" GROUP BY 1 ORDER BY 1;

-- Sign-in provider mix
SELECT provider, count(DISTINCT "userId")
FROM "Account" GROUP BY 1 ORDER BY 2 DESC;

-- Publish + indexable rates
SELECT count(*) FILTER (WHERE published) AS published,
       count(*) FILTER (WHERE "publicIndexable") AS indexable,
       count(*) AS total
FROM "Cv";

-- Sync freshness (CVs synced in last 7 days)
SELECT count(*) FILTER (WHERE "lastSyncedAt" > now() - interval '7 days') AS fresh,
       count(*) AS total
FROM "Cv";

-- Total curated items across all CVs (document.sections[].items[])
SELECT count(*) AS items
FROM "Cv",
     LATERAL jsonb_array_elements(document -> 'sections') AS s,
     LATERAL jsonb_array_elements(s -> 'items') AS i;

-- AGGREGATE institution distribution by ROR id across all CV items.
-- Affiliations are NOT a flat owner field: they live on item meta.rorId
-- (ROR-enriched) and in the positions/employment sections. Aggregate only —
-- never expose per-person rows on a dashboard.
SELECT i -> 'meta' ->> 'rorId' AS ror_id, count(*) AS items
FROM "Cv",
     LATERAL jsonb_array_elements(document -> 'sections') AS s,
     LATERAL jsonb_array_elements(s -> 'items') AS i
WHERE i -> 'meta' ->> 'rorId' IS NOT NULL
GROUP BY 1 ORDER BY 2 DESC LIMIT 25;
```

> Item paths follow `CanonicalCv` (`document.sections[].items[].meta`) — see
> `src/lib/canonical/schema.ts`. There is no flat `owner.affiliations`: ROR ids
> resolve to institution names via ROR, and name-level breakdowns are best built
> interactively from the positions/employment section items once connected.

---

## Optional hardening

Add a second factor at the edge for the Metabase block: uncomment `basic_auth`
in `Caddyfile`, set `ADMIN_USER` + `ADMIN_PASSWORD_HASH` (generate the hash with
`docker run --rm caddy:2-alpine caddy hash-password`), redeploy.

## Feature-usage custom events

Cookieless Plausible custom events fire from the editor via the
`trackEvent()` helper (`src/lib/analytics/track.ts`). They carry only neutral
product signals — never personal data, CV content, or a mine/not-mine correction
(those stay on the consent + IRB-gated `ResearchEvent` path):

| Event      | Props                                   | Fired when                       |
| ---------- | --------------------------------------- | -------------------------------- |
| `Export`   | `format` (pdf/docx/latex/markdown/html) | a CV is exported                 |
| `Template` | `template` (classic/modern/…)           | a different template is selected |
| `Publish`  | `indexable` (bool)                      | a public page is published       |

They appear under **Goals / Custom events** in the Plausible dashboard once you
add them there (Site settings → Goals → Custom event). No extra deploy needed —
the `window.plausible()` queue stub is already in the root layout.
