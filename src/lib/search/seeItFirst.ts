import { normalizeAuthorQuery } from "@/lib/openalex/authorQuery";
import { isValidOrcidChecksum } from "@/lib/orcid/checksum";

/**
 * The homepage's one box: a visitor types either their ORCID iD (bare or as an
 * orcid.org URL) or their name, and is sent to the matching no-login surface —
 * the automatic preview for an iD, the name lookup for a name. Pure and
 * client-safe; both destinations re-validate authoritatively.
 */
export type SeeItFirstTarget =
  { kind: "orcid"; orcid: string } | { kind: "name"; query: string } | { kind: "invalid" };

const ORCID_RE = /(\d{4}-\d{4}-\d{4}-\d{3}[\dX])/i;

/** Something shaped like an iD that was mistyped: digits, dashes, spaces — never a name. */
const DIGITS_ONLY = /^[\d\s-]+$/;

export function resolveSeeItFirstInput(raw: string): SeeItFirstTarget {
  const trimmed = raw.normalize("NFC").replace(/\s+/g, " ").trim();
  const m = ORCID_RE.exec(trimmed);
  if (m) {
    const orcid = (m[1] ?? "").toUpperCase();
    return isValidOrcidChecksum(orcid) ? { kind: "orcid", orcid } : { kind: "invalid" };
  }
  if (trimmed.length === 0 || DIGITS_ONLY.test(trimmed)) return { kind: "invalid" };
  // The lookup lower-cases for matching; the query we forward keeps the visitor's
  // casing so the search box shows what they typed.
  return normalizeAuthorQuery(trimmed) ? { kind: "name", query: trimmed } : { kind: "invalid" };
}

/** Where the box sends the visitor, or `null` when the input is unusable. */
export function seeItFirstHref(target: SeeItFirstTarget, searchPath: string): string | null {
  switch (target.kind) {
    case "orcid":
      return `/preview/${target.orcid}`;
    case "name":
      return `${searchPath}?q=${encodeURIComponent(target.query)}`;
    default:
      return null;
  }
}
