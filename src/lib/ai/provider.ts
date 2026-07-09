import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { resilientFetch } from "@/lib/http";

/**
 * BRING-YOUR-OWN-KEY OpenAI-compatible chat provider for the narrative-CV drafting
 * assistant (the ONLY AI feature). SigmaCV holds NO key and presets NO provider:
 * the caller supplies the base URL + model + API key (the user's own, held in
 * their browser and passed per-request). The app's route is a stateless relay —
 * it makes exactly one call to the caller's chosen endpoint and retains nothing.
 *
 * Because the endpoint is user-supplied, {@link chatComplete} SSRF-hardens it
 * (https-only; refuses loopback / private / link-local / CGNAT / metadata
 * addresses and bare internal hostnames) before any request. Transport / shape
 * failures surface as {@link AiRequestError}; a bad key / unsafe or invalid
 * endpoint surfaces as {@link AiConfigError}.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** The caller-supplied provider config (never stored server-side). */
export interface AiProviderConfig {
  /** OpenAI-compatible base URL, e.g. "https://api.mistral.ai/v1". */
  baseUrl: string;
  /** Model id, e.g. "open-mistral-nemo" / "gpt-4o-mini" / … */
  model: string;
  /** The user's own API key (from their browser; used once, never persisted). */
  apiKey: string;
}

/** Thrown for a missing key / invalid or disallowed (SSRF) endpoint. */
export class AiConfigError extends Error {
  constructor(message = "Invalid AI provider configuration") {
    super(message);
    this.name = "AiConfigError";
  }
}

/** Thrown when the provider request fails or returns an unusable body. */
export class AiRequestError extends Error {
  constructor(message = "AI provider request failed") {
    super(message);
    this.name = "AiRequestError";
  }
}

export interface ChatCompleteOptions {
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

const DEFAULT_MAX_TOKENS = 700;
const DEFAULT_TEMPERATURE = 0.5;
const DEFAULT_TIMEOUT_MS = 30_000;
const USER_AGENT = "SigmaCV (+https://sigmacv.org)";

/** Whether an IPv4 dotted-quad is loopback / private / link-local / CGNAT / reserved. */
function ipv4Disallowed(ip: string): boolean {
  const m = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const o = [m[1], m[2], m[3], m[4]].map(Number);
  if (o.some((n) => n > 255)) return true; // malformed → refuse
  const [a, b] = o as number[];
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) || // link-local incl. cloud metadata 169.254.169.254
    (a === 172 && b! >= 16 && b! <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b! >= 64 && b! <= 127) || // CGNAT
    a! >= 224 // multicast / reserved
  );
}

/** Whether a resolved IP address must not be fetched (SSRF guard). */
function ipDisallowed(ip: string): boolean {
  const kind = isIP(ip);
  if (kind === 4) return ipv4Disallowed(ip);
  if (kind === 6) {
    const low = ip.toLowerCase();
    if (low === "::1" || low === "::") return true; // loopback / unspecified
    if (/^(fe80|fc|fd|ff)/.test(low)) return true; // link-local / ULA / multicast
    const mapped = low.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/); // IPv4-mapped
    return mapped ? ipv4Disallowed(mapped[1]!) : false;
  }
  return false;
}

/**
 * Validate + SSRF-harden a user-supplied endpoint, returning the trailing-slash-
 * trimmed base URL. Rejects non-https, bare/internal hostnames, and any host that
 * IS or RESOLVES TO a disallowed address. (Residual: DNS rebinding between this
 * check and the fetch — mitigated by the route's auth + rate limit.)
 */
async function assertSafeEndpoint(rawBaseUrl: string): Promise<string> {
  let url: URL;
  try {
    url = new URL(rawBaseUrl);
  } catch {
    throw new AiConfigError("Enter a valid https endpoint URL.");
  }
  if (url.protocol !== "https:") throw new AiConfigError("The endpoint must use https.");
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  const literal = isIP(host) !== 0;
  if (
    host === "localhost" ||
    (!literal && !host.includes(".")) || // bare internal name
    /\.(local|internal|lan|home|corp|intranet)$/.test(host)
  ) {
    throw new AiConfigError("That endpoint host isn't allowed.");
  }
  let ips: string[];
  if (literal) {
    ips = [host];
  } else {
    try {
      ips = (await lookup(host, { all: true })).map((r) => r.address);
    } catch {
      throw new AiConfigError("Couldn't resolve that endpoint host.");
    }
  }
  if (ips.some(ipDisallowed)) {
    throw new AiConfigError("That endpoint resolves to a disallowed address.");
  }
  return url.href.replace(/\/+$/, "");
}

/**
 * One OpenAI-compatible chat completion via the CALLER'S provider config. Returns
 * the assistant's trimmed text. Throws {@link AiConfigError} (bad key / unsafe or
 * invalid endpoint) or {@link AiRequestError} (transport / shape failure). Never
 * logs the key or the request/response bodies.
 */
export async function chatComplete(
  messages: ChatMessage[],
  config: AiProviderConfig,
  opts: ChatCompleteOptions = {},
): Promise<string> {
  const apiKey = config.apiKey?.trim();
  const model = config.model?.trim();
  if (!apiKey) throw new AiConfigError("An API key is required.");
  if (!model) throw new AiConfigError("A model name is required.");
  const base = await assertSafeEndpoint(config.baseUrl);

  const {
    maxTokens = DEFAULT_MAX_TOKENS,
    temperature = DEFAULT_TEMPERATURE,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = opts;

  let res: Response;
  try {
    res = await resilientFetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
      timeoutMs,
      // One retry only: drafting is user-initiated + interactive, not a batch sync.
      retries: 1,
    });
  } catch {
    // Never log the error object — it can include the request (key/prompt).
    throw new AiRequestError();
  }

  if (!res.ok) throw new AiRequestError(`AI provider returned ${res.status}`);

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new AiRequestError("AI provider returned a non-JSON body");
  }

  const text = (data as { choices?: { message?: { content?: unknown } }[] })?.choices?.[0]?.message
    ?.content;
  if (typeof text !== "string" || text.trim().length === 0) {
    throw new AiRequestError("AI provider returned an empty completion");
  }
  return text.trim();
}
