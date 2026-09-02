#!/usr/bin/env bash
# Prove that the newest ClickHouse backup actually restores.
#
# Counterpart to scripts/verify-backup.sh, which does the same for the app's
# Postgres dump. "The dump cron ran" is not evidence: an artefact can be truncated,
# ordered so it cannot be applied, or missing the tables that matter. The only
# proof is restoring it.
#
# Restores the newest `clickhouse-*.tar.gz` into a THROWAWAY database, compares row
# counts against the manifest recorded at dump time, then drops the scratch copy.
# The live database is never written to — only read, and only for the count of
# tables. Run it from cron on the server:
#
#   45 4 * * *  cd /root/sigmacv && ./scripts/clickhouse-verify-backup.sh >> /var/log/sigmacv-backup-verify.log 2>&1
#
# Exit 0 = the newest artefact demonstrably restores. Exit 1 = it does not, or is
# stale/undersized. HEARTBEAT_URL is pinged only on success, so a failing check and
# a check that has stopped running both alert.
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/root/sigmacv-backups}"
BACKUP_GLOB="${BACKUP_GLOB:-clickhouse-*.tar.gz}"
MAX_AGE_HOURS="${MAX_AGE_HOURS:-36}"
MIN_SIZE_BYTES="${MIN_SIZE_BYTES:-50000}"
CH_SERVICE="${CH_SERVICE:-plausible_events_db}"
CH_DB="${CH_DB:-plausible_events_db}"
SCRATCH_DB="${SCRATCH_DB:-ch_restore_test}"
HEARTBEAT_URL="${HEARTBEAT_URL:-}"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}
note() { echo "  $*"; }

[ "$SCRATCH_DB" != "$CH_DB" ] || fail "SCRATCH_DB must differ from CH_DB ($CH_DB) — refusing to touch the live database"

WORK=""
cleanup() {
  # Always drop the scratch database and the extracted copy, including on failure,
  # so a broken run leaves no analytics data lying around.
  docker compose exec -T "$CH_SERVICE" clickhouse-client -q "DROP DATABASE IF EXISTS \`$SCRATCH_DB\`" >/dev/null 2>&1 || true
  [ -n "$WORK" ] && rm -rf "$WORK"
  return 0
}
trap cleanup EXIT

ch() { docker compose exec -T "$CH_SERVICE" clickhouse-client -q "$1"; }

echo "=== SigmaCV ClickHouse backup verification — $(date -Is) ==="

# --- 1. Newest artefact -------------------------------------------------------
# shellcheck disable=SC2086
LATEST="$(ls -1t "$BACKUP_DIR"/$BACKUP_GLOB 2>/dev/null | head -1 || true)"
[ -n "$LATEST" ] || fail "no backup matching $BACKUP_DIR/$BACKUP_GLOB — is the dump cron installed?"
note "newest artefact: $LATEST"

age_h=$((($(date +%s) - $(stat -c %Y "$LATEST")) / 3600))
note "age: ${age_h}h (limit ${MAX_AGE_HOURS}h)"
[ "$age_h" -le "$MAX_AGE_HOURS" ] || fail "newest artefact is ${age_h}h old — the dump cron has stopped"

size=$(stat -c %s "$LATEST")
note "size: $size bytes"
[ "$size" -ge "$MIN_SIZE_BYTES" ] || fail "artefact is only $size bytes — almost certainly truncated"

# --- 2. Unpack ----------------------------------------------------------------
WORK="$(mktemp -d)"
tar -xzf "$LATEST" -C "$WORK" || fail "could not unpack $LATEST"
[ -s "$WORK/schema.sql" ] || fail "artefact has no schema.sql"
[ -s "$WORK/manifest.tsv" ] || fail "artefact has no manifest.tsv"
note "unpacked: $(wc -l <"$WORK/manifest.tsv") table(s) in the manifest, $(find "$WORK/data" -name '*.native' | wc -l) data file(s)"

# --- 3. Restore the schema into a scratch database ----------------------------
# The dump records fully-qualified names (correct for a real disaster restore, which
# recreates the database under its own name), so verifying into a scratch database
# means rewriting that name.
sed "s/$CH_DB/$SCRATCH_DB/g" "$WORK/schema.sql" >"$WORK/schema-scratch.sql"
ch "DROP DATABASE IF EXISTS \`$SCRATCH_DB\`" >/dev/null

restore_log="$WORK/restore.log"
if ! docker compose exec -T "$CH_SERVICE" clickhouse-client --multiquery <"$WORK/schema-scratch.sql" >"$restore_log" 2>&1; then
  sed -n '1,20p' "$restore_log" >&2
  fail "schema restore failed — the artefact is not usable (dependency order? see clickhouse-backup.sh)"
fi
note "schema restored"

# --- 4. Restore the data ------------------------------------------------------
inserted=0
# FD 3 again: clickhouse-client reads stdin, so a plain loop would lose the list.
while IFS= read -r f <&3; do
  [ -n "$f" ] || continue
  t="$(basename "$f" .native)"
  # `--optimize_on_insert 0` is load-bearing, not a tuning knob. It defaults to 1,
  # which applies collapsing/summing DURING the insert — so a
  # VersionedCollapsingMergeTree like sessions_v2 comes back with fewer physical
  # rows than were dumped (894 -> 892 when this was written) and the row-count
  # comparison below fails on a perfectly good backup. Restoring exactly what was
  # dumped is also the correct semantic: the source would have collapsed those rows
  # on its own next merge anyway.
  if ! docker compose exec -T "$CH_SERVICE" clickhouse-client --optimize_on_insert 0 \
    -q "INSERT INTO \`$SCRATCH_DB\`.\`$t\` FORMAT Native" <"$f" >>"$restore_log" 2>&1; then
    sed -n '1,10p' "$restore_log" >&2
    fail "restoring table '$t' failed"
  fi
  inserted=$((inserted + 1))
done 3< <(find "$WORK/data" -name '*.native' | sort)
note "restored $inserted table(s) of data"

# --- 5. Row counts, manifest vs restored --------------------------------------
problems=0
checked=0
while IFS=$'\t' read -r t engine rows <&3; do
  [ -n "$t" ] || continue
  [ "$rows" = "ddl-only" ] && continue
  got="$(ch "SELECT count() FROM \`$SCRATCH_DB\`.\`$t\` FORMAT TSV" | tr -d '[:space:]')"
  checked=$((checked + 1))
  if [ "$got" != "$rows" ]; then
    echo "  $t ($engine): manifest=$rows restored=$got — MISMATCH" >&2
    problems=$((problems + 1))
  fi
done 3<"$WORK/manifest.tsv"
note "compared $checked table(s) against the manifest"
[ "$problems" -eq 0 ] || fail "$problems table(s) did not match the row counts recorded at dump time"

# A backup of the right shape but the wrong database would pass everything above,
# so confirm the artefact covers what production actually has.
live_tables="$(ch "SELECT count() FROM system.tables WHERE database = '$CH_DB' FORMAT TSV" | tr -d '[:space:]')"
manifest_tables="$(wc -l <"$WORK/manifest.tsv" | tr -d '[:space:]')"
note "tables: live=$live_tables manifest=$manifest_tables"
[ "$manifest_tables" -eq "$live_tables" ] || fail "manifest covers $manifest_tables tables but production has $live_tables — the dump is incomplete"

echo "OK: $LATEST restores cleanly and matches the manifest."

if [ -n "$HEARTBEAT_URL" ]; then
  curl -fsS -m 15 --retry 3 "$HEARTBEAT_URL" >/dev/null && note "heartbeat pinged" || note "heartbeat ping failed (verification itself passed)"
fi
