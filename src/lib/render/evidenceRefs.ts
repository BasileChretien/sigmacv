import { evidenceResolver, type ResolvedEvidenceSegment } from "@/lib/canonical/evidenceRefs";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { escapeHtml, escapeMarkdown } from "./escape";
import type { PreparedSection } from "./prepare";

/**
 * Format-specific rendering of the evidence references a prose body carries
 * (`[[<itemId>]]`, parsed + resolved by `canonical/evidenceRefs.ts`). Every
 * renderer derives from the same resolved segments; only the inline markup a
 * resolved reference becomes differs per format. An UNRESOLVED reference (its
 * entry was hidden / marked "not mine" / removed) is omitted silently — never
 * shown raw — in every export; the editor and the CV-health panel surface it.
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
 * the entry's own `id="item-…"` element on the page (`anchorId` builds it). Bound
 * to one CV + the rendered sections so the resolver's index is built once.
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
        return `<a class="cv-evidence" href="#${anchorId(seg.id)}">${escapeHtml(seg.label)}</a>`;
      })
      .join("");
}

/**
 * Markdown: the escaped body with each resolved reference as `[label](#item-…)`
 * (`anchorId` given) or a plain `(label)` when the document carries no per-entry
 * anchors to point at (the funder-structured grant draft).
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
      return opts.anchorId ? `[${label}](#${opts.anchorId(seg.id)})` : `(${label})`;
    })
    .join("");
}

export interface ProseEvidence {
  /** Resolve one paragraph / line of prose (tokens never span a line). */
  resolve: (text: string) => ResolvedEvidenceSegment[];
  /** The distinct entries every prose section links to — the bookmark / label
   *  targets a text renderer (DOCX / LaTeX) marks on those entries. */
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
      if (seg.kind === "ref" && seg.resolved) referenced.add(seg.id);
    }
  }
  return { resolve, referenced };
}
