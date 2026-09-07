import { createHash } from "node:crypto";

/**
 * Content hash of a frozen CV version — so a reader holding a link and a reader
 * holding a PDF can check they are looking at the SAME frozen document.
 *
 * Postgres `jsonb` does not preserve key order or whitespace, so the hash is
 * taken over a CANONICAL serialisation (keys sorted recursively, `undefined`
 * dropped, no whitespace) of the frozen document, computed once at freeze time
 * and stored beside it. Pure; no IO.
 */

/** Canonical JSON: object keys sorted recursively; arrays keep their order. */
export function stableJson(value: unknown): string {
  return JSON.stringify(value, (_key, val) =>
    val && typeof val === "object" && !Array.isArray(val)
      ? Object.fromEntries(
          Object.keys(val as Record<string, unknown>)
            .sort()
            .map((k) => [k, (val as Record<string, unknown>)[k]]),
        )
      : val,
  );
}

/** Lower-case hex SHA-256 of {@link stableJson}(value). */
export function contentHashOf(value: unknown): string {
  return createHash("sha256").update(stableJson(value), "utf8").digest("hex");
}

/** The short form shown in page chrome (first 12 hex chars); the full hash rides a `title`. */
export const CONTENT_HASH_SHORT_LEN = 12;
