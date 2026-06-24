# Deploying SigmaCV (Hetzner VPS + managed Postgres)

A single-VPS deploy using Docker Compose: the **app** (Next.js standalone, ships
Chromium for PDF), **Caddy** (automatic HTTPS), and a **resync cron**. The
database is **managed Postgres (Neon)** — nothing to run or back up on the box.

> You need: a Hetzner account, a domain you control, and your **production**
> ORCID API credentials. Steps that only you can do are flagged 🔑.

---

## 0. What you'll end up with

`https://cv.example.org` → Caddy (TLS) → app:3000 → Neon. ~10–20 min start to finish.

## 1. 🔑 Provision the server (Hetzner Cloud)

1. Hetzner Cloud Console → **New Server**.
2. **Location:** an EU region (e.g. Nuremberg/Falkenstein) — GDPR data residency.
3. **Image:** Ubuntu 24.04.
4. **Type:** `CX22` (2 vCPU / 4 GB) is the minimum; `CX32` (8 GB) builds the
   Chromium image more comfortably.
5. **SSH key:** add yours (avoid password login).
6. Create. Note the server's **IPv4** (and IPv6).

## 2. 🔑 Point your domain at it

At your DNS provider, add records for the host you'll use (e.g. `cv.example.org`):

- `A` → server IPv4
- `AAAA` → server IPv6 (if you have one)

Wait until `dig +short cv.example.org` returns the IP (TLS won't issue until DNS resolves).

## 3. 🔑 Apply the database schema to Neon (one-time)

A baseline migration is committed at `prisma/migrations/0_init`, so the container
entrypoint runs `prisma migrate deploy` on every start.

- **Fresh Neon database:** nothing to do here — `migrate deploy` creates the
  schema on first boot. (Or run it yourself once: `DATABASE_URL="…" npx prisma migrate deploy`.)
- **Reusing a DB whose tables already exist** (e.g. created earlier with
  `db push`): mark the baseline as already-applied ONCE so `migrate deploy`
  doesn't try to recreate the tables:

  ```bash
  DATABASE_URL="postgresql://…neon.tech/neondb?sslmode=require" \
    npx prisma migrate resolve --applied 0_init
  ```

Future schema changes: `npx prisma migrate dev --name <change>` locally, commit
the new folder under `prisma/migrations/`, and `migrate deploy` applies it on deploy.

## 4. Install Docker on the server

SSH in (`ssh root@SERVER_IP`), then:

```bash
apt-get update && apt-get install -y ca-certificates curl git ufw
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update && apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Firewall: allow SSH + HTTP + HTTPS only
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw --force enable
```

## 5. Get the code + configure

```bash
git clone https://github.com/BasileChretien/sigmacv.git
cd sigmacv
cp .env.production.example .env
nano .env        # fill in every value — see notes below
```

Fill `.env`:

- `DATABASE_URL` — your Neon connection string (`?sslmode=require`).
- `AUTH_SECRET` — `openssl rand -base64 33`.
- `AUTH_URL` — `https://cv.example.org` (your domain, no trailing slash).
- `SITE_ADDRESS` — `cv.example.org` (Caddy uses this for TLS).
- `ORCID_CLIENT_ID` / `ORCID_CLIENT_SECRET` — your **production** ORCID app.
- `ORCID_ENVIRONMENT=production`, `OPENALEX_MAILTO=you@example.org`.
- (optional) `RESYNC_SECRET` (≥16 chars) to enable living-CV re-sync.

## 6. 🔑 Add the ORCID redirect URI

In your ORCID app (https://orcid.org/developer-tools), add this **exact** redirect URI:

```
https://cv.example.org/api/auth/callback/orcid
```

(Replace with your domain. Must match `AUTH_URL`'s host.)

## 7. Build + launch

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
docker compose -f docker-compose.prod.yml logs -f app    # watch startup
```

First build pulls the Playwright/Chromium base image (large) — give it a few minutes.

## 8. Verify

- `https://cv.example.org` loads (Caddy issues a Let's Encrypt cert automatically).
- Click **Sign in with ORCID** → you should land on `/cv` with your publications.
- Try **Export → PDF** (exercises Chromium) and **Publish** a public page.

---

## Operations

- **Logs:** `docker compose -f docker-compose.prod.yml logs -f app`
- **Update (redeploy latest) — no downtime:**
  ```bash
  ./scripts/deploy.sh -f docker-compose.prod.yml   # managed-Postgres variant
  # self-hosted Postgres variant (production sigmacv.org): just ./scripts/deploy.sh
  ```
  The script pulls, **builds the new image while the old container keeps
  serving**, then does a fast recreate. Caddy is health-checked with a retry
  window (`health_uri /api/health` + `lb_try_duration`, see `Caddyfile`), so any
  request landing during the swap is held until the new container is ready
  instead of getting a 502. ⚠️ Avoid the old `up -d --build` directly: it
  rebuilds _and then_ recreates the single app container in one step, taking the
  site down for the whole build → every visitor in that window sees a "server
  connection error."
- **Stop / start:** `docker compose -f docker-compose.prod.yml down` / `… up -d`
- **Backups:** handled by Neon (managed) **in this variant only**. Nothing on
  the VPS holds state except Caddy's certs (in a named volume). ⚠️ If you run
  the self-hosted `docker-compose.yml` variant instead (the production
  sigmacv.org setup), Postgres lives on the box: you own backups — daily
  `pg_dump` cron + periodic test-restores + an offsite copy. Step-by-step in
  [`docs/SERVER-RUNBOOK.md`](docs/SERVER-RUNBOOK.md).
- **Database schema changes:** re-run `prisma db push` against the prod DB
  (until migrations are committed — see below).

## Troubleshooting

- **TLS won't issue:** DNS must resolve to the server first; check `dig`. Ensure
  ports 80+443 are open (ufw + any Hetzner Cloud Firewall).
- **ORCID "invalid redirect":** the URI in the ORCID app must be byte-identical to
  `${AUTH_URL}/api/auth/callback/orcid`.
- **App logs `Cannot find module 'pg'` / `@prisma/adapter-pg`:** the Next standalone
  trace missed the driver. Quick fix — add to the runtime stage of `Dockerfile`:
  `RUN cd /app && npm install pg @prisma/adapter-pg`, then rebuild. (Verify on
  first deploy; the build traces them, but this is the one Prisma-7 thing unverified
  outside a container.)
- **502 from Caddy:** the app container is still starting (Chromium image is big) —
  watch `logs -f app` until "Ready". (During a redeploy Caddy now holds requests
  for up to `lb_try_duration` rather than 502ing; a 502 means the boot exceeded
  that window — check the logs for a slow `prisma migrate deploy` or a crash.)

## Notes / follow-ups

- **Commit migrations** for a reproducible schema: `prisma migrate dev --name init`
  locally, commit `prisma/migrations/`, and the entrypoint's `migrate deploy` will
  apply them automatically (today it's a no-op and the schema is `db push`-ed).
- **Self-hosted Postgres alternative:** use `docker-compose.yml` (it runs its own
  `postgres` service) instead of `docker-compose.prod.yml`, and drop `DATABASE_URL`.
  This is what production sigmacv.org runs. Day-2 operations (env audit, backup
  test-restore, hardening, monitoring) are in [`docs/SERVER-RUNBOOK.md`](docs/SERVER-RUNBOOK.md).
