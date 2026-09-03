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
keeps its old password** — rotate it once (_done on sigmacv.org 2026-06-11_).
Use a **hex** password — it's embedded in Plausible's `postgres://` URL, where
base64's `+`/`/`/`=` break authentication (crash-loop on `invalid_password`):

```bash
PW=$(openssl rand -hex 24)
grep -q '^PLAUSIBLE_DB_PASSWORD=' .env \
  && sed -i "s|^PLAUSIBLE_DB_PASSWORD=.*|PLAUSIBLE_DB_PASSWORD=\"$PW\"|" .env \
  || printf 'PLAUSIBLE_DB_PASSWORD="%s"\n' "$PW" >> .env
docker compose exec -T plausible_db \
  psql -U postgres -c "ALTER USER postgres PASSWORD '$PW';" </dev/null
docker compose up -d plausible   # RECREATE (a plain restart keeps the old URL)
```

---

## 2. Backup test-restore (pg_dump → scratch DB)

A backup that has never been restored is a hope, not a backup.

> **Automated:** `scripts/verify-backup.sh` performs everything in this section
> unattended — newest dump, age, size (absolute and against the previous dump,
> which is what catches a pg_dump that errored halfway and still wrote a valid
> gzip), a real restore into a throwaway database, and a row-count comparison
> against live. It only ever reads the live database, always drops the scratch
> copy, and exits non-zero on any failure.
>
> Install it on the server:
>
> ```bash
> cd /root/sigmacv   # wherever the checkout lives
> ./scripts/verify-backup.sh            # run once by hand first
> crontab -e
> # 15 4 * * * cd /root/sigmacv && ./scripts/verify-backup.sh >> /var/log/sigmacv-backup-verify.log 2>&1
> ```
>
> Set `HEARTBEAT_URL` to a healthchecks.io (or UptimeRobot heartbeat) URL and it
> pings **only on success**, so both a failed check and a check that stopped
> running alert you — a verifier that quietly dies is the same risk as a backup
> that quietly dies. Tunables: `BACKUP_DIR`, `BACKUP_GLOB`, `MAX_AGE_HOURS`,
> `MIN_SIZE_RATIO`, `PG_SERVICE`, `PG_USER`, `PG_DB`, `SCRATCH_DB`.
>
> The manual steps below remain the reference for what it does, and for
> investigating by hand when it reports a failure.

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

### The dump itself (`scripts/pg-backup.sh`)

Runs nightly on the VPS. It lived only at `/root/sigmacv-backup.sh` — unversioned,
unreviewed, and destroyed by the very failure it protects against — so it is now in
the repo. Cron:

```
30 3 * * * /root/sigmacv/scripts/pg-backup.sh >> /var/log/sigmacv-backup.log 2>&1
```

It verifies the gzip stream and a minimum size **before** rotating, so a truncated
dump can never age out a good one. Credentials come from the container's environment,
never a command line.

**It dumps three databases, not one** (since 2026-09-02): the app's `postgres`, plus
`metabase_db` and `plausible_db`, written as `sigmacv-*`, `metabase-*` and
`plausible-*` in `/root/sigmacv-backups`. Each is validated and rotated
independently, so a failure in one can neither stop the others nor age away their
good dumps; any failure still exits non-zero. Before this, only the app database was
backed up — Metabase's dashboards and questions, which nothing recreates, had no copy
at all.

Two things worth knowing:

- `plausible_db` sets only `POSTGRES_PASSWORD`, so its user (`postgres`) and database
  name (`plausible_db`, **not** `postgres`) are named explicitly in the script rather
  than read from the container. Get that wrong and `pg_dump` writes nothing while gzip
  still produces a valid ~20-byte file — only the size floor catches it.
- **Plausible's analytics events are NOT covered.** They live in ClickHouse
  (`plausible_events_db`), which needs its own mechanism; `plausible_db` holds only
  sites, users and settings. Treat the traffic history as expendable until a ClickHouse
  backup exists.

Only the **app** dump gets the full restore-verification in §2 above
(`scripts/verify-backup.sh`, anchored to `sigmacv-*.sql.gz`): it restores into the
`postgres` service and compares the `User`/`Cv` tables, so it is app-specific by
construction. The other two get the gzip and size checks at dump time.

### 2b. ClickHouse — Plausible's analytics events (`scripts/clickhouse-backup.sh`)

Postgres is not the whole picture: Plausible keeps its **events** in ClickHouse
(`plausible_events_db`), a different engine needing a different mechanism. Cron, ten
minutes after the Postgres dump so the two never contend:

```
40 3 * * * /root/sigmacv/scripts/clickhouse-backup.sh >> /var/log/sigmacv-backup.log 2>&1
45 4 * * * cd /root/sigmacv && ./scripts/clickhouse-verify-backup.sh >> /var/log/sigmacv-backup-verify.log 2>&1
```

It writes `clickhouse-YYYYMMDD-HHMMSS.tar.gz` beside the Postgres dumps, keeping 14.
The artefact holds `schema.sql`, `manifest.tsv` (table, engine, row count at dump
time) and `data/<table>.native` per non-empty table. **Note the extension** — it is a
`.tar.gz`, not `.sql.gz`, which is why `pull-backups.ps1` globs `*.gz`.

Three things about it are load-bearing and easy to get wrong:

- **Dependency order.** The graph runs both ways: a dictionary reads a table
  (`location_data` → `location_data_dict`), and tables read dictionaries —
  `events_v2` has `ALIAS`/`MATERIALIZED` columns calling `dictGet(…)`. Neither
  "tables first" nor "dictionaries first" restores, and ordering by dependency
  _count_ is not safe either (`imported_locations` and `location_data_dict` both have
  exactly one). The script topologically sorts ClickHouse's own graph
  (`system.tables.loading_dependencies_table`) so `schema.sql` applies top to bottom.
- **`Native` format**, not TSV/CSV: `events_v2` carries `Array` and `Map` columns
  that a text round-trip would not restore faithfully.
- **`--optimize_on_insert 0` when restoring.** It defaults to 1 and applies
  collapsing during the insert, so a `VersionedCollapsingMergeTree` like
  `sessions_v2` comes back with fewer physical rows than were dumped. Restore exactly
  what was dumped; normal merges will collapse it later just as the source would.

**Restoring for real** (the database is gone, not a verification):

```bash
cd /root/sigmacv
tar -xzf /root/sigmacv-backups/clickhouse-<TS>.tar.gz -C /tmp/chrestore
# schema.sql is fully qualified and already in dependency order — apply as-is.
docker compose exec -T plausible_events_db clickhouse-client --multiquery < /tmp/chrestore/schema.sql
for f in /tmp/chrestore/data/*.native; do
  t="$(basename "$f" .native)"
  docker compose exec -T plausible_events_db clickhouse-client --optimize_on_insert 0 \
    -q "INSERT INTO plausible_events_db.\`$t\` FORMAT Native" < "$f"
done
```

Tables absent from `data/` were empty at dump time — a zero-row `Native` dump is a
zero-byte file that `INSERT` rejects with `NO_DATA_TO_INSERT`, so they are recorded
in the manifest at 0 rows and no file is written.

`scripts/clickhouse-verify-backup.sh` does all of the above nightly into a throwaway
database, compares every row count against the manifest, checks the manifest covers
as many tables as production has, and drops the scratch copy. The live database is
only ever read.

### Offsite copy: pulled to the maintainer's machine (`scripts/pull-backups.ps1`)

Dumps that only live on this VPS are lost with it. The offsite copy is **pulled** to
the maintainer's own Windows PC over SSH — the server cannot reach a machine behind a
home NAT, so the direction is a requirement, not a preference.

```powershell
# Windows, Task Scheduler, daily
pwsh -File C:\R_git\SigmaCV\scripts\pull-backups.ps1 -RemoteHost root@sigmacv.org
```

Every file is SHA-256 verified on both ends (a completed `scp` is not proof), pruning
never drops below `MinKeep`, and it **warns when the newest dump is older than 48h** —
that staleness check is what makes an intermittently-on PC a safe target rather than a
hopeful one, since it catches both "the PC was off" and "the server's dump cron died".

**Why the controller's own machine:** it introduces **no new sub-processor**. The
privacy notice already states that the controller is based in Japan and that Japan-EU
transfers rest on the 2019 mutual adequacy decision, so a copy held by the controller
is covered by wording that already exists. A third-party bucket would need declaring.

**Conditions this relies on:**

- **The dumps are encrypted by the pull script, with `age`.** Each file is stored as
  `<name>.gz.age`, encrypted to a **recipient public key** — so this PC holds the means
  to _write_ backups but not to _read_ them, and a stolen machine yields ciphertext.
  The private key belongs in a password manager; if it is lost, every copy here is lost
  with it. Setup and restore below.
- **It is the only offsite copy, by choice.** One device can be stolen, fail, or be
  ransomwared — and ransomware specifically targets mounted backup folders. The
  staleness warning is the compensating control; heed it.

> **Corrected 2026-09-02: this section used to say "BitLocker must stay ON", and the
> pull script's header said the same.** Nobody had ever checked. `manage-bde -status`
> reported **both volumes `Fully Decrypted`, `Protection Off`, no key protectors** — so
> ~150 users' accounts, emails and CVs had been sitting unencrypted on an endpoint while
> the documentation asserted otherwise. The fix is deliberately not to re-assert it: the
> dumps are now encrypted by the pull script itself, which does not depend on the state
> of the disk they land on. Whole-disk encryption is worth having as well, but it
> protects a different thing (a powered-off machine) and is no longer load-bearing here.
> A documented control nobody has verified is not a control.

**Whole-disk encryption on the PC — defence in depth, not the control.** BitLocker was
enabled on `C:` on 2026-09-03: **XTS-AES-256**, full-volume (deliberately _not_
`-UsedSpaceOnly`, so free space is encrypted too — which matters because deleted
plaintext dumps remain readable in unallocated space until something overwrites them),
protectors **TPM + Numerical Password**, recovery key held in the maintainer's password
manager.

Read the layering correctly, because conflating the two is what caused the problem
above: BitLocker with a TPM-only protector unlocks automatically at boot, so it protects
a **powered-off** machine. It does nothing for a machine taken while running or
unlocked, and nothing for the dumps once they leave this disk. The `age` encryption is
what protects the backups; BitLocker is a second, independent layer under it.

Two things that look like faults and are not:

- `Enable-BitLocker` on an OS volume with a TPM adds the **TPM protector itself**, so a
  follow-up `Add-BitLockerKeyProtector -MountPoint C: -TpmProtector` fails with
  `0x80310031` ("only one key protector of this type is allowed"). Harmless — check
  `manage-bde -status` and you will see both protectors already listed.
- `Protection Status: Protection Off` is **expected while conversion runs**. It flips to
  `Protection On` at 100%. Verify it then; do not read anything into it before.

```powershell
manage-bde -status C:     # elevated; Protection On + Conversion Status "Fully Encrypted"
```

**One-time setup on the PC:**

```powershell
winget install FiloSottile.age
age-keygen -o key.txt          # move the AGE-SECRET-KEY line into a password manager,
                               # then delete key.txt - it must not stay on this disk
[Environment]::SetEnvironmentVariable("SIGMACV_BACKUP_AGE_RECIPIENT", "age1...", "User")
pwsh -File scripts\pull-backups.ps1 -RemoteHost root@sigmacv.org -MigratePlaintext
```

`-MigratePlaintext` encrypts dumps pulled before this existed. It deletes a plaintext
file **only** where the server still holds the identical copy, so a mistyped recipient
can never destroy the only copy; anything the server has already rotated away is
encrypted but kept, and named in the log for manual removal once you have confirmed you
can decrypt it.

Without a recipient the script **fails closed** and pulls nothing — a stopped pull is
visible in Task Scheduler and recoverable, whereas silently writing personal data in the
clear is neither. `-AllowPlaintext` exists as a deliberate escape hatch.

**Restoring one:**

```powershell
age -d -i <identity-file> sigmacv-20260902-073352.sql.gz.age > sigmacv.sql.gz
# then confirm it decrypted to the right bytes:
(Get-FileHash sigmacv.sql.gz -Algorithm SHA256).Hash.ToLower()
Get-Content sigmacv-20260902-073352.sql.gz.sha256   # must match
```

Every artefact has a `.sha256` sidecar holding the **plaintext** hash recorded at pull
time, which is what makes that check possible — the ciphertext itself cannot be compared
against the server, since `age` uses a fresh ephemeral key on every run.

> **Removed 2026-08-20: the Google Drive leg.** The previous script copied every dump
> to `gdrive:SigmaCV-Backups/` unencrypted. That put ~130 users' records with an
> **undeclared, non-EU sub-processor**, contradicting the privacy notice's "stored in
> the European Union (Germany) … under a data-processing agreement". Delete the
> historical copies there once the local set is verified.

### Alternative: an object-storage remote (`scripts/offsite-backup.sh`)

Not in use today — the pull above is the offsite copy — but kept ready in case a second
copy is ever added. It copies the dumps to an rclone remote, **verifies** the remote
against local (`rclone check`), reports offsite freshness, and prunes old copies safely.

```bash
cd /root/sigmacv
RCLONE_REMOTE=sigmacv-crypt:sigmacv-backups ./scripts/offsite-backup.sh   # run once by hand
# 15 5 * * * cd /root/sigmacv && RCLONE_REMOTE=sigmacv-crypt:sigmacv-backups ./scripts/offsite-backup.sh >> /var/log/sigmacv-offsite.log 2>&1
```

**⚠️ Data residency — choose the remote before you script it.** These dumps are
personal data, and the published privacy notice says it is stored _"with our hosting
provider in the European Union (Germany) … under a data-processing agreement"_. An
offsite copy is still processing:

- A **Hetzner Storage Box / Object Storage** keeps it with the same provider in the
  EU under the DPA already in place — the notice stays true as written.
- **Anywhere else adds a sub-processor**, and a non-EU destination adds an
  international transfer. Both require updating `src/lib/i18n/privacy.ts` (`sharing`,
  all ten locales) **before** switching.

**Encrypt regardless.** A dump is the whole user table in one file; wrap the remote in
an `rclone crypt` (an sftp remote for the Storage Box, then a crypt remote around it,
and point `RCLONE_REMOTE` at the crypt one) so the offsite copy is useless to anyone
who obtains it.

Design choices worth knowing: it uses `rclone copy`, never `sync` — sync would mirror
a local deletion or a wiped disk straight to the offsite copy, which is the exact
failure it exists to survive. It refuses to ship a **stale** dump (that would make the
freshness check pass while the dump pipeline is already broken), prunes only **after**
a successful verify, and never prunes below `MIN_KEEP`. Tunables: `RCLONE_REMOTE`,
`BACKUP_DIR`, `BACKUP_GLOB`, `RETENTION_DAYS` (30), `MIN_KEEP` (7), `MAX_AGE_HOURS`,
`HEARTBEAT_URL`.

**To prove the offsite copy itself restores** — the guarantee that actually matters —
pull the newest remote dump into a scratch directory and point the restore test at it:

```bash
mkdir -p /tmp/offsite-check && rclone copy "$RCLONE_REMOTE" /tmp/offsite-check --include '*.sql.gz' --max-age 2d
BACKUP_DIR=/tmp/offsite-check ./scripts/verify-backup.sh
rm -rf /tmp/offsite-check
```

Worth doing monthly, and after any change to the remote.

---

## 3. OEP import (Editorial Roles reference table)

```bash
docker compose exec -T postgres psql -U sigmacv -d sigmacv -tc 'SELECT count(*) FROM "OepEditorialRole";'
```

**Expect:** ≈ **589,000** (definitely not 0). If 0, the Editorial Roles section
is silently empty for everyone. To run the import on the VPS (Postgres is not
published to the host, so run a node container on the compose network):

```bash
cd ~/sigmacv
docker network ls | grep sigmacv          # note the network name, e.g. sigmacv_default
docker run --rm -v "$PWD":/work -w /work --network sigmacv_default \
  --env-file .env -e DATABASE_URL="postgresql://sigmacv:${POSTGRES_PASSWORD}@postgres:5432/sigmacv" \
  node:22-bookworm sh -c 'npm ci && npm run oep:import'
# then re-run the count above — expect ~589k
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

## 7. Uptime + error alerting

> **Status 2026-08-20: UptimeRobot is watching the site.** The steps below are
> kept as the spec — worth confirming that monitor 2 (SSL expiry) and, if
> analytics runs, monitor 3 are configured too, not just the main check.

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

---

## 9. Disaster recovery — rebuild the VPS from scratch (RTO)

The accepted availability posture is a **single VPS** (no standby): a dead
server means downtime until a rebuild, and that is fine for this service. What
must NOT be lost is the data — which is why §2's tested backups + offsite copy
exist. Target **RTO ≈ 2–3 hours**, **RPO ≤ 24 h** (nightly dump).

Rebuild recipe (assumes the offsite backup and this repo are reachable):

1. **Provision** a new Hetzner VPS (same region), point DNS `sigmacv.org` (+
   `plausible.` subdomain) at the new IP. Caddy re-issues TLS automatically
   once DNS resolves.
2. **Harden** (same as the original: §4) — create user, SSH keys only,
   fail2ban, ufw (22/80/443), unattended-upgrades.
3. **Install Docker + compose plugin**, `git clone` the repo into `~/sigmacv`.
4. **Recreate `.env`** from the password manager (it is never in git):
   `POSTGRES_PASSWORD`, `AUTH_SECRET`, `AUTH_URL`, ORCID prod credentials,
   `OPENALEX_MAILTO`, `RATE_LIMIT_PERSIST=true`, analytics secrets.
5. `docker compose up -d --build`, then `npm run db:migrate` path (fresh DB →
   migration history applies, including `Cv.lastSyncReport`).
6. **Restore data**: copy the newest offsite dump and restore into the live DB
   (reverse of §2b — restore into `sigmacv`, not `restore_test`).
7. **Re-import reference data**: `npm run oep:import` (§3); ICTRP only if the
   WHO agreement is active.
8. **Verify**: sign in with ORCID, load `/cv`, export a PDF, check `/p/<slug>`
   of a published CV, confirm Plausible ingests, re-enable the backup cron +
   offsite `rclone` job, and confirm UptimeRobot goes green.

**Practice note:** §2's monthly test-restore already rehearses the only step
with real data-loss risk (6). The rest is deterministic provisioning; don't
over-engineer beyond this while the service has no SLA.
