import {
  displayInstitution,
  hasStructuredSupervision,
  itemInstitution,
  type CvItem,
} from "@/lib/canonical/schema";
import { bareYearRange } from "@/lib/canonical/entryLine";
import {
  degreeLabel,
  renderStrings,
  superviseeNoun,
  supervisionRoleLabel,
  supervisionStatusLabel,
} from "@/lib/i18n/render";
import { escapeHtml, safeHref } from "./escape";

/**
 * The structured supervision record, prepared ONCE for every renderer.
 *
 * `prepare.ts` turns a supervision item that carries structured `meta` (see
 * `hasStructuredSupervision`) into a {@link SupervisionEntry} and serializes it
 * either as the two-line HTML record ({@link supervisionEntryHtml}, the same
 * `.cv-entry` layout Positions/Education use) or as the flat text line every
 * text format lists ({@link supervisionEntryText}). No renderer re-derives any
 * of this from `meta` — the name-hiding rule (`display.hideSuperviseeNames`) and
 * the localized labels are applied here exactly once.
 */

/** A sub-line part: display text plus an optional (already-validated) link. */
export interface SupervisionSubPart {
  text: string;
  href?: string;
}

export interface SupervisionEntry {
  /** Lead line: "Jane Doe — PhD, primary supervisor" (name only when present + not hidden). */
  lead: string;
  /** Right-aligned date slot ("2019–2023" / "2019–present"), "" when no year is known. */
  dates: string;
  /** Muted sub-line parts, in order: thesis (linked) · institution (linked) · "now: …". */
  sub: SupervisionSubPart[];
  /** Localized status term, when recorded; `ongoing` marks the badge case. */
  status?: { label: string; ongoing: boolean };
}

/** The canonical ROR IRI shape (`https://ror.org/<id>`); a bare body is accepted too. */
const ROR_IRI = /^https:\/\/ror\.org\/[0-9a-z]+$/;

/** The href for the institution name: its homepage (per ROR) else its ROR record, or "". */
function institutionHref(item: CvItem): string {
  const site = safeHref(item.meta.institutionUrl);
  if (site) return site;
  const raw = item.meta.rorId?.trim();
  if (!raw) return "";
  const candidate = ROR_IRI.test(raw) ? raw : `https://ror.org/${raw}`;
  return ROR_IRI.test(candidate) ? safeHref(candidate) : "";
}

/** `https://doi.org/<bare doi>` for a stored thesis DOI (any prefix form), or "". */
function thesisHref(item: CvItem): string {
  const doi = item.meta.thesisDoi?.trim().replace(/^(https?:\/\/(dx\.)?doi\.org\/|doi:)/i, "");
  if (doi) return safeHref(`https://doi.org/${doi}`);
  return safeHref(item.meta.thesisUrl);
}

/**
 * Build the prepared supervision record for an item, or null when the item has
 * no structured lead (it then renders its free-text line unchanged). `hideNames`
 * (= `display.hideSuperviseeNames`) swaps the supervisee's name for the
 * degree-level noun; the degree label is then dropped from the qualifiers (the
 * noun already says it). Pure.
 */
export function supervisionEntry(
  item: CvItem,
  locale: string,
  hideNames: boolean,
): SupervisionEntry | null {
  if (!hasStructuredSupervision(item)) return null;
  const rs = renderStrings(locale);
  const m = item.meta;
  const name = m.superviseeName?.trim();
  const who = name ? (hideNames ? superviseeNoun(rs, m.degreeLevel) : name) : "";
  const qualifiers: string[] = [];
  if (m.degreeLevel && !(name && hideNames)) qualifiers.push(degreeLabel(rs, m.degreeLevel));
  if (m.supervisionRole) qualifiers.push(supervisionRoleLabel(rs, m.supervisionRole));
  const qualifier = qualifiers.join(", ");
  let lead = who && qualifier ? `${who} — ${qualifier}` : who || qualifier;

  const sub: SupervisionSubPart[] = [];
  const thesisTitle = m.thesisTitle?.trim();
  const thesisLink = thesisHref(item);
  // Only a thesis title → it leads the record (nothing else to lead with).
  if (!lead && thesisTitle) lead = thesisTitle;
  else if (thesisTitle || thesisLink) {
    sub.push({ text: thesisTitle || thesisLink, ...(thesisLink ? { href: thesisLink } : {}) });
  }
  const instOverride = m.institutionOverride?.trim();
  const inst = instOverride || displayInstitution(item, locale)?.trim();
  if (inst) {
    // A user override is shown verbatim + unlinked (the stored ROR named the
    // previous text); the source-shaped name links to its site / ROR record.
    const href = instOverride || !itemInstitution(item) ? "" : institutionHref(item);
    sub.push({ text: inst, ...(href ? { href } : {}) });
  }
  const now = m.currentPosition?.trim();
  if (now) sub.push({ text: rs.supervisionNow.replace("{position}", now) });

  // A completed/discontinued record with no end year shows just its start year —
  // never "–present", which the open range would otherwise imply.
  const closedNoEnd =
    m.endYear === undefined && (m.status === "completed" || m.status === "discontinued");
  const dates = closedNoEnd
    ? m.startYear !== undefined
      ? String(m.startYear)
      : ""
    : bareYearRange(m.startYear, m.endYear, rs.datePresent, rs.dateUntil);

  const status = m.status
    ? { label: supervisionStatusLabel(rs, m.status), ongoing: m.status === "ongoing" }
    : undefined;
  return { lead, dates, sub, ...(status ? { status } : {}) };
}

/**
 * The flat, single-line text form every TEXT format lists (Markdown / DOCX /
 * LaTeX): "Lead (dates). thesis (url) · institution · now: … · ongoing". Links
 * become a trailing parenthesised URL, the convention the Datasets entries use.
 */
export function supervisionEntryText(e: SupervisionEntry): string {
  const head = e.dates ? `${e.lead} (${e.dates})` : e.lead;
  const parts = e.sub.map((p) => (p.href && p.href !== p.text ? `${p.text} (${p.href})` : p.text));
  if (e.status) parts.push(e.status.label);
  return parts.length ? `${head}. ${parts.join(" · ")}` : head;
}

/**
 * The two-line HTML record (HTML/PDF + public page): the same `.cv-entry` /
 * `.cv-entry-head` / `.cv-entry-lead` / `.cv-entry-dates` / `.cv-entry-sub`
 * structure as a Positions entry, so every template + public style already
 * styles it. Everything is escaped here; links are pre-validated hrefs.
 */
export function supervisionEntryHtml(e: SupervisionEntry): string {
  const datesHtml = e.dates ? `<span class="cv-entry-dates">${escapeHtml(e.dates)}</span>` : "";
  const head = `<div class="cv-entry-head"><span class="cv-entry-lead">${escapeHtml(e.lead)}</span>${datesHtml}</div>`;
  const parts = e.sub.map((p) =>
    p.href
      ? `<a class="cv-entry-link" href="${escapeHtml(p.href)}">${escapeHtml(p.text)}</a>`
      : escapeHtml(p.text),
  );
  if (e.status) {
    const cls = e.status.ongoing ? "cv-entry-status is-ongoing" : "cv-entry-status";
    parts.push(`<span class="${cls}">${escapeHtml(e.status.label)}</span>`);
  }
  const subLine = parts.length ? `<div class="cv-entry-sub">${parts.join(" · ")}</div>` : "";
  return `<div class="cv-entry cv-entry-supervision">${head}${subLine}</div>`;
}
