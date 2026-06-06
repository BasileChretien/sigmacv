#!/usr/bin/env bash
set -euo pipefail

# Apply database migrations before starting the server. Prisma 7 reads the
# datasource URL from prisma.config.ts (DATABASE_URL must be in the container
# env). FATAL on failure (set -e): never start the server against an unmigrated
# database — a silent no-schema start looks "up" but every DB-backed route 500s.
# `migrate deploy` is a no-op (exit 0) when there are no pending migrations.
echo "[entrypoint] Applying Prisma migrations…"
prisma migrate deploy

echo "[entrypoint] Migrations applied. Starting SigmaCV…"
exec "$@"
