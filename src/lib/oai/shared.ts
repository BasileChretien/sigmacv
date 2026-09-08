import type { CslItem } from "@/types/csl";

/**
 * Field helpers shared by the OAI-PMH metadata formats (`oai_dc` in `oai.ts`,
 * `oaire` in `oaire.ts`). Pure string functions — no I/O, no state.
 */

/** XML-escape text + attribute content (covers &, <, >, ", '). */
export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** The canonical DOI IRI for a CSL `DOI` (bare, `doi:`-prefixed or a doi.org
 *  URL), always re-hosted on doi.org, or undefined when it isn't a DOI. */
export function doiIri(raw: string | undefined): string | undefined {
  let s = raw?.trim().replace(/^doi:\s*/i, "");
  if (!s) return undefined;
  if (/^https?:\/\//i.test(s)) s = s.match(/10\.\d{4,9}\/\S+$/)?.[0] ?? "";
  return /^10\.\d{4,9}\/\S+$/.test(s) ? `https://doi.org/${s}` : undefined;
}

/** A CSL name as "Family, Given" (or its literal form), or undefined. */
export function creatorName(n: NonNullable<CslItem["author"]>[number]): string | undefined {
  const literal = n.literal?.trim();
  if (literal) return literal;
  const family = n.family?.trim();
  const given = n.given?.trim();
  if (family && given) return `${family}, ${given}`;
  return family || given || undefined;
}

/** The publication year from the CSL `issued` date, or undefined. */
export function workYear(csl: CslItem): string | undefined {
  const part = csl.issued?.["date-parts"]?.[0]?.[0];
  if (typeof part === "number") return String(part);
  if (typeof part === "string" && /^\d{4}/.test(part)) return part.slice(0, 4);
  return undefined;
}
