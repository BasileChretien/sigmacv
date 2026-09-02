#!/usr/bin/env bash
# Nightly logical backup of Plausible's ClickHouse events database.
#
# scripts/pg-backup.sh covers the three Postgres databases. It does NOT cover this
# one: Plausible keeps its *analytics events* in ClickHouse (`plausible_events_db`),
# a different engine needing a different mechanism — so until this script existed,
# the entire traffic history was unprotected while everything else was backed up.
#
# Cron (as root), 10 minutes after the Postgres dump so the two never contend:
#   40 3 * * * /root/sigmacv/scripts/clickhouse-backup.sh >> /var/log/sigmacv-backup.log 2>&1
#
# ── Why a logical dump rather than `BACKUP DATABASE` ────────────────────────
# ClickHouse's native `BACKUP DATABASE … TO Disk(…)` needs a `backups` disk declared
# in the server config and a container restart to pick it up, and it writes inside
# the container's volume — which then has to be copied out anyway. The whole
# database is ~3 MB (2026-09-02: location_data 203k rows, events_v2 ~5k,
# sessions_v2 ~900), so a logical dump is cheap, needs no config change, and drops
# straight into the existing pipeline: one gzip artefact per night in
# /root/sigmacv-backups, pulled offsite by scripts/pull-backups.ps1 with everything
# else. Revisit if this database ever grows to the point where a full nightly dump
# stops being trivial.
#
# ── Format ──────────────────────────────────────────────────────────────────
# Data is dumped as `Native`, ClickHouse's own binary format: exact types, no
# text-encoding round-trip. That matters here because events_v2 carries Array and
# Map columns (custom properties) that a TSV/CSV dump would not restore faithfully.
# The artefact is a tar.gz holding:
#
#   schema.sql     every CREATE statement, base tables first and Dictionaries last
#                  (a dictionary reads from a table, so it cannot be created first)
#   manifest.tsv   table, engine and row count AT DUMP TIME — what a restore is
#                  checked against
#   data/<table>.native   one file per non-Dictionary table
#
# Dictionaries get DDL only, deliberately: they hold no data of their own and
# rebuild from their source table on creation.
#
# Restore is documented in docs/SERVER-RUNBOOK.md §2b — and has been executed
# against a scratch database, not just written down.
set -euo pipefail
export HOME=/root
export PATH=/usr/local/bin:/usr/bin:/bin

REPO_DIR="${REPO_DIR:-/root/sigmacv}"
BACKUP_DIR="${BACKUP_DIR:-/root/sigmacv-backups}"
KEEP="${KEEP:-14}"
CH_SERVICE="${CH_SERVICE:-plausible_events_db}"
CH_DB="${CH_DB:-plausible_events_db}"
PREFIX="${PREFIX:-clickhouse}"
# Floor is a "did this produce anything at all" check, not a growth policy. The
# real artefact was ~700 KB gzipped on 2026-09-02; 50 KB catches an empty or
# truncated dump without tripping on ordinary variation.
MIN_SIZE_BYTES="${MIN_SIZE_BYTES:-50000}"

cd "$REPO_DIR"
mkdir -p "$BACKUP_DIR"

TS=$(date +%Y%m%d-%H%M%S)
OUT="$BACKUP_DIR/$PREFIX-$TS.tar.gz"
STAGE="$BACKUP_DIR/.$PREFIX-staging-$TS"

# Always clear the staging directory, including on failure, so a broken run cannot
# leave a partial copy of analytics data lying around next to the real backups.
cleanup() { rm -rf "$STAGE"; }
trap cleanup EXIT

ch() { # ch <sql>  -> run a query, no TTY, fail loudly
  docker compose exec -T "$CH_SERVICE" clickhouse-client --database "$CH_DB" -q "$1"
}

mkdir -p "$STAGE/data"

# ── Ordering schema.sql so it actually restores ──────────────────────────────
# The dependencies run BOTH ways, so neither "tables first" nor "dictionaries
# first" works:
#
#   location_data          <- location_data_dict   (a dictionary reads a table)
#   location_data_dict     <- events_v2            (ALIAS/MATERIALIZED dictGet(…))
#   location_data_dict     <- imported_locations
#
# Ordering by dependency COUNT is not safe either: `imported_locations` and
# `location_data_dict` both have exactly one, and the wrong tie-break fails. So
# take ClickHouse's own graph (`system.tables.loading_dependencies_table`, the
# same one it uses to order startup) and topologically sort it — Kahn's algorithm,
# emit anything whose dependencies are already emitted, repeat.
DEPS_TSV=$(ch "SELECT name, arrayStringConcat(loading_dependencies_table, ',') FROM system.tables WHERE database = '$CH_DB' ORDER BY name FORMAT TSV")
[ -n "$DEPS_TSV" ] || {
  echo "FAIL[$PREFIX]: no tables found in $CH_DB — is the service up?" >&2
  exit 1
}

declare -A DEPS_OF=()
ALL=()
while IFS=$'\t' read -r _n _d; do
  [ -n "$_n" ] || continue
  DEPS_OF["$_n"]="${_d:-}"
  ALL+=("$_n")
done <<EOF
$DEPS_TSV
EOF

# Worklist kept as newline-separated text rather than bash arrays: empty-array
# expansion under `set -u` is a well-known footgun and this loop must not be clever.
emitted=" "
ordered=""
remaining=$(printf '%s\n' "${ALL[@]}")
while [ -n "$remaining" ]; do
  progress=0
  pending=""
  while IFS= read -r t; do
    [ -n "$t" ] || continue
    ready=1
    IFS=',' read -ra ds <<<"${DEPS_OF[$t]}"
    for d in "${ds[@]}"; do
      [ -n "$d" ] || continue
      # Only dependencies inside this database constrain the order; anything else
      # is already present (or irrelevant) at restore time.
      case " ${ALL[*]} " in *" $d "*) ;; *) continue ;; esac
      case "$emitted" in
        *" $d "*) ;;
        *)
          ready=0
          break
          ;;
      esac
    done
    if [ "$ready" -eq 1 ]; then
      ordered="$ordered$t"$'\n'
      emitted="$emitted$t "
      progress=1
    else
      pending="$pending$t"$'\n'
    fi
  done <<<"$remaining"

  remaining=$(printf '%s' "$pending" | sed '/^$/d')
  if [ -n "$remaining" ] && [ "$progress" -eq 0 ]; then
    echo "FAIL[$PREFIX]: dependency cycle or unresolvable order among: $(echo "$remaining" | tr '\n' ' ')" >&2
    exit 1
  fi
done

TABLES=$(printf '%s' "$ordered" | sed '/^$/d')

{
  echo "-- SigmaCV ClickHouse logical backup — $CH_DB — $TS"
  echo "-- Restore: see docs/SERVER-RUNBOOK.md §2b"
  echo "CREATE DATABASE IF NOT EXISTS $CH_DB;"
  echo
} >"$STAGE/schema.sql"

: >"$STAGE/manifest.tsv"
count=0
dumped=0
empty=0

# Fed on FD 3: `docker compose exec -T` reads stdin and would otherwise swallow the
# rest of the table list, silently backing up only the first table. Exactly the bug
# found in pg-backup.sh — it exits 0 either way, so it is invisible without a count.
while IFS= read -r table <&3; do
  [ -n "$table" ] || continue
  count=$((count + 1))

  engine=$(ch "SELECT engine FROM system.tables WHERE database = '$CH_DB' AND name = '$table' FORMAT TSV")

  # DDL for everything, including dictionaries.
  {
    ch "SHOW CREATE TABLE $CH_DB.\`$table\` FORMAT TSVRaw"
    echo ";"
    echo
  } >>"$STAGE/schema.sql"

  if [ "$engine" = "Dictionary" ]; then
    printf '%s\t%s\t%s\n' "$table" "$engine" "ddl-only" >>"$STAGE/manifest.tsv"
    continue
  fi

  rows=$(ch "SELECT count() FROM $CH_DB.\`$table\` FORMAT TSV")
  printf '%s\t%s\t%s\n' "$table" "$engine" "$rows" >>"$STAGE/manifest.tsv"

  # No data file for an empty table. A Native dump of zero rows is a zero-byte
  # file, and feeding that back gives `NO_DATA_TO_INSERT` — so writing them would
  # mean a restore that reports a dozen errors on a perfectly good backup, which
  # is how people learn to ignore restore output. The manifest still records the
  # table at 0 rows, so nothing is lost.
  if [ "$rows" = "0" ]; then
    empty=$((empty + 1))
    continue
  fi

  ch "SELECT * FROM $CH_DB.\`$table\` FORMAT Native" >"$STAGE/data/$table.native"
  dumped=$((dumped + 1))
done 3<<EOF
$TABLES
EOF

echo "  $count table(s): $dumped with data, $empty empty, $((count - dumped - empty)) dictionary/DDL-only"

# Guard against the loop being cut short by a future edit: the manifest must have a
# line per table, or the artefact is silently partial.
manifest_lines=$(wc -l <"$STAGE/manifest.tsv")
if [ "$manifest_lines" -ne "$count" ]; then
  echo "FAIL[$PREFIX]: manifest has $manifest_lines lines for $count tables — the dump loop did not complete" >&2
  exit 1
fi

tar -czf "$OUT" -C "$STAGE" schema.sql manifest.tsv data

# Prove the artefact before trusting it, same contract as pg-backup.sh: a dump that
# has not been checked must never trigger rotation.
if ! gzip -t "$OUT" 2>/dev/null; then
  rm -f "$OUT"
  echo "FAIL[$PREFIX]: $OUT is not a valid gzip stream — discarded, rotation skipped" >&2
  exit 1
fi
if ! tar -tzf "$OUT" >/dev/null 2>&1; then
  rm -f "$OUT"
  echo "FAIL[$PREFIX]: $OUT is not a readable tar — discarded, rotation skipped" >&2
  exit 1
fi
size=$(stat -c %s "$OUT")
if [ "$size" -lt "$MIN_SIZE_BYTES" ]; then
  rm -f "$OUT"
  echo "FAIL[$PREFIX]: artefact was only $size bytes (min $MIN_SIZE_BYTES) — discarded, rotation skipped" >&2
  exit 1
fi

# Rotation is reached only once this artefact is sound, so a broken run can never
# age out a good one.
ls -1t "$BACKUP_DIR/$PREFIX"-*.tar.gz 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f

echo "backup written: $OUT ($size bytes, gzip + tar verified, $count tables)"
