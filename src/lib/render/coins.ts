import type { CslItem, CslName } from "@/types/csl";
import { stripInlineMarkup } from "@/lib/text/markup";
import { escapeHtml } from "./escape";

/**
 * COinS (ContextObjects in Spans) metadata for a citation — an invisible
 * `<span class="Z3988" title="<OpenURL KEV>">` that reference managers (Zotero,
 * Mendeley, …) detect on a page. When the public CV page carries one per
 * publication, the Zotero browser connector lists them ALL with checkboxes so a
 * visitor can select several and import them in one click — the Google-Scholar-style
 * multi-select. Pure; no JS, no external resources (CSP-safe — just a span + attr).
 *
 * Spec: OpenURL 1.0 KEV (ANSI/NISO Z39.88-2004), journal metadata format. The DOI
 * (`rft_id=info:doi/…`) is the strongest signal — Zotero resolves the full record
 * from it — so a non-journal work still imports correctly despite the journal `genre`.
 */

/** "Family, Given" (or a literal/organization name) for rft.au, or null. */
function authorName(n: CslName): string | null {
  if (n.literal) return n.literal.trim() || null;
  const family = (n.family ?? "").trim();
  const given = (n.given ?? "").trim();
  if (family && given) return `${family}, ${given}`;
  return family || given || null;
}

/** Append `key=encoded(value)` when the value is non-empty. */
function kev(out: string[], key: string, value: string | undefined | null): void {
  const v = (value ?? "").trim();
  if (v) out.push(`${key}=${encodeURIComponent(v)}`);
}

/** The OpenURL KEV ContextObject string for a CSL item (the COinS `title` value). */
export function coinsTitle(csl: CslItem): string {
  const out: string[] = [];
  // Fixed KEV fields — percent-encoded like every other value, for a valid OpenURL.
  kev(out, "ctx_ver", "Z39.88-2004");
  kev(out, "rft_val_fmt", "info:ofi/fmt:kev:mtx:journal");
  kev(out, "rfr_id", "info:sid/sigmacv.org");
  kev(out, "rft.genre", "article");
  kev(out, "rft.atitle", csl.title ? stripInlineMarkup(csl.title) : "");
  kev(out, "rft.jtitle", csl["container-title"] ? stripInlineMarkup(csl["container-title"]) : "");
  kev(out, "rft.volume", csl.volume);
  kev(out, "rft.issue", csl.issue);
  const page = (csl.page ?? "").trim();
  const range = /^([^\s–-]+)\s*[–-]\s*([^\s–-]+)$/.exec(page);
  if (range) {
    kev(out, "rft.spage", range[1]);
    kev(out, "rft.epage", range[2]);
  } else if (page) {
    kev(out, "rft.spage", page);
  }
  const year = csl.issued?.["date-parts"]?.[0]?.[0];
  if (year != null) kev(out, "rft.date", String(year));
  const issn = Array.isArray(csl.ISSN) ? csl.ISSN[0] : csl.ISSN;
  kev(out, "rft.issn", issn);
  kev(out, "rft.language", csl.language);
  for (const a of csl.author ?? []) {
    const name = authorName(a);
    if (name) out.push(`rft.au=${encodeURIComponent(name)}`);
  }
  if (csl.DOI) out.push(`rft_id=${encodeURIComponent(`info:doi/${csl.DOI}`)}`);
  return out.join("&");
}

/** An invisible COinS span carrying the item's OpenURL metadata, for reference
 *  managers' multi-item detection. The KEV string is HTML-escaped for the attribute. */
export function coinsSpan(csl: CslItem): string {
  return `<span class="Z3988" title="${escapeHtml(coinsTitle(csl))}"></span>`;
}
