/**
 * ROR identifier shapes, shared by everything that emits or keys on a ROR id
 * (the public JSON-LD affiliation, the OAI `ror:<id>` set key, the
 * institution-page consent).
 */

/** The canonical ROR IRI shape: `https://ror.org/<id>` (lowercase alnum body). */
const ROR_IRI = /^https:\/\/ror\.org\/[0-9a-z]+$/;

/** The bare ROR id shape (`0` + six Crockford base32 chars + two check
 *  digits): THE predicate for an id the consent API accepts and the editor's
 *  picker may offer — `positionRorId` applies it, so nothing offered is
 *  refused. */
export const ROR_ID_PATTERN = /^0[a-hj-km-np-tv-z0-9]{6}[0-9]{2}$/;

/**
 * Normalise a stored ROR id to its canonical, ATTACKER-PROOF IRI, or undefined.
 *
 * `safeHref` only blocks `javascript:`/`data:`; a stored full URL would
 * otherwise pass through verbatim, letting a crafted `meta.rorId` emit any
 * `https://…` `@id`/`identifier`. So we validate strictly against the ROR domain
 * pattern: a full URL is accepted ONLY if it already is `https://ror.org/<id>`;
 * a bare id becomes `https://ror.org/<id>` and is re-validated. Anything else
 * (foreign host, http, junk) returns undefined and the caller omits the field.
 */
export function rorIri(rorId: string): string | undefined {
  if (ROR_IRI.test(rorId)) return rorId;
  if (/^https?:\/\//i.test(rorId)) return undefined;
  const built = `https://ror.org/${rorId}`;
  return ROR_IRI.test(built) ? built : undefined;
}

/** The bare ROR id (the ror.org path segment) of a stored value, or null when
 *  it fails {@link rorIri}'s shape check. */
export function bareRorId(rorId: string): string | null {
  const iri = rorIri(rorId);
  return iri ? iri.slice("https://ror.org/".length) : null;
}
