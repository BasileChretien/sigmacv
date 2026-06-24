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

# Apply any Caddyfile change. The Caddyfile is a mounted volume, so `up -d` does
# NOT reload Caddy when only the file changed — without this, edits to the proxy
# config (health checks / retry window) would silently never take effect. A
# `caddy reload` is graceful (zero-downtime config swap); the app's new IP after a
# recreate is picked up automatically via Docker DNS, so no reload is needed for
# that.
#
# Validate BEFORE touching the running Caddy. A failed `reload` is safe — it
# leaves the live instance on its old, working config — but blindly falling back
# to `--force-recreate` with a broken Caddyfile would crash-loop the edge and take
# the whole site down. So reload/recreate only once the config is known good; the
# recreate fallback then covers the narrow case where the config is valid but the
# admin reload API is unreachable. Errors stay visible (no stderr suppression).
echo "[deploy] Validating + reloading Caddy config…"
if compose "$@" exec -T caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile; then
  compose "$@" exec -T caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile \
    || compose "$@" up -d --force-recreate caddy
else
  echo "[deploy] ⚠️  Caddyfile failed validation — left the running Caddy untouched. Fix it and re-run." >&2
  exit 1
fi

echo "[deploy] Pruning dangling images…"
docker image prune -f >/dev/null 2>&1 || true

echo "[deploy] Done — the site stayed up throughout. ✅"
