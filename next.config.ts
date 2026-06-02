import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output keeps the Docker image small (app + traced deps only).
  output: "standalone",

  // Dev only: allow the ngrok tunnel origin to load the dev server's client
  // assets/HMR (otherwise Next blocks them when accessed via the tunnel).
  // Harmless in production; update if the tunnel URL changes.
  allowedDevOrigins: ["distance-comrade-barber.ngrok-free.dev"],

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

  // Baseline security headers on every response. HSTS only takes effect over
  // HTTPS (terminated by Caddy in production).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
