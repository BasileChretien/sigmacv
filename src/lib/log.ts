/**
 * Minimal structured logger. JSON lines in production (for log aggregation),
 * readable in development. Dependency-free.
 *
 * Privacy (GDPR/APPI): callers log EVENTS + safe fields (ids, counts, statuses)
 * — never CV document contents or personal data. As a backstop the logger
 * redacts field keys that look sensitive and serializes Errors to {name,message}
 * only (never full objects/stack frames that might carry query strings or PII).
 */

type LogLevel = "info" | "warn" | "error";
type LogFields = Record<string, unknown>;

const SENSITIVE_KEY = /token|secret|password|authorization|cookie|database_url|email|orcid/i;
const MAX_LINE = 4000;

function serialize(value: unknown): unknown {
  if (value instanceof Error) return { name: value.name, message: value.message };
  return value;
}

function redact(fields: LogFields): LogFields {
  const out: LogFields = {};
  for (const [k, v] of Object.entries(fields)) {
    out[k] = SENSITIVE_KEY.test(k) ? "[redacted]" : serialize(v);
  }
  return out;
}

function emit(level: LogLevel, event: string, fields?: LogFields): void {
  const safe = fields ? redact(fields) : undefined;
  const sink =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : console.log;

  if (process.env.NODE_ENV === "production") {
    let line: string;
    try {
      line = JSON.stringify({ level, event, ...(safe ?? {}) });
    } catch {
      line = JSON.stringify({ level, event, _fieldsError: "unserialisable" });
    }
    sink(line.length > MAX_LINE ? `${line.slice(0, MAX_LINE)}…` : line);
  } else {
    sink(`[${level}] ${event}`, safe ?? "");
  }
}

export const logger = {
  info: (event: string, fields?: LogFields) => emit("info", event, fields),
  warn: (event: string, fields?: LogFields) => emit("warn", event, fields),
  error: (event: string, fields?: LogFields) => emit("error", event, fields),
};
