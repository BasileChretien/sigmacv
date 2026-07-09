import { getEnv } from "@/lib/env";
import { resilientFetch } from "@/lib/http";
import { logger } from "@/lib/log";

/**
 * Pluggable, OpenAI-compatible chat provider for the narrative-CV drafting
 * assistant (the ONLY AI feature). It is deliberately generic — base URL + model
 * + API key from env — so the hosted instance can point at an EU processor
 * (default Mistral AI, France) while a self-hoster points at Scaleway, OVHcloud,
 * a local server, or nothing at all.
 *
 * The feature is OFF unless BOTH `AI_NARRATIVE_ENABLED=true` AND an `AI_API_KEY`
 * are set. When disabled, {@link chatComplete} throws {@link AiDisabledError}
 * BEFORE any network call — so an unconfigured deployment never reaches out.
 * Fail-soft otherwise: transport errors surface as {@link AiRequestError} for the
 * caller to translate into a friendly message.
 */

export interface AiConfig {
  /** True only when the feature flag is on AND an API key is present. */
  enabled: boolean;
  baseUrl: string;
  model: string;
  apiKey?: string;
}

/** Current provider config, read through the validated env boundary. */
export function aiConfig(): AiConfig {
  const env = getEnv();
  return {
    enabled: Boolean(env.AI_NARRATIVE_ENABLED) && Boolean(env.AI_API_KEY),
    baseUrl: env.AI_BASE_URL,
    model: env.AI_MODEL,
    apiKey: env.AI_API_KEY,
  };
}

/** Whether narrative AI drafting is available on this deployment. */
export function isNarrativeAiEnabled(): boolean {
  return aiConfig().enabled;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Thrown when the feature is disabled — the caller should 404/return "off". */
export class AiDisabledError extends Error {
  constructor(message = "AI drafting is disabled") {
    super(message);
    this.name = "AiDisabledError";
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
  /** Cap the response length (keeps drafts short + costs bounded). */
  maxTokens?: number;
  /** Sampling temperature; a modest default keeps the draft grounded. */
  temperature?: number;
  /** Per-attempt timeout (ms). */
  timeoutMs?: number;
}

const DEFAULT_MAX_TOKENS = 700;
const DEFAULT_TEMPERATURE = 0.5;
const DEFAULT_TIMEOUT_MS = 30_000;
// A polite, identifiable UA (the provider's terms govern; be transparent).
const USER_AGENT = "SigmaCV (+https://sigmacv.org)";

/**
 * One OpenAI-compatible chat completion. Returns the assistant's trimmed text.
 * Throws {@link AiDisabledError} when the feature is off (no network call) and
 * {@link AiRequestError} on any transport/shape failure.
 */
export async function chatComplete(
  messages: ChatMessage[],
  opts: ChatCompleteOptions = {},
): Promise<string> {
  const cfg = aiConfig();
  if (!cfg.enabled || !cfg.apiKey) throw new AiDisabledError();

  const {
    maxTokens = DEFAULT_MAX_TOKENS,
    temperature = DEFAULT_TEMPERATURE,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = opts;

  let res: Response;
  try {
    res = await resilientFetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
      timeoutMs,
      // One retry only: drafting is user-initiated + interactive, not a batch sync.
      retries: 1,
    });
  } catch (err) {
    logger.warn("ai.request_failed", { err });
    throw new AiRequestError();
  }

  if (!res.ok) {
    logger.warn("ai.non_ok", { status: res.status });
    throw new AiRequestError(`AI provider returned ${res.status}`);
  }

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
