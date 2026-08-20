#!/usr/bin/env bash
# Verify that SigmaCV's Postgres backups actually restore.
#
# Production runs self-hosted Postgres (docker-compose.yml), so backups are ours,
# and "the cron ran" is not evidence: a dump can be truncated, empty, or written
# by a pg_dump that errored halfway. This automates docs/SERVER-RUNBOOK.md §2 —
# find the newest dump, sanity-check age and size, restore it into a THROWAWAY
# database, compare row counts against live, then drop the scratch copy.
#
# Exit 0 = the newest backup demonstrably restores. Exit 1 = it does not, or is
# stale/undersized. Run it from cron on the server:
#
#   15 4 * * *  cd /root/sigmacv && ./scripts/verify-backup.sh >> /var/log/sigmacv-backup-verify.log 2>&1
#
# Alerting: set HEARTBEAT_URL to a healthchecks.io / UptimeRobot heartbeat URL.
# It is pinged ONLY on success, so a failed OR non-running check both alert —
# which is the point: a verifier that silently stops running is the same risk as
# a backup that silently stops working.
#
# The live database is only ever read (row counts). The scratch database is the
# only thing dropped, and the script refuses to run if it is not distinct.
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/sigmacv}"
BACKUP_GLOB="${BACKUP_GLOB:-*.sql.gz}"
MAX_AGE_HOURS="${MAX_AGE_HOURS:-36}"
MIN_SIZE_BYTES="${MIN_SIZE_BYTES:-1024}"
MIN_SIZE_RATIO="${MIN_SIZE_RATIO:-50}" # percent of the previous dump
PG_SERVICE="${PG_SERVICE:-postgres}"
PG_USER="${PG_USER:-sigmacv}"
PG_DB="${PG_DB:-sigmacv}"
SCRATCH_DB="${SCRATCH_DB:-restore_test}"
HEARTBEAT_URL="${HEARTBEAT_URL:-}"
# Session drifts constantly (logins/expiry) and OepEditorialRole is a static
# reference table, so those are reported but not failed on. User and Cv are the
# ones whose loss would be unrecoverable.
CRITICAL_TABLES="${CRITICAL_TABLES:-User Cv}"
REPORT_TABLES="${REPORT_TABLES:-User Cv Account Session OepEditorialRole}"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}
note() { echo "  $*"; }

[ "$SCRATCH_DB" != "$PG_DB" ] || fail "SCRATCH_DB must differ from PG_DB ($PG_DB) — refusing to touch the live database"

psql_in() { # psql_in <db> <sql>
  docker compose exec -T "$PG_SERVICE" psql -qtAX -U "$PG_USER" -d "$1" -c "$2"
}

cleanup() {
  # Always drop the scratch DB, including on failure, so a broken run doesn't
  # leave a stale copy of production data sitting on the box.
  docker compose exec -T "$PG_SERVICE" psql -qX -U "$PG_USER" -d postgres \
    -c "DROP DATABASE IF EXISTS \"$SCRATCH_DB\";" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "=== SigmaCV backup verification — $(date -Is) ==="

# --- 1. Newest dump -----------------------------------------------------------
# shellcheck disable=SC2086
LATEST="$(ls -1t "$BACKUP_DIR"/$BACKUP_GLOB 2>/dev/null | head -1 || true)"
[ -n "$LATEST" ] || fail "no backup matching $BACKUP_DIR/$BACKUP_GLOB — is the dump cron installed?"
note "newest dump: $LATEST"

# --- 2. Age -------------------------------------------------------------------
age_s=$(( $(date +%s) - $(stat -c %Y "$LATEST") ))
age_h=$(( age_s / 3600 ))
note "age: ${age_h}h (limit ${MAX_AGE_HOURS}h)"
[ "$age_h" -le "$MAX_AGE_HOURS" ] || fail "newest dump is ${age_h}h old — the backup cron has stopped producing dumps"

# --- 3. Size, absolute and against the previous dump --------------------------
size=$(stat -c %s "$LATEST")
note "size: $size bytes"
[ "$size" -ge "$MIN_SIZE_BYTES" ] || fail "dump is only $size bytes — almost certainly truncated"

# shellcheck disable=SC2086
PREV="$(ls -1t "$BACKUP_DIR"/$BACKUP_GLOB 2>/dev/null | sed -n 2p || true)"
if [ -n "$PREV" ]; then
  psize=$(stat -c %s "$PREV")
  if [ "$psize" -gt 0 ]; then
    pct=$(( size * 100 / psize ))
    note "vs previous dump: ${pct}% of $psize bytes (floor ${MIN_SIZE_RATIO}%)"
    # A dump that suddenly shrinks is the classic silent failure: pg_dump errored
    # partway and still exited writing a valid-looking gzip.
    [ "$pct" -ge "$MIN_SIZE_RATIO" ] || fail "dump shrank to ${pct}% of the previous one — suspect a partial pg_dump"
  fi
else
  note "vs previous dump: no earlier dump to compare against (first run?)"
fi

# --- 4. Restore into a scratch database ---------------------------------------
note "restoring into scratch database \"$SCRATCH_DB\""
docker compose exec -T "$PG_SERVICE" psql -qX -U "$PG_USER" -d postgres \
  -c "DROP DATABASE IF EXISTS \"$SCRATCH_DB\";" >/dev/null
docker compose exec -T "$PG_SERVICE" psql -qX -U "$PG_USER" -d postgres \
  -c "CREATE DATABASE \"$SCRATCH_DB\";" >/dev/null

restore_log="$(mktemp)"
trap 'rm -f "$restore_log"; cleanup' EXIT
if ! gunzip -c "$LATEST" \
  | docker compose exec -T "$PG_SERVICE" psql -qX -U "$PG_USER" -d "$SCRATCH_DB" \
      >"$restore_log" 2>&1; then
  sed -n '1,20p' "$restore_log" >&2
  fail "psql exited non-zero while restoring — the dump is not usable"
fi

# psql keeps going after errors by default, so a clean exit code is not enough.
if grep -q "^ERROR:" "$restore_log"; then
  note "first errors from the restore:"
  grep -m 5 "^ERROR:" "$restore_log" >&2
  fail "restore produced $(grep -c '^ERROR:' "$restore_log") ERROR line(s) — the dump is not cleanly restorable"
fi
note "restore completed with no ERROR lines"

# --- 5. Row counts, live vs restored ------------------------------------------
problems=0
for t in $REPORT_TABLES; do
  live="$(psql_in "$PG_DB" "SELECT count(*) FROM \"$t\";" 2>/dev/null | tr -d '[:space:]' || echo "")"
  rest="$(psql_in "$SCRATCH_DB" "SELECT count(*) FROM \"$t\";" 2>/dev/null | tr -d '[:space:]' || echo "")"
  if [ -z "$rest" ]; then
    echo "  $t: MISSING from the restored database (live=$live)" >&2
    case " $CRITICAL_TABLES " in *" $t "*) problems=$((problems + 1)) ;; esac
    continue
  fi
  note "$t: live=$live restored=$rest"
  case " $CRITICAL_TABLES " in
    *" $t "*)
      # The dump predates any writes since, so restored <= live is expected;
      # restored being far BELOW live means the dump lost rows.
      if [ -n "$live" ] && [ "$live" -gt 0 ] && [ "$((rest * 100 / live))" -lt 90 ]; then
        echo "  $t: restored count is under 90% of live — the dump is missing rows" >&2
        problems=$((problems + 1))
      fi
      ;;
  esac
done
[ "$problems" -eq 0 ] || fail "$problems critical table(s) failed the row-count comparison"

echo "OK: $LATEST restores cleanly and matches live within tolerance."

if [ -n "$HEARTBEAT_URL" ]; then
  curl -fsS -m 15 --retry 3 "$HEARTBEAT_URL" >/dev/null && note "heartbeat pinged" || note "heartbeat ping failed (verification itself passed)"
fi
