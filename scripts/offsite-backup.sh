#!/usr/bin/env bash
# Copy SigmaCV's Postgres dumps offsite, verify the copy, and prune old ones.
#
# scripts/verify-backup.sh proves the dumps RESTORE. This proves they SURVIVE the
# box: dumps that only live on the VPS are lost with it, taking the app and its
# backups together. Runbook §2 flagged that as the gap; this closes it.
#
#   15 5 * * *  cd /root/sigmacv && ./scripts/offsite-backup.sh >> /var/log/sigmacv-offsite.log 2>&1
#
# ── DATA RESIDENCY: READ BEFORE CHOOSING A REMOTE ────────────────────────────
# These dumps contain personal data. The published privacy notice says it is
# stored "with our hosting provider in the European Union (Germany) … under a
# data-processing agreement". An offsite copy is still processing, so:
#
#   * A Hetzner Storage Box / Object Storage keeps it with the SAME provider in
#     the EU, under the DPA already in place — the notice stays true as written.
#   * ANY other destination adds a sub-processor, and a non-EU one adds an
#     international transfer. Both require updating the privacy notice
#     (src/lib/i18n/privacy.ts, `sharing`, in all ten locales) BEFORE you switch.
#
# Encrypt regardless. A dump is the whole user table in one file; wrap the remote
# in an `rclone crypt` and the offsite copy is useless to anyone who obtains it:
#
#   rclone config          # 1) sftp remote -> Hetzner Storage Box
#                          # 2) crypt remote wrapping it, then use the crypt one
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/sigmacv}"
BACKUP_GLOB="${BACKUP_GLOB:-*.sql.gz}"
RCLONE_REMOTE="${RCLONE_REMOTE:-}" # e.g. sigmacv-crypt:sigmacv-backups
RETENTION_DAYS="${RETENTION_DAYS:-30}"
MIN_KEEP="${MIN_KEEP:-7}" # never prune below this many remote copies
MAX_AGE_HOURS="${MAX_AGE_HOURS:-36}"
HEARTBEAT_URL="${HEARTBEAT_URL:-}"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}
note() { echo "  $*"; }

echo "=== SigmaCV offsite backup — $(date -Is) ==="

# --- Preconditions ------------------------------------------------------------
command -v rclone >/dev/null 2>&1 || fail "rclone is not installed — see https://rclone.org/install/"
[ -n "$RCLONE_REMOTE" ] || fail "RCLONE_REMOTE is unset (e.g. sigmacv-crypt:sigmacv-backups) — refusing to guess a destination for personal data"
[ "$RETENTION_DAYS" -ge 1 ] 2>/dev/null || fail "RETENTION_DAYS must be >= 1 (got '$RETENTION_DAYS')"
[ "$MIN_KEEP" -ge 1 ] 2>/dev/null || fail "MIN_KEEP must be >= 1 (got '$MIN_KEEP')"
[ -d "$BACKUP_DIR" ] || fail "$BACKUP_DIR does not exist — is the dump cron installed?"

# shellcheck disable=SC2086
LATEST="$(ls -1t "$BACKUP_DIR"/$BACKUP_GLOB 2>/dev/null | head -1 || true)"
[ -n "$LATEST" ] || fail "no local dump matching $BACKUP_DIR/$BACKUP_GLOB — nothing to copy offsite"

age_h=$(( ( $(date +%s) - $(stat -c %Y "$LATEST") ) / 3600 ))
note "newest local dump: $LATEST (${age_h}h old)"
# Copying a stale dump offsite is worse than not copying: it makes the offsite
# freshness check pass while the real backup pipeline is already broken.
[ "$age_h" -le "$MAX_AGE_HOURS" ] || fail "newest local dump is ${age_h}h old (limit ${MAX_AGE_HOURS}h) — fix the dump cron before copying it offsite"

# --- Push ---------------------------------------------------------------------
note "copying $BACKUP_DIR -> $RCLONE_REMOTE"
# `copy`, never `sync`: sync would mirror a local deletion (or a wiped disk)
# straight to the offsite copy, which is exactly the failure it exists to survive.
rclone copy "$BACKUP_DIR" "$RCLONE_REMOTE" \
  --include "$BACKUP_GLOB" --transfers 2 --retries 3 --stats-one-line \
  || fail "rclone copy failed"

# --- Verify -------------------------------------------------------------------
# A copy that has not been checked is the same class of assumption as a backup
# that has never been restored.
note "verifying remote against local"
rclone check "$BACKUP_DIR" "$RCLONE_REMOTE" --include "$BACKUP_GLOB" --one-way \
  || fail "rclone check found differences — the offsite copy does not match local"
note "remote matches local"

# --- Offsite freshness --------------------------------------------------------
remote_count="$(rclone lsf "$RCLONE_REMOTE" --include "$BACKUP_GLOB" 2>/dev/null | wc -l | tr -d '[:space:]')"
[ "$remote_count" -ge 1 ] || fail "remote reports 0 dumps after a successful copy — check the remote path"
note "remote now holds $remote_count dump(s)"

newest_remote="$(rclone lsf "$RCLONE_REMOTE" --include "$BACKUP_GLOB" --format "tp" 2>/dev/null | sort -r | head -1 || true)"
[ -n "$newest_remote" ] && note "newest remote entry: $newest_remote"

# --- Prune --------------------------------------------------------------------
# Only after a successful verify, and never below MIN_KEEP — a misconfigured
# retention window must not be able to empty the offsite copy.
if [ "$remote_count" -gt "$MIN_KEEP" ]; then
  note "pruning remote copies older than ${RETENTION_DAYS}d (keeping at least $MIN_KEEP)"
  rclone delete "$RCLONE_REMOTE" --include "$BACKUP_GLOB" --min-age "${RETENTION_DAYS}d" \
    || fail "rclone delete failed while pruning"
  after="$(rclone lsf "$RCLONE_REMOTE" --include "$BACKUP_GLOB" 2>/dev/null | wc -l | tr -d '[:space:]')"
  note "remote holds $after dump(s) after pruning"
  [ "$after" -ge 1 ] || fail "pruning emptied the remote — check RETENTION_DAYS"
else
  note "skipping prune: only $remote_count remote dump(s), at or below MIN_KEEP=$MIN_KEEP"
fi

echo "OK: offsite copy present and verified at $RCLONE_REMOTE."

if [ -n "$HEARTBEAT_URL" ]; then
  curl -fsS -m 15 --retry 3 "$HEARTBEAT_URL" >/dev/null && note "heartbeat pinged" || note "heartbeat ping failed (offsite copy itself succeeded)"
fi
