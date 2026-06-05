# ─── Build stage ─────────────────────────────────────────────────────────────
# Debian-based Node so the Prisma engine target matches the Playwright runtime.
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# Prisma needs OpenSSL present at generate time.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install deps first (postinstall runs `prisma generate`, so the schema AND the
# Prisma 7 config must exist; generate works without DATABASE_URL).
COPY package.json package-lock.json* ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

# Build the standalone Next.js server.
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ─── Runtime stage ───────────────────────────────────────────────────────────
# Playwright image ships Chromium + its system deps for HTML→PDF rendering.
# Keep this tag in sync with the `playwright` version in package.json (exact-pinned).
FROM mcr.microsoft.com/playwright:v1.60.0-noble AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Prisma CLI (for `migrate deploy` on startup) — kept minimal.
RUN npm install -g prisma@7

# Standalone server + static assets + public dir. The Rust-free Prisma 7 client
# (src/generated/prisma) is traced into the standalone bundle automatically.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Prisma schema + config (datasource url for the CLI) + vendored CSL assets.
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/src/lib/citeproc/assets ./src/lib/citeproc/assets

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Drop root: run the Node server AND Chromium as the Playwright image's
# non-root `pwuser` (uid 1000). A future Chromium/markup-injection RCE then
# lands as an unprivileged user, not root, so it can't read the process env
# (DATABASE_URL / AUTH_SECRET / ORCID_CLIENT_SECRET) from a privileged context.
# Own the app dir so Prisma/Next runtime writes still succeed.
RUN chown -R pwuser:pwuser /app
USER pwuser

EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
