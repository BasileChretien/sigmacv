import { normalizeOrcid } from "@/lib/openalex/types";
import { isValidOrcidChecksum } from "./checksum";

/** The bare canonical iD shape, `0000-0002-7483-2489`. */
export const ORCID_RE = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

/**
 * The canonical bare iD when `raw` is a well-formed, checksum-valid ORCID (in any
 * accepted form — bare, URL, padded), otherwise `null`.
 *
 * `normalizeOrcid` is a tolerant *extractor*: when its input carries no iD it hands
 * the input back unchanged. That is fine for display, but a client that
 * interpolates an iD into a query language (the DBLP / Wikidata SPARQL, a URL
 * path) must never receive an unvalidated string — use this instead, and treat
 * `null` as "no such person", not as an error.
 */
export function validOrcidOrNull(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const bare = normalizeOrcid(raw);
  if (!ORCID_RE.test(bare) || !isValidOrcidChecksum(bare)) return null;
  return bare;
}
