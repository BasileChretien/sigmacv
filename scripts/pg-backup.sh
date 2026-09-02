#!/usr/bin/env bash
# Nightly Postgres dumps for production (self-hosted Postgres, docker-compose.yml).
#
# This lived only at /root/sigmacv-backup.sh on the VPS — unversioned, unreviewed,
# and destroyed by the very failure it protects against. It is now in the repo.
#
# Cron (as root):
#   30 3 * * * /root/sigmacv/scripts/pg-backup.sh >> /var/log/sigmacv-backup.log 2>&1
#
# The offsite copy is NOT made here. It is pulled to the maintainer's own machine
# by scripts/pull-backups.ps1, because the server cannot reach a PC behind a home
# NAT. Holding it as the controller also avoids introducing a sub-processor — see
# that script's header and docs/SERVER-RUNBOOK.md §2.
#
# ── THREE databases, not one ─────────────────────────────────────────────────
# Until 2026-09-02 this dumped only the app's `postgres` service, so `metabase_db`
# (dashboards, questions, collections — hand-built work that no re-sync recreates)
# and `plausible_db` had NO backup at all. That surfaced while checking whether a
# Metabase major upgrade could be rolled back. It could not have been.
#
# Each database is dumped, validated and rotated INDEPENDENTLY: one failing
# database must not stop the others being backed up, and must not age away a good
# dump belonging to a different database. Any failure still exits non-zero.
#
# ── What is still NOT covered ────────────────────────────────────────────────
# Plausible keeps its *analytics events* in ClickHouse (`plausible_events_db`),
# not in `plausible_db`. Dumping `plausible_db` protects Plausible's sites, users
# and settings — NOT the traffic history. ClickHouse needs its own mechanism
# (`BACKUP TABLE …`, or clickhouse-backup); until that exists, treat the analytics
# history as expendable rather than as backed up.
set -euo pipefail
export HOME=/root
export PATH=/usr/local/bin:/usr/bin:/bin

REPO_DIR="${REPO_DIR:-/root/sigmacv}"
BACKUP_DIR="${BACKUP_DIR:-/root/sigmacv-backups}"
KEEP="${KEEP:-14}"

# One line per database: service | filename-prefix | user | db | min-bytes
#
#   * user/db EMPTY -> read from the container's own POSTGRES_USER/POSTGRES_DB, so
#     nothing sensitive reaches a command line. That is how the app service works.
#   * user/db SET   -> `plausible_db` sets ONLY POSTGRES_PASSWORD: its user is the
#     image default `postgres` and its database is `plausible_db` (not `postgres`),
#     so neither can be read from the environment and both must be named here.
#     Getting this wrong is not loud — pg_dump writes nothing, gzip still produces
#     a valid ~20-byte stream, and only the size floor catches it.
#
# Floors sit well under the real sizes measured 2026-09-02 (app ~12 MB, metabase
# ~5.5 MB, plausible ~154 KB gzipped). They exist to catch an EMPTY or truncated
# dump, not to police growth; the subtler "shrank against yesterday" check lives
# in verify-backup.sh.
DUMPS="${DUMPS:-postgres|sigmacv|||100000
metabase_db|metabase|metabase|metabase|1000000
plausible_db|plausible|postgres|plausible_db|50000}"

cd "$REPO_DIR"
mkdir -p "$BACKUP_DIR"

TS=$(date +%Y%m%d-%H%M%S)
failures=0
written=0

dump_one() { # <service> <prefix> <user> <db> <min-bytes>
  local svc="$1" prefix="$2" user="$3" db="$4" min="$5"
  local out="$BACKUP_DIR/$prefix-$TS.sql.gz"
  local inner size

  # Credentials always come from the container's environment. Only the non-secret
  # user/database names are ever interpolated, and only for containers that do not
  # expose them themselves.
  if [ -z "$user" ] || [ -z "$db" ]; then
    inner='PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"'
  else
    inner="PGPASSWORD=\"\$POSTGRES_PASSWORD\" pg_dump -U \"$user\" \"$db\""
  fi

  # pipefail is in force, so an erroring pg_dump fails the pipeline even though
  # gzip itself succeeds.
  if ! docker compose exec -T "$svc" sh -c "$inner" | gzip >"$out"; then
    rm -f "$out"
    echo "FAIL[$prefix]: pg_dump pipeline failed for service '$svc' — dump discarded, rotation skipped" >&2
    return 1
  fi

  # Prove the dump before trusting it. pipefail catches an erroring pg_dump but not
  # every truncation: check the gzip stream is complete and the file is a plausible
  # size. Rotating on an unchecked dump is how a good backup gets aged out in
  # favour of a broken one.
  if ! gzip -t "$out" 2>/dev/null; then
    rm -f "$out"
    echo "FAIL[$prefix]: $out is not a valid gzip stream — dump discarded, rotation skipped" >&2
    return 1
  fi

  size=$(stat -c %s "$out")
  if [ "$size" -lt "$min" ]; then
    rm -f "$out"
    echo "FAIL[$prefix]: dump was only $size bytes (min $min) — discarded, rotation skipped" >&2
    return 1
  fi

  # Rotation is per-prefix, and only reached once THIS database's dump is sound —
  # so a broken metabase dump can never age out good app dumps, or vice versa.
  ls -1t "$BACKUP_DIR/$prefix"-*.sql.gz 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f

  echo "backup written: $out ($size bytes, gzip verified)"
  return 0
}

# The list is fed on FD 3, NOT stdin. `docker compose exec -T` reads stdin, so a
# plain `done <<EOF` loop has its remaining lines swallowed by the first dump and
# silently backs up only the first database — which is exactly the class of quiet
# gap this change exists to close. Caught by running it; it exits 0 either way.
while IFS='|' read -r svc prefix user db min <&3; do
  [ -n "${svc:-}" ] || continue
  if dump_one "$svc" "$prefix" "$user" "$db" "$min"; then
    written=$((written + 1))
  else
    failures=$((failures + 1))
  fi
done 3<<EOF
$DUMPS
EOF

# A partial run must never look like success: if the table lost lines (or a future
# edit breaks the loop again), fail loudly rather than reporting "0 failed".
expected=$(printf '%s\n' "$DUMPS" | grep -c '|' || true)
if [ "$((written + failures))" -ne "$expected" ]; then
  echo "FAIL: processed $((written + failures)) of $expected configured databases — the dump loop did not run to completion" >&2
  exit 1
fi

echo "summary: $written database(s) backed up, $failures failed"
[ "$failures" -eq 0 ] || exit 1
