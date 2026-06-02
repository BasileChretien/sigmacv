#!/usr/bin/env bash
set -euo pipefail

# Apply database migrations before starting the server. Prisma 7 reads the
# datasource URL from prisma.config.ts (DATABASE_URL must be in the container
# env). No-op until migrations are committed under prisma/migrations/ — kept
# non-fatal so a missing/empty migrations dir never blocks startup (the schema
# is applied via `prisma db push` in the current setup).
echo "[entrypoint] Applying Prisma migrations…"
prisma migrate deploy || echo "[entrypoint] migrate deploy skipped (no committed migrations)"

echo "[entrypoint] Starting SigmaCV…"
exec "$@"
