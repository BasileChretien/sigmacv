import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output keeps the Docker image small (app + traced deps only).
  output: "standalone",

  // Dev only: allow a tunnel origin (ngrok/cloudflared) to load the dev server's
  // client assets/HMR. Set NEXT_ALLOWED_DEV_ORIGIN to your tunnel host; not
  // hardcoded so no personal tunnel address lands in the public repo.
  allowedDevOrigins: process.env.NEXT_ALLOWED_DEV_ORIGIN
    ? [process.env.NEXT_ALLOWED_DEV_ORIGIN]
    : [],

  // These packages are native/CommonJS and must not be bundled by the server
  // compiler — they are required at runtime from node_modules instead.
  serverExternalPackages: [
    "citeproc",
    "playwright",
    "@prisma/client",
    "@prisma/adapter-pg",
    "pg",
    "nodemailer",
  ],

  // citeproc reads CSL style + locale XML from disk at runtime. Make sure the
  // standalone trace includes the vendored assets for the routes that render.
  outputFileTracingIncludes: {
    "/api/cv/preview": ["./src/lib/citeproc/assets/**/*"],
    "/api/cv/export/[format]": ["./src/lib/citeproc/assets/**/*"],
    "/p/[slug]": ["./src/lib/citeproc/assets/**/*"],
    "/api/internal/resync": ["./src/lib/citeproc/assets/**/*"],
  },

  // Baseline security headers on every response.
  async headers() {
    const base = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
    ];
    // HSTS only when actually served over HTTPS — emitting it over plain HTTP
    // (local/IP testing on :80) would lock a browser out of the HTTP origin.
    if (process.env.AUTH_URL?.startsWith("https://")) {
      base.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains",
      });
    }
    return [{ source: "/:path*", headers: base }];
  },
};

export default nextConfig;
