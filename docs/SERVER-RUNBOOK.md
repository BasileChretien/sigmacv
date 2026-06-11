# SigmaCV VPS operations runbook

Post-launch operations checklist for the production server (Hetzner EU VPS,
Ubuntu 24.04, deployment = `docker-compose.yml` — self-hosted Postgres — per
the launch notes; **not** the Neon variant in `DEPLOY.md`). Everything here is
copy-paste-able over SSH. Commands assume the checkout lives at `~/sigmacv`
and compose runs as root; adjust paths if different.

Conventions: each step shows the command, then **Expect:** what a healthy
system prints. Anything else = investigate before moving on.

---

## 1. Environment-variable audit (no secrets printed)

Checks presence/format/length only — never echoes secret values.

```bash
cd ~/sigmacv
for v in POSTGRES_PASSWORD AUTH_SECRET AUTH_URL SITE_ADDRESS \
         ORCID_CLIENT_ID ORCID_CLIENT_SECRET ORCID_ENVIRONMENT \
         OPENALEX_MAILTO RESYNC_SECRET RATE_LIMIT_PERSIST; do
  val=$(grep -E "^${v}=" .env | head -1 | cut -d= -f2- | tr -d '"' )
  case "$v" in
    AUTH_URL|SITE_ADDRESS|ORCID_ENVIRONMENT|OPENALEX_MAILTO|RATE_LIMIT_PERSIST|ORCID_CLIENT_ID)
      echo "$v = ${val:-<UNSET>}" ;;
    *)
      echo "$v length = ${#val}" ;;
  esac
done
```

**Expect:**

| Var                          | Expected                                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| `POSTGRES_PASSWORD length`   | ≥ 32 (output of `openssl rand -base64 24`)                                               |
| `AUTH_SECRET length`         | ≥ 44 (output of `openssl rand -base64 33`); **must be ≥ 32** or `env.ts` refuses to boot |
| `AUTH_URL`                   | `https://sigmacv.org` — **https**, no trailing slash, host = ORCID redirect-URI host     |
| `SITE_ADDRESS`               | `sigmacv.org`                                                                            |
| `ORCID_CLIENT_ID`            | `APP-…` (a **production** ORCID app, not sandbox)                                        |
| `ORCID_CLIENT_SECRET length` | 36 (UUID)                                                                                |
| `ORCID_ENVIRONMENT`          | `production` ← compose defaults to `sandbox` if unset, so this MUST be explicit          |
| `OPENALEX_MAILTO`            | a real monitored mailbox (polite pool)                                                   |
| `RESYNC_SECRET length`       | ≥ 16, or 0 if living-CV resync is intentionally off (endpoint then 503s)                 |
| `RATE_LIMIT_PERSIST`         | `true` (or unset — compose defaults it to true)                                          |

Then confirm the _running container_ actually sees the same (catches a stale
`up` after editing `.env`):

```bash
docker compose exec app sh -c '
  echo "AUTH_URL=$AUTH_URL"; echo "ORCID_ENVIRONMENT=$ORCID_ENVIRONMENT";
  echo "RATE_LIMIT_PERSIST=$RATE_LIMIT_PERSIST";
  [ ${#AUTH_SECRET} -ge 32 ] && echo "AUTH_SECRET: OK (${#AUTH_SECRET} chars)" || echo "AUTH_SECRET: TOO SHORT";
  [ -n "$OPENALEX_MAILTO" ] && echo "OPENALEX_MAILTO: set" || echo "OPENALEX_MAILTO: MISSING"'
```

**Expect:** `AUTH_URL=https://sigmacv.org`, `ORCID_ENVIRONMENT=production`,
`RATE_LIMIT_PERSIST=true`, `AUTH_SECRET: OK`, `OPENALEX_MAILTO: set`.

If you ever ran the analytics profile before 2026-06-11: `plausible_db` used to
default its password to `postgres` when `PLAUSIBLE_DB_PASSWORD` was unset. The
compose default is now empty (fails closed), but **an already-initialized volume
keeps its old password** — rotate it once:

```bash
grep -q '^PLAUSIBLE_DB_PASSWORD=' .env && echo "var present" || echo "ADD PLAUSIBLE_DB_PASSWORD to .env first"
docker compose --profile analytics exec plausible_db \
  psql -U postgres -c "ALTER USER postgres PASSWORD '<the value you put in .env>';"
docker compose --profile analytics up -d   # restart Plausible with the new URL
```

---

## 2. Backup test-restore (pg_dump → scratch DB)

A backup that has never been restored is a hope, not a backup.

```bash
# 2a. Locate the cron + the newest dump (adjust path to your cron's target dir)
crontab -l | grep -i -E 'pg_dump|backup'
ls -lht /var/backups/sigmacv/ 2>/dev/null | head -3   # or wherever the cron writes
```

**Expect:** one cron line; newest file dated today/yesterday, size > 0 and in
the same ballpark as previous dumps (a sudden 10× shrink = broken dump).

```bash
# 2b. Restore into a scratch database INSIDE the postgres container
cd ~/sigmacv
LATEST=$(ls -1t /var/backups/sigmacv/*.sql.gz | head -1); echo "restoring $LATEST"
docker compose exec -T postgres psql -U sigmacv -d postgres -c 'DROP DATABASE IF EXISTS restore_test;'
docker compose exec -T postgres psql -U sigmacv -d postgres -c 'CREATE DATABASE restore_test;'
gunzip -c "$LATEST" | docker compose exec -T postgres psql -q -U sigmacv -d restore_test
```

**Expect:** stream of `CREATE TABLE` / `COPY n` lines, **zero `ERROR:` lines**.
(If your cron uses `pg_dump -Fc` custom format, replace the last line with
`docker compose exec -T postgres pg_restore -U sigmacv -d restore_test < "$LATEST"`.)

```bash
# 2c. Row counts: live vs restored must match (modulo writes since the dump)
for db in sigmacv restore_test; do
  echo "== $db =="
  docker compose exec -T postgres psql -U sigmacv -d "$db" -tc '
    SELECT '"'"'User'"'"', count(*) FROM "User"
    UNION ALL SELECT '"'"'Cv'"'"', count(*) FROM "Cv"
    UNION ALL SELECT '"'"'Account'"'"', count(*) FROM "Account"
    UNION ALL SELECT '"'"'Session'"'"', count(*) FROM "Session"
    UNION ALL SELECT '"'"'OepEditorialRole'"'"', count(*) FROM "OepEditorialRole";'
done
```

**Expect:** the two blocks match (Session may drift slightly).

```bash
# 2d. Clean up
docker compose exec -T postgres psql -U sigmacv -d postgres -c 'DROP DATABASE restore_test;'
```

**⚠️ Gap to close:** if dumps only live on this VPS, a disk failure loses app
_and_ backups. Add an offsite copy — simplest options: a Hetzner Storage Box +
nightly `rclone copy /var/backups/sigmacv remote:sigmacv-backups`, or Hetzner's
server snapshots. Verify offsite freshness monthly.

---

## 3. OEP import (Editorial Roles reference table)

```bash
docker compose exec -T postgres psql -U sigmacv -d sigmacv -tc 'SELECT count(*) FROM "OepEditorialRole";'
```

**Expect:** ≈ **347,000** (definitely not 0). If 0, the Editorial Roles section
is silently empty for everyone. To run the import on the VPS (Postgres is not
published to the host, so run a node container on the compose network):

```bash
cd ~/sigmacv
docker network ls | grep sigmacv          # note the network name, e.g. sigmacv_default
docker run --rm -v "$PWD":/work -w /work --network sigmacv_default \
  --env-file .env -e DATABASE_URL="postgresql://sigmacv:${POSTGRES_PASSWORD}@postgres:5432/sigmacv" \
  node:22-bookworm sh -c 'npm ci && npm run oep:import'
# then re-run the count above — expect ~347k
```

---

## 4. SSH hardening, fail2ban, unattended-upgrades

```bash
# 4a. SSH effective config (what sshd actually enforces, not just the file)
sshd -T 2>/dev/null | grep -E '^(passwordauthentication|permitrootlogin|pubkeyauthentication|kbdinteractiveauthentication)'
```

**Expect:**

```
passwordauthentication no
permitrootlogin prohibit-password     # or "no" if you log in as a non-root user
pubkeyauthentication yes
kbdinteractiveauthentication no
```

If `passwordauthentication yes`: **keep your current SSH session open**, then:

```bash
printf 'PasswordAuthentication no\nKbdInteractiveAuthentication no\nPermitRootLogin prohibit-password\n' \
  > /etc/ssh/sshd_config.d/99-hardening.conf
sshd -t && systemctl reload ssh        # sshd -t validates BEFORE reload
# now open a SECOND terminal and confirm you can still log in with your key
```

```bash
# 4b. fail2ban (SSH brute-force jail)
apt-get install -y fail2ban
printf '[sshd]\nenabled = true\n' > /etc/fail2ban/jail.d/sshd.local
systemctl enable --now fail2ban
fail2ban-client status sshd
```

**Expect:** `Status for the jail: sshd` with `Currently failed/banned` counters
(non-zero "Total failed" within hours is normal internet noise — that's it working).

```bash
# 4c. unattended-upgrades (security patches auto-applied)
apt-get install -y unattended-upgrades
cat /etc/apt/apt.conf.d/20auto-upgrades
systemctl status unattended-upgrades --no-pager | head -3
```

**Expect:** both lines `"1"`:

```
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
```

If the file is missing: `dpkg-reconfigure -plow unattended-upgrades` → Yes.
Note this patches the _host_; container images are step 5. A kernel update still
needs an occasional manual `reboot` (check `/var/run/reboot-required`).

```bash
# 4d. Firewall + nothing unexpected listening
ufw status
ss -tlnp | grep -vE '127\.0\.0\.1|\[::1\]'
```

**Expect:** ufw allows `OpenSSH`, `80`, `443` only. Public listeners: sshd on
22 and docker-proxy on 80/443 (Caddy) — **no 5432/3000/8123** on `0.0.0.0`.
(Docker publishes ports by bypassing ufw, so `ss` is the real check.)

---

## 5. Docker base-image freshness + rebuild cadence

The app image is **built locally** from the Playwright base — `docker compose
pull` alone never refreshes it. The rebuild that picks up base-image security
fixes is `build --pull`.

```bash
cd ~/sigmacv
docker images --format 'table {{.Repository}}:{{.Tag}}\t{{.CreatedSince}}' | head -10
```

**Expect:** no image older than ~1 month (`postgres:16-alpine`,
`caddy:2-alpine`, `curlimages/curl`, the playwright base, the built app).

**Monthly cadence (or after a relevant CVE):**

```bash
cd ~/sigmacv
git pull
docker compose pull                          # postgres / caddy / curl
docker compose build --pull app              # re-pull the Playwright base layer
docker compose up -d
docker image prune -f                        # drop the superseded layers
curl -fsS -o /dev/null -w '%{http_code}\n' https://sigmacv.org/   # expect 200
```

Postgres stays on the `16-alpine` line (minor bumps auto-apply on pull; a major
16→17 jump is a deliberate migration — don't change the tag casually).

---

## 6. Disk space + log rotation

```bash
df -h / ; echo ---- ; docker system df
```

**Expect:** root FS < 80 % used. If "Build Cache" or "Images (reclaimable)" is
huge: `docker builder prune -f` / `docker image prune -f`.

```bash
# Container log rotation — unbounded json-file logs are the classic silent disk-filler
cat /etc/docker/daemon.json 2>/dev/null || echo "NO daemon.json — logs are UNBOUNDED"
```

**Expect:** a `log-opts` block. If missing, create it and restart Docker (brief
downtime, ~30 s, containers restart automatically):

```bash
cat > /etc/docker/daemon.json <<'EOF'
{ "log-driver": "json-file", "log-opts": { "max-size": "20m", "max-file": "5" } }
EOF
systemctl restart docker && cd ~/sigmacv && docker compose up -d
# NOTE: the limit only applies to containers created AFTER the change —
# `up -d` recreates them. Verify:
docker inspect -f '{{.HostConfig.LogConfig}}' $(docker compose ps -q app)
```

**Expect:** `{json-file map[max-file:5 max-size:20m]}`.

Host logrotate (syslog etc.) is on by default on Ubuntu — nothing to do.
Backup dir growth: cap it in the backup cron, e.g. append
`find /var/backups/sigmacv -name '*.sql.gz' -mtime +14 -delete` (only once
offsite copies exist, step 2).

---

## 7. Uptime + error alerting (none exists today)

**Recommended: external pinger first.** Anything self-hosted on this VPS
(including Uptime Kuma) dies with the box and alerts you about nothing.

1. Sign up at UptimeRobot (free tier) or equivalent (Hetzner has no built-in
   HTTP checks).
2. Monitor 1 — HTTPS keyword check: `https://sigmacv.org/` must return 200
   **and contain** `SigmaCV` (catches a Caddy-up/app-down 502 serving an error
   page). Interval 5 min, alert → your real mailbox (+ phone push app).
3. Monitor 2 — SSL certificate expiry alert (UptimeRobot does this on the same
   monitor; Caddy auto-renews, this catches renewal failures).
4. Optional Monitor 3 — `https://plausible.sigmacv.org/` if analytics runs.

**Optional second layer — Uptime Kuma on the box** (nice dashboard, catches
_internal_ failures like postgres unhealthy; not a substitute for the external
ping). Add to `docker-compose.yml`:

```yaml
uptime-kuma:
  image: louislam/uptime-kuma:1
  restart: unless-stopped
  volumes:
    - kuma_data:/app/data
  expose:
    - "3001"
# …and under volumes:
kuma_data:
```

plus a Caddy block (reuse the dormant-by-default pattern):
`{$KUMA_ADDRESS::8083} { reverse_proxy uptime-kuma:3001 }` and
`KUMA_ADDRESS=status.sigmacv.org` in `.env` + DNS A-record. First visit creates
the admin account — do that immediately after `up -d`.

**Minimal error alerting** (until something richer is wanted) — a daily digest
of app errors mailed/pushed via [ntfy.sh](https://ntfy.sh) (no signup, pick an
unguessable topic name):

```bash
cat > /etc/cron.daily/sigmacv-error-digest <<'EOF'
#!/bin/sh
ERRS=$(cd /root/sigmacv && docker compose logs --since 24h app 2>&1 | grep -iE '"level":"error"|Error:' | tail -50)
[ -n "$ERRS" ] && printf '%s' "$ERRS" | curl -fsS -T - -H "Title: SigmaCV errors (24h)" https://ntfy.sh/<YOUR-RANDOM-TOPIC> >/dev/null
EOF
chmod +x /etc/cron.daily/sigmacv-error-digest
# test it once:
/etc/cron.daily/sigmacv-error-digest && echo "digest script ran"
```

**Expect:** a push in the ntfy app only on days with errors; silence otherwise.

---

## 8. GDPR operations note (data-subject requests)

- **Where requests arrive:** `privacy@sigmacv.org` — the address published in
  the privacy policy and contact page (`src/lib/i18n/contact.ts`). The code
  comment says "set up this mailbox/forward before going live": **verify the
  forward actually exists** (send yourself a test mail from an external account
  and confirm delivery to the mailbox Basile reads). If it bounces, that is a
  compliance gap — fix at the domain's mail provider today.
- **Who reads it:** Basile (sole operator). Check it at least weekly; turn on
  forwarding/notifications so a DSR can't sit unseen.
- **The clock:** GDPR Art. 12(3) — respond **without undue delay, at latest
  within one month of receipt** (extendable by two further months for complex
  cases, but you must tell the requester _within the first month_). Japan APPI
  has no fixed statutory deadline but expects comparable promptness — treat one
  month as the bar for both.
- **Most requests are self-service:** account page already offers full data
  export and one-click deletion — the standard reply to access/erasure requests
  is to point the (identity-verified) user there; for users who can't log in,
  verify identity (e.g. signed mail from the ORCID-linked address), then
  export/delete on their behalf.
- **Keep a DSR log** (a private spreadsheet is fine): date received, requester,
  type (access/erasure/rectification/portability), action taken, date closed.
  This is your accountability evidence (Art. 5(2)).
- **On receipt:** acknowledge same week, set a calendar reminder at day 21,
  close by day 30.
