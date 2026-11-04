#!/usr/bin/env bash
# SigmaCV auto-deploy: ships main to this server without a person.
#
# Run by cron every 15 minutes (install: docs/SERVER-RUNBOOK.md, "Automatic
# deploys"). When main has moved past the deployed commit, it runs
# scripts/deploy.sh for that exact commit (build first, swap after, so a failed
# build leaves the old version serving), checks the site from outside, and emails
# the result. It prints nothing when there is nothing to do, so its log holds
# only deploys.
#
# It pulls rather than being pushed to, so no login to this server is stored on
# GitHub. What it ships was tested: main takes only pull requests whose required
# checks passed on a branch up to date with main (branch protection).
#
# It deploys nothing, and emails once, when
#   - main is not a fast-forward of the server's checkout, or the checkout has
#     uncommitted changes to tracked files;
#   - the change touches a postgres or clickhouse image in a compose file: that
#     can be a data migration (see .github/dependabot.yml), so a person deploys it;
#   - the deploy of that same commit already failed. It tries again when main
#     moves, or after `rm .deploy-state/failed`.
#
#   touch .deploy-state/paused   # pause it (a hand-run deploy.sh still works)
#   rm .deploy-state/paused      # resume
#
# Emails go to DEPLOY_NOTIFY_EMAIL in .env, else OPENALEX_MAILTO, through the app
# container's own mailer (EMAIL_SERVER / EMAIL_FROM).
set -euo pipefail
# Cron's PATH is short. Append, so whatever the caller put first still wins.
export PATH="${PATH:+$PATH:}/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
cd "$(dirname "$0")/.."

STATE_DIR="${DEPLOY_STATE_DIR:-.deploy-state}"
DEPLOY_CMD="${AUTO_DEPLOY_CMD:-./scripts/deploy.sh}"
NOTIFY_CMD="${AUTO_DEPLOY_NOTIFY_CMD:-notify_by_mail}"
HEALTH_TRIES="${AUTO_DEPLOY_HEALTH_TRIES:-6}"
HEALTH_WAIT="${AUTO_DEPLOY_HEALTH_WAIT:-10}"
CURL="${AUTO_DEPLOY_CURL:-curl}"
RUNBOOK='docs/SERVER-RUNBOOK.md, "Automatic deploys"'

log() { printf '%s [auto-deploy] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"; }

# The value of KEY in .env (the last one wins), without surrounding quotes.
env_value() {
  [ -f .env ] || return 0
  sed -n "s/^$1=//p" .env | tail -n 1 | tr -d '\r' | sed -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/"
}

MAIL_JS='const nodemailer = (await import("nodemailer")).default;
await nodemailer.createTransport(process.env.EMAIL_SERVER).sendMail({
  from: process.env.EMAIL_FROM,
  to: process.env.NOTIFY_TO,
  subject: process.env.NOTIFY_SUBJECT,
  text: process.env.NOTIFY_BODY,
});'

# Email $1 (subject) and $2 (body) through the app container's mailer.
notify_by_mail() {
  local to
  to="$(env_value DEPLOY_NOTIFY_EMAIL)"
  [ -n "$to" ] || to="$(env_value OPENALEX_MAILTO)"
  if [ -z "$to" ]; then
    log "not emailed (no DEPLOY_NOTIFY_EMAIL or OPENALEX_MAILTO in .env): $1"
    return 0
  fi
  docker compose exec -T -e NOTIFY_TO="$to" -e NOTIFY_SUBJECT="$1" -e NOTIFY_BODY="$2" app \
    node --input-type=module -e "$MAIL_JS" </dev/null ||
    log "the email could not be sent: $1"
}

# A failed notification is logged; it never undoes or aborts what was decided.
notify() { "$NOTIFY_CMD" "$@" || log "the notification could not be sent: $1"; }

mkdir -p "$STATE_DIR"
[ ! -e "$STATE_DIR/paused" ] || exit 0

if command -v flock >/dev/null 2>&1; then
  exec 8>"$STATE_DIR/auto-deploy.lock"
  flock -n 8 || exit 0 # the previous run is still deploying
fi

git fetch --quiet origin main
target="$(git rev-parse origin/main)"
# First run: what is checked out is what runs.
[ -s "$STATE_DIR/deployed" ] || git rev-parse HEAD >"$STATE_DIR/deployed"
deployed="$(cat "$STATE_DIR/deployed")"
[ "$target" != "$deployed" ] || exit 0
[ "$target" != "$(cat "$STATE_DIR/failed" 2>/dev/null || true)" ] || exit 0

short="${target:0:7}"
was="${deployed:0:7}"
changes="$(git log --no-decorate --format='  %h %s' "$deployed..$target" 2>/dev/null | head -n 30 || true)"

# Leave the site as it is, say why once, and stop.
hold() {
  echo "$target" >"$STATE_DIR/failed"
  log "not deploying $short: $1"
  notify "SigmaCV: $short needs a hand-run deploy" "$(
    cat <<EOF
Auto-deploy did not deploy main ($short): $1

The site still runs $was. Nothing was changed on the server.

Commits waiting:
$changes

To deploy by hand, on the server:
  cd $PWD && ./scripts/deploy.sh

See $RUNBOOK.
EOF
  )"
  exit 0
}

git merge-base --is-ancestor HEAD "$target" ||
  hold "main is not a fast-forward of the server's checkout (a commit made on the server, or main rewritten)."
[ -z "$(git status --porcelain --untracked-files=no)" ] ||
  hold "the server's checkout has uncommitted changes to tracked files."
image_diff="$(git diff "$deployed" "$target" -- 'docker-compose*.yml' 2>/dev/null || true)"
if grep -Eq "^[+-][[:space:]]*image:[[:space:]]*[\"']?(postgres|clickhouse)" <<<"$image_diff"; then
  hold "it changes a postgres or clickhouse image in a compose file, which can be a data migration. Read the change, then deploy by hand."
fi

log "deploying $short (was $was)"
deploy_log="$STATE_DIR/last-deploy.log"
if ! DEPLOY_SHA="$target" DEPLOY_STATE_DIR="$STATE_DIR" "$DEPLOY_CMD" >"$deploy_log" 2>&1; then
  echo "$target" >"$STATE_DIR/failed"
  log "deploy of $short FAILED; its output is in $deploy_log"
  notify "SigmaCV: deploy of $short failed" "$(
    cat <<EOF
The deploy of main ($short) failed. deploy.sh builds before it swaps, so unless
the failure came after the swap the site still runs $was. It will not retry
$short; it tries again when main moves.

Last lines of $PWD/$deploy_log:
$(tail -n 40 "$deploy_log")

Commits in this deploy:
$changes

See $RUNBOOK.
EOF
  )"
  exit 1
fi
rm -f "$STATE_DIR/failed"
echo "$target" >"$STATE_DIR/deployed"

health_url="${AUTO_DEPLOY_HEALTH_URL:-}"
if [ -z "$health_url" ]; then
  base="$(env_value AUTH_URL)"
  [ -z "$base" ] || health_url="${base%/}/api/health"
fi
status=0
if [ -z "$health_url" ]; then
  health="not checked (no AUTH_URL in .env)"
else
  health="FAILED: $health_url did not answer after $HEALTH_TRIES tries"
  status=1
  for _ in $(seq 1 "$HEALTH_TRIES"); do
    if "$CURL" -fsS --max-time 10 -o /dev/null "$health_url"; then
      health="ok ($health_url answered)"
      status=0
      break
    fi
    sleep "$HEALTH_WAIT"
  done
fi

if [ "$status" -eq 0 ]; then
  subject="SigmaCV: deployed $short"
else
  subject="SigmaCV: deployed $short, but the site's health check failed"
fi
log "deployed $short; health: $health"
notify "$subject" "$(
  cat <<EOF
main ($short) is deployed. It replaced $was.
Health: $health

Commits in this deploy:
$changes

To undo a change, revert its pull request on GitHub: the revert deploys like any
other merge. To stop automatic deploys meanwhile: touch $PWD/$STATE_DIR/paused
(then deploy by hand). See $RUNBOOK.
EOF
)"
exit "$status"
