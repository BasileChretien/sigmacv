import { evidenceResolver, type ResolvedEvidenceSegment } from "@/lib/canonical/evidenceRefs";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { escapeHtml, escapeMarkdown, safeHref } from "./escape";
import type { PreparedSection } from "./prepare";

/**
 * Format-specific rendering of the evidence references a prose body carries
 * (`[[<itemId>]]`, parsed + resolved by `canonical/evidenceRefs.ts`). Every
 * renderer derives from the same resolved segments; only the inline markup a
 * resolved reference becomes differs per format. A LISTED reference (its entry is
 * printed by this render) links to the entry on the page; a reference to an entry
 * on the record but off the page (a narrative layout that hides the lists) prints
 * the entry's short label and, where the entry has one, links out to its DOI or
 * landing page. An UNRESOLVED reference (its entry was marked "not mine" /
 * removed) is omitted silently — never shown raw — in every export; the editor
 * and the CV-health panel surface it.
 */

/** The ids a renderer lists — the set a reference must be in to resolve. */
export function listedItemIds(
  sections: readonly { items: readonly { item: { id: string } }[] }[],
): ReadonlySet<string> {
  return new Set(sections.flatMap((s) => s.items.map((i) => i.item.id)));
}

/**
 * HTML: a text-run transform for the prose-body chokepoint (`proseBodyHtml`) —
 * escapes the text and turns each resolved reference into a small inline link to
 * the entry's own `id="item-…"` element on the page (`anchorId` builds it), or,
 * for an entry the page does not list, an outbound link to its DOI / landing
 * page (a plain marker when it has none). Bound to one CV + the rendered
 * sections so the resolver's index is built once.
 */
export function evidenceHtmlInline(
  cv: CanonicalCv,
  listedIds: ReadonlySet<string>,
  anchorId: (itemId: string) => string,
): (text: string) => string {
  const resolve = evidenceResolver(cv, { listedIds });
  return (text) =>
    resolve(text)
      .map((seg) => {
        if (seg.kind === "text") return escapeHtml(seg.text);
        if (!seg.resolved) return "";
        const label = escapeHtml(seg.label);
        if (seg.listed) return `<a class="cv-evidence" href="#${anchorId(seg.id)}">${label}</a>`;
        const href = safeHref(seg.url);
        return href
          ? `<a class="cv-evidence" href="${escapeHtml(href)}" rel="noopener">${label}</a>`
          : `<span class="cv-evidence">${label}</span>`;
      })
      .join("");
}

/**
 * Markdown: the escaped body with each resolved reference as `[label](#item-…)`
 * (`anchorId` given and the entry listed), `[label](<url>)` for an entry off the
 * page that has a DOI / landing page, or a plain `(label)` otherwise (an entry
 * with no link, or the funder-structured grant draft, which carries no anchors).
 */
export function evidenceMarkdown(
  cv: CanonicalCv,
  body: string,
  opts: { listedIds?: ReadonlySet<string>; anchorId?: (itemId: string) => string },
): string {
  return evidenceResolver(cv, { listedIds: opts.listedIds })(body)
    .map((seg) => {
      if (seg.kind === "text") return escapeMarkdown(seg.text);
      if (!seg.resolved) return "";
      const label = escapeMarkdown(seg.label);
      if (seg.listed && opts.anchorId) return `[${label}](#${opts.anchorId(seg.id)})`;
      const href = safeHref(seg.url);
      return href ? `[${label}](<${href}>)` : `(${label})`;
    })
    .join("");
}

export interface ProseEvidence {
  /** Resolve one paragraph / line of prose (tokens never span a line). */
  resolve: (text: string) => ResolvedEvidenceSegment[];
  /** The distinct LISTED entries every prose section links to — the bookmark /
   *  label targets a text renderer (DOCX / LaTeX) marks on those entries. An
   *  entry off the page gets no target; its reference prints the label. */
  referenced: ReadonlySet<string>;
}

/**
 * The evidence resolver for a text renderer (DOCX / LaTeX): bound to the ids that
 * renderer lists (so a bookmark / label is only produced for an entry it prints),
 * plus the set of entries the document's prose actually references.
 */
export function proseEvidence(
  cv: CanonicalCv,
  sections: readonly PreparedSection[],
): ProseEvidence {
  const resolve = evidenceResolver(cv, { listedIds: listedItemIds(sections) });
  const referenced = new Set<string>();
  for (const { section } of sections) {
    for (const seg of resolve(section.body ?? "")) {
      if (seg.kind === "ref" && seg.resolved && seg.listed) referenced.add(seg.id);
    }
  }
  return { resolve, referenced };
}
