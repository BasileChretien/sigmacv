import { z } from "zod";

/**
 * Server-side environment validation.
 *
 * Parsing is LAZY (via `getEnv()`) rather than at import time, so `next build`
 * does not crash when secrets are absent. Call `getEnv()` inside request
 * handlers / runtime code paths that actually need the values.
 */
const EnvSchema = z
  .object({
    DATABASE_URL: z.string().min(1),
    AUTH_SECRET: z.string().min(1),
    AUTH_URL: z.url().optional(),
    ORCID_CLIENT_ID: z.string().min(1),
    ORCID_CLIENT_SECRET: z.string().min(1),
    ORCID_ENVIRONMENT: z.enum(["sandbox", "production"]).default("sandbox"),
    OPENALEX_MAILTO: z.email(),
    // Optional alternate logins (enabled only when present).
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    EMAIL_SERVER: z.string().optional(), // SMTP URL, e.g. smtp://user:pass@host:587
    EMAIL_FROM: z.string().optional(), // e.g. "SigmaCV <no-reply@example.org>"
    // OpenAIRE Graph API: a 1-month refresh token, exchanged for short-lived (1h)
    // access tokens for higher rate limits. Optional — the client works anonymously
    // (lower limits) when unset. Generate at https://graph.openaire.eu (account →
    // personal access token); store the REFRESH token only (never the access token).
    OPENAIRE_REFRESH_TOKEN: z.string().optional(),
    // EPO Open Patent Services (OPS) — patents by inventor name. OAuth2
    // client-credentials (consumer key + secret from a free OPS account at
    // https://developers.epo.org). Optional — with neither set the patents client
    // is dormant (makes NO call, returns []). OPS has no anonymous access.
    EPO_OPS_KEY: z.string().optional(),
    EPO_OPS_SECRET: z.string().optional(),
    // Jisc Open Policy Finder API key — the journal's self-archiving policy by ISSN
    // for the owner worklist (sent as the `x-api-key` header). Optional: without it
    // the pass asks OA.Works only. Issued to SigmaCV by Jisc (case CS-00957483).
    OPEN_POLICY_FINDER_API_KEY: z.string().optional(),
    // GDPR Art. 21 objection list for the no-login /preview/[orcid] route: a
    // comma-separated list of lowercase hex HMAC-SHA256(PREVIEW_SUPPRESSION_KEY,
    // ORCID) values (`npm run preview:suppress-hash` prints one; it prompts for
    // the iD so it never lands in shell history). NEVER plaintext iDs — a list of
    // iDs is itself a personal-information database under the APPI. A listed iD
    // is answered exactly like one with no public record. Interim,
    // maintainer-operated mechanism until the self-service objection route lands.
    PREVIEW_SUPPRESSED_ORCID_HMACS: z.string().optional(),
    // The key those HMACs are computed with. DEDICATED and DURABLE on purpose:
    // keying them by AUTH_SECRET would let a routine secret rotation silently void
    // every objection. Required (≥ 16 chars) whenever the list above is set —
    // see the refinement below, which fails startup loudly instead of letting a
    // keyless list match nothing. Rotate it only by recomputing every entry.
    PREVIEW_SUPPRESSION_KEY: z.string().min(16).optional(),
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
    OPENALEX_CURATION_ENDPOINT: z.url().optional(),
    // ── DataCite DOI minting for frozen CV snapshots (roadmap C5) ──────────────
    // DORMANT unless ALL THREE are set: the mint endpoint then answers 409
    // "doi-minting-disabled" and makes NO network call. Needs a DataCite
    // repository account (Fabrica): the repository id ("MEMBER.REPO"), its
    // password, and the DOI prefix ("10.xxxxx") it may mint under. The
    // credentials never reach the client; see `lib/datacite/mint.ts`.
    DATACITE_REPOSITORY_ID: z.string().optional(),
    DATACITE_PASSWORD: z.string().optional(),
    DATACITE_PREFIX: z
      .string()
      .regex(/^10\.\d{4,9}$/, "DATACITE_PREFIX must look like 10.12345")
      .optional(),
    // NOTE: the narrative-CV AI assistant is BRING-YOUR-OWN-KEY — the server holds
    // no key and presets no provider (the user supplies base URL + model + key from
    // their browser, per-request). So there is intentionally NO AI_* env here.
  })
  .superRefine((env, ctx) => {
    // A suppression list without its key would match nothing: every objector's
    // record would be previewable again with no error. Fail loudly instead.
    if (env.PREVIEW_SUPPRESSED_ORCID_HMACS && !env.PREVIEW_SUPPRESSION_KEY) {
      ctx.addIssue({
        code: "custom",
        path: ["PREVIEW_SUPPRESSION_KEY"],
        message: "required when PREVIEW_SUPPRESSED_ORCID_HMACS is set (the list is keyed by it)",
      });
    }
  });

export type Env = z.infer<typeof EnvSchema>;

/**
 * The no-login rate limits, which an event can raise for a day without a code
 * change: a workshop room behind one university NAT is one IP to the limiter.
 * Each value is a whole number of requests per window; the window is fixed in
 * the route. Unset (or blank) means today's limit, `RATE_LIMIT_DEFAULTS` below.
 *
 * A value above 100 times today's is refused: that no longer raises a limit, it
 * switches it off (a stray extra digit or two). The global ceilings protect the
 * upstream polite pools and the server's CPU, so raise them as little as the
 * event needs, and unset everything afterwards.
 *
 * Parsed apart from `EnvSchema`, and each variable on its own, on purpose: a
 * typo in an event-day value fails only the routes that read that variable
 * (they answer 500 and the log names it), never sign-in, the editor, the public
 * pages that `getEnv()` serves, or the routes of the seven other variables.
 */
export const RATE_LIMIT_DEFAULTS = {
  // /api/preview/build: one ORCID preview (~20 upstream sources), per hour.
  PREVIEW_MAX_PER_IP: 30,
  PREVIEW_MAX_GLOBAL: 600,
  // /api/preview/render: the no-login editor re-rendering as the visitor
  // curates or restyles, per hour (per caller: see `getCallerRateLimit`).
  PREVIEW_RENDER_MAX_PER_IP: 240,
  PREVIEW_RENDER_MAX_GLOBAL: 6_000,
  // /api/cv/preview/gallery and /api/cv/preview/styles: the style pickers'
  // thumbnails, each its own bucket, per hour (per caller: see `getCallerRateLimit`).
  PREVIEW_THUMBNAILS_MAX_PER_IP: 30,
  // /search: the name lookup, one OpenAlex call per distinct query.
  SEARCH_MAX_PER_IP: 20, // per minute
  SEARCH_MAX_GLOBAL_PER_MINUTE: 300,
  SEARCH_MAX_GLOBAL_PER_HOUR: 3_000,
} as const;

export type RateLimitName = keyof typeof RATE_LIMIT_DEFAULTS;

const LIMIT_CEILING_FACTOR = 100;

function requestLimit(today: number) {
  return z
    .string()
    .regex(/^\d+$/, "must be a whole number of requests, with no spaces or separators")
    .transform(Number)
    .pipe(
      z
        .number()
        .int()
        .min(1)
        .max(today * LIMIT_CEILING_FACTOR),
    )
    .default(today);
}

let cached: Env | null = null;
const cachedLimits = new Map<RateLimitName, number>();

/** Test hook: forget the parsed env so a test can change process.env and re-parse. */
export function __resetEnvForTests(): void {
  cached = null;
  cachedLimits.clear();
}

/** `process.env` with empty strings as unset (e.g. `RESYNC_SECRET=""` in .env,
 *  or a compose `${VAR:-}` passthrough), so optional vars left blank don't fail
 *  validation. */
function envSource(): Record<string, string | undefined> {
  const source: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(process.env)) {
    source[k] = v === "" ? undefined : v;
  }
  return source;
}

function formatIssues(error: z.ZodError): string {
  return error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
}

/** One no-login rate limit (see `RATE_LIMIT_DEFAULTS`), parsed on first use and
 *  then cached. Throws, naming only this variable, when its value is refused. */
export function getRateLimit(name: RateLimitName): number {
  const hit = cachedLimits.get(name);
  if (hit !== undefined) return hit;
  const today = RATE_LIMIT_DEFAULTS[name];
  const raw = process.env[name];
  // Blank is unset, as in `envSource()` (a compose `${VAR:-}` passthrough).
  const parsed = requestLimit(today).safeParse(raw === "" ? undefined : raw);
  if (!parsed.success) {
    const reasons = parsed.error.issues.map((i) => i.message).join("; ");
    throw new Error(
      `Invalid rate limit ${name}: ${reasons}.\n` +
        `Unset it to restore its default of ${today} (see .env.production.example).`,
    );
  }
  cachedLimits.set(name, parsed.data);
  return parsed.data;
}

/**
 * The ceiling of a per-caller preview bucket (the editor's re-renders, the style
 * thumbnails). The event-day override is for visitors who are not signed in, whom
 * a shared room IP lumps into one bucket. A signed-in account is a bucket of its
 * own, so it keeps today's limit and never reads the override: a refused value
 * cannot reach the signed-in editor's style pickers.
 */
export function getCallerRateLimit(name: RateLimitName, signedIn: boolean): number {
  return signedIn ? RATE_LIMIT_DEFAULTS[name] : getRateLimit(name);
}

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(envSource());
  if (!parsed.success) {
    const issues = formatIssues(parsed.error);
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
        `Invalid production environment:\n${problems.map((p) => `  - ${p}`).join("\n")}`,
      );
    }
  }

  cached = parsed.data;
  return cached;
}
