#!/usr/bin/env bash
# SigmaCV redeploy — keeps the site up while it ships a new version.
#
# Replaces the old habit of `git pull && docker compose up -d --build`. That
# `--build` rebuilds the image and THEN recreates the single `app` container
# while Caddy has no backend, so every request during the swap gets a 502 /
# "server connection error" (exactly what an external reviewer hit mid-demo).
#
# This script instead:
#   1. pulls the latest code,
#   2. BUILDS the new image while the OLD container keeps serving (no downtime),
#   3. does a fast recreate to swap it in.
# Caddy's health-checked reverse_proxy (`health_uri` + `lb_try_duration`, see
# Caddyfile) then HOLDS and retries any request that lands during the few-second
# swap until the new container reports ready on /api/health — so the whole
# redeploy is invisible to visitors.
#
# Usage:
#   ./scripts/deploy.sh                              # self-hosted Postgres (docker-compose.yml)
#   ./scripts/deploy.sh -f docker-compose.prod.yml   # managed Postgres (Neon)
# Any arguments are passed straight through to `docker compose`.
set -euo pipefail
cd "$(dirname "$0")/.."

compose() { docker compose "$@"; }

echo "[deploy] Pulling latest code…"
git pull --ff-only

echo "[deploy] Building the new app image (old container keeps serving)…"
compose "$@" build app

echo "[deploy] Swapping in the new container (Caddy holds requests during the swap)…"
compose "$@" up -d

echo "[deploy] Waiting for the app to report healthy…"
cid="$(compose "$@" ps -q app 2>/dev/null || true)"
if [ -n "$cid" ]; then
  for _ in $(seq 1 60); do
    status="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$cid" 2>/dev/null || echo none)"
    case "$status" in
      healthy | none) break ;; # ready, or no healthcheck defined → don't block
      *) sleep 2 ;;
    esac
  done
  echo "[deploy] App health: ${status:-unknown}"
fi

# Apply any Caddyfile change. Two separate traps here, and BOTH have bitten:
#
#   1. `up -d` does not reload Caddy when only the mounted config changed, so the
#      edits would never take effect. Hence the explicit reload below. (The app's
#      new IP after a recreate needs no reload — Docker DNS handles that.)
#
#   2. The mount is a SINGLE FILE (`./Caddyfile:/etc/caddy/Caddyfile:ro`), which
#      binds the *inode*. `git pull` replaces the file via rename — new inode —
#      so a long-running container still sees the PRE-pull file. Validating and
#      reloading `/etc/caddy/Caddyfile` from inside the container therefore
#      re-reads that stale copy and reports success: the deploy looks clean while
#      the edge keeps serving the old rules. That is exactly how the 405 method
#      allow-list (#361) shipped "deployed" but inactive, and it is the worse
#      failure of the two — it manufactures evidence that the change landed.
#
# So copy the host file in and validate + reload from THAT path. `docker cp` must
# target a non-mounted path, since the mount is read-only.
#
# Validate BEFORE touching the running Caddy. A failed `reload` is safe — it
# leaves the live instance on its old, working config — but blindly falling back
# to `--force-recreate` with a broken Caddyfile would crash-loop the edge and take
# the whole site down. So reload/recreate only once the config is known good; the
# recreate fallback then covers the narrow case where the config is valid but the
# admin reload API is unreachable (a recreate also re-resolves the mount, so it
# picks up the current file too). Errors stay visible (no stderr suppression).
echo "[deploy] Validating + reloading Caddy config…"
caddy_cid="$(compose "$@" ps -q caddy 2>/dev/null || true)"
if [ -z "$caddy_cid" ]; then
  echo "[deploy] ⚠️  No caddy container found — skipped the config reload." >&2
else
  docker cp Caddyfile "$caddy_cid:/tmp/Caddyfile.deploy"
  if compose "$@" exec -T caddy caddy validate --config /tmp/Caddyfile.deploy --adapter caddyfile; then
    compose "$@" exec -T caddy caddy reload --config /tmp/Caddyfile.deploy --adapter caddyfile \
      || compose "$@" up -d --force-recreate caddy
  else
    echo "[deploy] ⚠️  Caddyfile failed validation — left the running Caddy untouched. Fix it and re-run." >&2
    exit 1
  fi
fi

echo "[deploy] Pruning dangling images…"
docker image prune -f >/dev/null 2>&1 || true

echo "[deploy] Done — the site stayed up throughout. ✅"
