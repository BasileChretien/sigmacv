/**
 * Query hygiene for the researcher name lookup — pure, dependency-free, so the
 * same rule can run in the browser (the homepage's "see it first" box) and on
 * the server (`/search`, `searchAuthorsByName`) without dragging the OpenAlex
 * client into a client bundle.
 */

export const AUTHOR_QUERY_MIN = 3;
export const AUTHOR_QUERY_MAX = 80;

/** Characters with meaning in OpenAlex's filter grammar, plus anything that
 *  could not be part of a person's name (C0 controls, DEL) — rejected outright,
 *  not stripped. Written with explicit escapes so the class is legible. */
// eslint-disable-next-line no-control-regex -- the C0 controls and DEL are the point
const FORBIDDEN = /[,|!:<>"\\\x00-\x1f\x7f]/;

/**
 * Normalise a raw query for the search and for the cache key: NFC, collapsed
 * whitespace, trimmed, lower-cased. `null` when it is too short, too long, or
 * carries a forbidden character.
 */
export function normalizeAuthorQuery(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const q = raw.normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase();
  if (q.length < AUTHOR_QUERY_MIN || q.length > AUTHOR_QUERY_MAX) return null;
  if (FORBIDDEN.test(q)) return null;
  // Unicode format characters (bidi overrides, zero-width joiners, …) are not part
  // of a name and can spoof what the reflected query looks like: refused, not
  // stripped.
  if (/\p{Cf}/u.test(q)) return null;
  return q;
}
