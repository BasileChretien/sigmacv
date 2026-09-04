import type { CvItem } from "@/lib/canonical/schema";
import { renderStrings } from "@/lib/i18n/render";
import { escapeHtml } from "./escape";
import { sourceLabel } from "./sourceLabel";

/**
 * The compact per-item provenance mark shown in the public page's READER VIEW
 * (`?view=reader`, see `readerMode.ts`): a short muted label ("ORCID", "OpenAlex",
 * "Claimed", …) whose accessible `title` spells out how the work was matched to
 * the account holder, where its record came from, whether an institution
 * confirmed it, whether it is retracted or under the owner's review, and when it
 * was last re-fetched from a live source. Built ONLY from data already on the item
 * — nothing is computed, scored, or inferred here.
 *
 * Pure: returns `{label, title}` (plain text, unescaped); `itemProvenanceHtml`
 * wraps it as the rendered span. Note that the public projection
 * (`projectCvForPublic`) strips `matchBasis`, `claimed` and `reviewFlag` before a
 * CV reaches the public page, so on the living page the mark falls back to the
 * record's SOURCE; the identifier-match wording is produced when the fields are
 * present (an owner-side render, or a future projection choice).
 */
export interface ItemProvenance {
  /** Short label for the mark (a proper-noun source/identifier or a localized word). */
  label: string;
  /** The full, localized explanation for the tooltip / accessible name. */
  title: string;
}

/** Localized UTC calendar date for an ISO timestamp (falls back to the ISO date part). */
function formatUtcDate(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(d);
  } catch {
    return iso.slice(0, 10);
  }
}

/**
 * How the item was tied to the account holder (when the match basis is on the
 * item), else where its record came from. Returns the short label + the leading
 * sentence of the title.
 */
function matchOrSource(item: CvItem, locale: string): ItemProvenance {
  const s = renderStrings(locale);
  switch (item.meta.matchBasis) {
    case "orcid":
      return { label: "ORCID", title: s.provMatchOrcid };
    case "openalex-id":
      return { label: "OpenAlex ID", title: s.provMatchOpenAlexId };
    case "both":
      return { label: "ORCID + OpenAlex ID", title: s.provMatchBoth };
    case "claimed":
      return { label: s.provLabelClaimed, title: s.provMatchClaimed };
    default:
      break;
  }
  if (item.source === "manual") return { label: s.provLabelManual, title: s.provSourceManual };
  const src = item.source === "derived" ? s.sourceDerived : sourceLabel(item.source);
  return { label: src, title: s.provSourceOf.replace("{source}", src) };
}

/** The provenance mark for an item, from the data already on it. */
export function itemProvenance(item: CvItem, locale: string): ItemProvenance {
  const s = renderStrings(locale);
  const base = matchOrSource(item, locale);
  const parts: string[] = [base.title];
  if (item.meta.enriched) parts.push(s.provEnriched);
  if (item.meta.verified) {
    const org = item.meta.verifiedBy?.trim();
    parts.push(org ? s.badgeVerifiedByTitle.replace("{org}", org) : s.badgeVerifiedTitle);
  }
  if (item.meta.retracted) parts.push(s.badgeRetractedTitle);
  if (item.meta.reviewFlag) parts.push(s.provUnderReview);
  if (item.meta.lastVerifiedAt) {
    parts.push(
      s.provLastVerified.replace("{date}", formatUtcDate(item.meta.lastVerifiedAt, locale)),
    );
  }
  return { label: base.label, title: parts.join(" · ") };
}

/**
 * The rendered mark: a small muted `<span class="cv-prov">` carrying the label,
 * with the full explanation as its `title`. Both are HTML-escaped (the verifying
 * organisation's name is source text).
 */
export function itemProvenanceHtml(item: CvItem, locale: string): string {
  const { label, title } = itemProvenance(item, locale);
  return `<span class="cv-prov" title="${escapeHtml(title)}">${escapeHtml(label)}</span>`;
}
