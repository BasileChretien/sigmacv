#!/usr/bin/env bash
# Nightly Postgres dump for production (self-hosted Postgres, docker-compose.yml).
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
set -euo pipefail
export HOME=/root
export PATH=/usr/local/bin:/usr/bin:/bin

REPO_DIR="${REPO_DIR:-/root/sigmacv}"
BACKUP_DIR="${BACKUP_DIR:-/root/sigmacv-backups}"
KEEP="${KEEP:-14}"
MIN_SIZE_BYTES="${MIN_SIZE_BYTES:-100000}"

cd "$REPO_DIR"
mkdir -p "$BACKUP_DIR"

TS=$(date +%Y%m%d-%H%M%S)
OUT="$BACKUP_DIR/sigmacv-$TS.sql.gz"

# Credentials come from the container's own environment, so they are never on a
# command line or in this file.
docker compose exec -T postgres \
  sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' \
  | gzip > "$OUT"

# Prove the dump before trusting it. `set -o pipefail` catches a failing pg_dump,
# but not every truncation: verify the gzip stream is complete and the file is a
# plausible size. Rotating on an unchecked dump is how a good backup gets aged out
# in favour of a broken one.
if ! gzip -t "$OUT" 2>/dev/null; then
  rm -f "$OUT"
  echo "FAIL: $OUT is not a valid gzip stream — dump discarded, rotation skipped" >&2
  exit 1
fi
size=$(stat -c %s "$OUT")
if [ "$size" -lt "$MIN_SIZE_BYTES" ]; then
  rm -f "$OUT"
  echo "FAIL: dump was only $size bytes (min $MIN_SIZE_BYTES) — discarded, rotation skipped" >&2
  exit 1
fi

# Local rotation: keep the newest $KEEP. Only reached once the new dump is sound.
ls -1t "$BACKUP_DIR"/sigmacv-*.sql.gz | tail -n +$((KEEP + 1)) | xargs -r rm -f

echo "backup written: $OUT ($size bytes, gzip verified)"
