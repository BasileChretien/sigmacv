import { z } from "zod";

/**
 * Server-side environment validation.
 *
 * Parsing is LAZY (via `getEnv()`) rather than at import time, so `next build`
 * does not crash when secrets are absent. Call `getEnv()` inside request
 * handlers / runtime code paths that actually need the values.
 */
const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  AUTH_URL: z.string().url().optional(),
  ORCID_CLIENT_ID: z.string().min(1),
  ORCID_CLIENT_SECRET: z.string().min(1),
  ORCID_ENVIRONMENT: z.enum(["sandbox", "production"]).default("sandbox"),
  OPENALEX_MAILTO: z.string().email(),
  // Optional alternate logins (enabled only when present).
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  EMAIL_SERVER: z.string().optional(), // SMTP URL, e.g. smtp://user:pass@host:587
  EMAIL_FROM: z.string().optional(), // e.g. "SigmaCV <no-reply@example.org>"
  // Open Editors Plus dataset (JSON of editorial roles by ORCID). Optional.
  OEP_DATA_URL: z.string().url().optional(),
  // Shared secret guarding the internal scheduled-resync endpoint. If unset the
  // endpoint is disabled (returns 503), so it's optional even in production.
  RESYNC_SECRET: z.string().min(16).optional(),
  // ── OpenAlex upstream curation push (Phase 5 — "give back to the commons") ──
  // DISABLED by default. When unset/false the app makes NO external curation
  // write — ever (the endpoint 503s and the write-client returns "disabled"
  // without touching the network). The real OpenAlex curation API contract is
  // UNCONFIRMED, so this stays gated until it is. Set to "true" only once the
  // endpoint + payload below are verified against the real API.
  OPENALEX_CURATION_ENABLED: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  // Where the (PROVISIONAL) curation request is POSTed when enabled. Optional
  // even when enabled: if absent the write-client reports an error rather than
  // guessing a production URL.
  OPENALEX_CURATION_ENDPOINT: z.string().url().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  // Treat empty-string env values as unset (e.g. `RESYNC_SECRET=""` in .env),
  // so optional vars left blank don't fail validation.
  const source: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(process.env)) {
    source[k] = v === "" ? undefined : v;
  }
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid or missing environment configuration:\n${issues}\n` +
        `See .env.example for the required variables.`,
    );
  }

  // Extra production-only requirements (don't rely on dev-friendly defaults).
  if (process.env.NODE_ENV === "production") {
    const problems: string[] = [];
    if (!parsed.data.AUTH_URL) {
      problems.push(
        "AUTH_URL must be set in production (canonical origin for OAuth callbacks; avoids trusting the Host header).",
      );
    }
    if (!process.env.ORCID_ENVIRONMENT) {
      problems.push(
        "ORCID_ENVIRONMENT must be set explicitly in production (do not rely on the sandbox default).",
      );
    }
    // AUTH_SECRET signs/encrypts the Auth.js CSRF + callback cookies; a short,
    // low-entropy value weakens those. Require >=32 chars in production (matches
    // `openssl rand -base64 33`). Kept lenient in dev so a local secret is fine.
    if (parsed.data.AUTH_SECRET.length < 32) {
      problems.push(
        "AUTH_SECRET must be at least 32 characters in production (generate with `openssl rand -base64 33`).",
      );
    }
    if (problems.length > 0) {
      throw new Error(
        `Invalid production environment:\n${problems
          .map((p) => `  - ${p}`)
          .join("\n")}`,
      );
    }
  }

  cached = parsed.data;
  return cached;
}
