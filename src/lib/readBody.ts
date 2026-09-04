/**
 * Read and JSON-parse a request body with a HARD byte ceiling enforced by
 * streaming — never by trusting the client `content-length` header (which can be
 * omitted, or chunked-encoded to smuggle an arbitrarily large body into memory).
 *
 * Returns a discriminated result so the caller maps it to 413 (too large) vs 400
 * (invalid JSON) without leaking internals.
 */
export type ReadBodyResult = { ok: true; value: unknown } | { ok: false; tooLarge: boolean };

export type ReadTextResult = { ok: true; text: string } | { ok: false; tooLarge: true };

/** Read a request body as UTF-8 text under a streamed byte ceiling (the
 *  building block of `readJsonBodyWithLimit`; use it directly for non-JSON
 *  bodies such as a form-encoded POST). */
export async function readTextBodyWithLimit(
  req: Request,
  maxBytes: number,
): Promise<ReadTextResult> {
  const body = req.body;
  /* v8 ignore next 7 -- defensive: undici always provides req.body; the
     no-stream fallback only matters on exotic runtimes */
  if (!body) {
    // No stream available (some runtimes / empty body): fall back to text() with
    // a byte check so we still never parse an oversize body.
    const text = await req.text();
    if (byteLength(text) > maxBytes) return { ok: false, tooLarge: true };
    return { ok: true, text };
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return { ok: false, tooLarge: true };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return { ok: true, text: decodeChunks(chunks) };
}

export async function readJsonBodyWithLimit(
  req: Request,
  maxBytes: number,
): Promise<ReadBodyResult> {
  const read = await readTextBodyWithLimit(req, maxBytes);
  if (!read.ok) return read;
  return parseJson(read.text);
}

function parseJson(text: string): ReadBodyResult {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, tooLarge: false };
  }
}

function byteLength(text: string): number {
  return new TextEncoder().encode(text).byteLength;
}

function decodeChunks(chunks: Uint8Array[]): string {
  const total = chunks.reduce((n, c) => n + c.byteLength, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder("utf-8").decode(merged);
}
