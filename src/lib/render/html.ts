import {
  displayInstitution,
  itemDateRange,
  itemDepartment,
  itemInstitution,
  itemRoleTitle,
  type CanonicalCv,
  type CvItem,
  type DisplayChoices,
} from "@/lib/canonical/schema";
import { bareYearRange } from "@/lib/canonical/entryLine";
import { highlightSelf } from "@/lib/citeproc/highlight";
import { renderStrings } from "@/lib/i18n/render";
import { escapeHtml, safeHref } from "./escape";
import { coinsSpan } from "./coins";
import { prepareSections } from "./prepare";
import { cvSlug } from "./slug";
import { getTemplate, resolveTheme } from "./templates";
import type { RenderedSection } from "./templates/types";
import type { RenderOpts, Renderer, RenderInput, RenderResult } from "./types";

export { cvSlug } from "./slug";

/** Inline badges appended to a publication/preprint entry (HTML/PDF only). */
function itemBadges(item: CvItem, display: DisplayChoices): string {
  const badges: string[] = [];
  // Retraction is a research-integrity flag — always shown (never opt-out), and
  // first so it can't be missed.
  if (item.meta.retracted) {
    const s = renderStrings(display.locale);
    badges.push(
      `<span class="cv-badge cv-badge-retracted" title="${escapeHtml(
        s.badgeRetractedTitle,
      )}">${escapeHtml(s.badgeRetracted)}</span>`,
    );
  }
  // "Selected / featured" star — the user's deliberate pin (no display toggle): a
  // hand-picked work leads its section and is marked here. Sits after the integrity
  // flag, before the factual badges.
  if (item.featured) {
    const s = renderStrings(display.locale);
    badges.push(
      `<span class="cv-badge cv-badge-featured" title="${escapeHtml(
        s.badgeFeaturedTitle,
      )}">★ ${escapeHtml(s.badgeFeatured)}</span>`,
    );
  }
  if (display.showOpenAccess && item.meta.oaStatus) {
    const s = renderStrings(display.locale);
    const title = s.badgeOpenAccessTitle.replace("{status}", escapeHtml(item.meta.oaStatus));
    badges.push(
      `<span class="cv-badge cv-badge-oa" title="${title}">${escapeHtml(s.badgeOpenAccess)}</span>`,
    );
  }
  if (display.showAuthorRole && item.meta.authorRole) {
    badges.push(`<span class="cv-badge cv-badge-role">${escapeHtml(item.meta.authorRole)}</span>`);
  }
  if (display.showCitationCounts && typeof item.meta.citedByCount === "number") {
    const s = renderStrings(display.locale);
    const n = new Intl.NumberFormat(display.locale).format(item.meta.citedByCount);
    badges.push(
      `<span class="cv-badge cv-badge-cites" title="${escapeHtml(
        s.badgeCitationsTitle,
      )}">${escapeHtml(s.badgeCitations.replace("{n}", n))}</span>`,
    );
  }
  // Wrap the group in an inline-flex container (own `gap` + `margin-left`) so the
  // badges can never collapse against the preceding citation text/URL or against
  // each other — a plain joining space did, depending on the CSL style's trailing
  // node (e.g. a bare URL in APA) and on whitespace collapsing.
  return badges.length ? `<span class="cv-badges">${badges.join("")}</span>` : "";
}

/** The canonical ROR IRI shape: `https://ror.org/<id>` (lowercase alnum body). */
const ROR_IRI = /^https:\/\/ror\.org\/[0-9a-z]+$/;

/** Canonical ROR href for a stored id (full URL or bare body), or null. */
function rorHref(rorId: string | undefined): string | null {
  if (!rorId) return null;
  const candidate = ROR_IRI.test(rorId) ? rorId : `https://ror.org/${rorId.trim()}`;
  return ROR_IRI.test(candidate) ? safeHref(candidate) : null;
}

/**
 * The href the institution NAME should point at: its own homepage when ROR
 * recorded one (`meta.institutionUrl`, re-validated through `safeHref`), else the
 * ROR record (a persistent identifier that never rots). `isSite` tells the caller
 * which it got, so the tooltip can describe the target. Returns null when the
 * item carries neither a usable website nor a ROR id.
 */
function institutionHref(item: CvItem): { href: string; isSite: boolean } | null {
  const site = safeHref(item.meta.institutionUrl);
  if (site) return { href: site, isSite: true };
  const ror = rorHref(item.meta.rorId);
  if (ror) return { href: ror, isSite: false };
  return null;
}

/**
 * Link a Positions/Education entry's institution. The institution NAME inside the
 * already-escaped line is wrapped in a quiet `<a>` pointing at the institution's
 * homepage (per ROR) or, failing that, the ROR record. If the name can't be
 * located (e.g. the user edited the title and dropped it), a small trailing "ROR"
 * link is appended so the persistent identifier stays reachable. Links only — no
 * image / external resource — so it needs no CSP relaxation; `externalizeLinks`
 * adds `target`/`rel` uniformly. Returns the html unchanged when the item carries
 * no institution link at all.
 */
function withRorLink(html: string, item: CvItem, locale: string): string {
  const link = institutionHref(item);
  if (!link) return html;
  const strings = renderStrings(locale);
  // Match against the localized name actually rendered into the line (prepare.ts
  // swaps in the CV-language variant), so the link still wraps the institution.
  const org = displayInstitution(item, locale)?.trim();
  if (org) {
    const esc = escapeHtml(org);
    const at = html.lastIndexOf(esc);
    if (at >= 0) {
      const title = escapeHtml(link.isSite ? strings.institutionSiteTitle : strings.rorRecordTitle);
      const open = `<a class="cv-ror-link" href="${link.href}" title="${title}">`;
      return `${html.slice(0, at)}${open}${esc}</a>${html.slice(at + esc.length)}`;
    }
  }
  // No locatable institution name → surface the ROR persistent identifier as a
  // small trailing link (the website is meant to sit behind the name, not a token).
  const ror = rorHref(item.meta.rorId);
  /* v8 ignore next -- a stored institutionUrl always comes with a valid rorId */
  if (!ror) return html;
  const title = escapeHtml(strings.rorRecordTitle);
  return `${html} <a class="cv-ror-link" href="${ror}" title="${title}">ROR</a>`;
}

/**
 * The institution NAME as a (possibly linked) HTML span for a Positions/Education
 * entry. The SOURCE name is localized for the CV language (`displayInstitution`)
 * and wrapped in the same quiet `<a class="cv-ror-link">` `withRorLink` builds —
 * pointing at the institution homepage (per ROR) or its ROR record. A user
 * `institutionOverride` is shown verbatim and UNLINKED (their spelling wins, and
 * the source's ROR id no longer necessarily names it). "" when no institution.
 */
function institutionSpanHtml(item: CvItem, locale: string): string {
  const override = item.meta.institutionOverride?.trim();
  if (override) return escapeHtml(override);
  const name = displayInstitution(item, locale)?.trim();
  /* v8 ignore next -- unreachable: positionEntryHtml gates on a non-blank institution */
  if (!name) return "";
  const esc = escapeHtml(name);
  const link = institutionHref(item);
  if (!link) return esc;
  const strings = renderStrings(locale);
  const title = escapeHtml(link.isSite ? strings.institutionSiteTitle : strings.rorRecordTitle);
  return `<a class="cv-ror-link" href="${link.href}" title="${title}">${esc}</a>`;
}

/** The CV-language bare date range ("2012–2024" / "2018–present") for an entry's
 *  right-aligned date slot, or "" when no year is known. */
function entryDatesText(item: CvItem, locale: string): string {
  const { startYear, endYear } = itemDateRange(item);
  const rs = renderStrings(locale);
  return bareYearRange(startYear, endYear, rs.datePresent, rs.dateUntil);
}

/**
 * A Positions / Education entry as a structured TWO-LINE record (HTML/PDF only):
 * a prominent lead line — the role, with the date range pushed to the right edge —
 * over a quieter "department · institution" line. Built straight from the
 * structured `meta` (role / department / institution / dates), so it needs NONE of
 * the flat-string substring hacks (`localizeEntryLine` / `withRorLink`): the
 * institution is localized + ROR-linked here and the dates localized here. When the
 * role is absent (the common OpenAlex case yielding only an institution), the
 * institution is promoted to the lead line and the sub-line is dropped — so a
 * sparse entry collapses to a single clean line instead of an empty role slot.
 */
function positionEntryHtml(item: CvItem, locale: string): string {
  const role = itemRoleTitle(item)?.trim();
  const dept = itemDepartment(item)?.trim();
  const inst = institutionSpanHtml(item, locale);
  const dates = entryDatesText(item, locale);
  const datesHtml = dates ? `<span class="cv-entry-dates">${escapeHtml(dates)}</span>` : "";
  // Role leads when known; otherwise the institution becomes the lead line.
  const lead = role ? escapeHtml(role) : inst;
  const subParts = role ? [dept ? escapeHtml(dept) : "", inst] : [dept ? escapeHtml(dept) : ""];
  const sub = subParts.filter(Boolean).join(" · ");
  const head = `<div class="cv-entry-head"><span class="cv-entry-lead">${lead}</span>${datesHtml}</div>`;
  const subLine = sub ? `<div class="cv-entry-sub">${sub}</div>` : "";
  return `<div class="cv-entry">${head}${subLine}</div>`;
}

/**
 * Linkify the trailing DOI URL on a Datasets & Software ENTRY line (DataCite /
 * OpenAIRE), so it's clickable like the citeproc-rendered work entries in the same
 * section. `formatDatasetText` appends `https://doi.org/<doi>` to the entry text;
 * here we wrap that exact substring in an anchor (`externalizeLinks` later adds
 * target/rel). No-op when the item has no DOI.
 */
function withDoiLink(html: string, item: CvItem): string {
  const doi = item.meta.doi;
  if (!doi) return html;
  const url = `https://doi.org/${doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")}`;
  const esc = escapeHtml(url);
  const at = html.lastIndexOf(esc);
  /* v8 ignore next -- the URL is always present in a DataCite/OpenAIRE entry's text */
  if (at < 0) return html;
  return `${html.slice(0, at)}<a class="cv-doi-link" href="${esc}">${esc}</a>${html.slice(
    at + esc.length,
  )}`;
}

/**
 * Public-page-only per-publication affordances appended under a citation entry: a
 * no-JS "Cite" disclosure linking to the per-item BibTeX / RIS / CSL-JSON downloads
 * (`/p/<slug>/cite`), an open-access "Full text" link (when the work has one), and
 * an "Abstract" disclosure (when one was reconstructed). All CSS-only (`<details>`),
 * so it works under the strict no-JS public-page CSP. The slug is validated upstream
 * (`isValidPublicSlug`); the id + slug are URL-encoded and the whole href escaped,
 * and the abstract text is HTML-escaped. "" for non-citation entries.
 */
function itemToolsHtml(item: CvItem, slug: string, locale: string): string {
  if (!item.csl) return "";
  const s = renderStrings(locale);
  const cite = (fmt: string, label: string): string => {
    const href = `/p/${encodeURIComponent(slug)}/cite?id=${encodeURIComponent(
      item.id,
    )}&format=${fmt}`;
    return `<a href="${escapeHtml(href)}">${label}</a>`;
  };
  const parts: string[] = [
    `<details class="cv-cite"><summary>${escapeHtml(s.citeLabel)}</summary>` +
      `<span class="cv-cite-fmts">${cite("bibtex", "BibTeX")} ${cite("ris", "RIS")} ${cite(
        "csljson",
        "CSL-JSON",
      )}</span></details>`,
  ];
  const oa = safeHref(item.meta.oaUrl);
  if (oa) {
    parts.push(
      `<a class="cv-fulltext" href="${escapeHtml(oa)}">${escapeHtml(s.fullTextLabel)}</a>`,
    );
  }
  const abstract = item.csl.abstract?.trim();
  if (abstract) {
    parts.push(
      `<details class="cv-abstract"><summary>${escapeHtml(
        s.abstractLabel,
      )}</summary><p>${escapeHtml(abstract)}</p></details>`,
    );
  }
  // An invisible COinS span so reference managers (Zotero, Mendeley…) detect this
  // work — one per publication on the page → the connector's multi-item select-and-
  // import (the Google-Scholar-style picker).
  return `<div class="cv-itemtools">${coinsSpan(item.csl)}${parts.join("")}</div>`;
}

/**
 * Render the canonical object to a standalone HTML document.
 *
 * Single rendering path shared by the preview and (via the PDF renderer) the
 * PDF export. Citations are produced once by citeproc for consistency; each
 * entry is then highlighted iff the item is the user's own (identifier match)
 * and highlighting is enabled.
 */
/**
 * Citeproc-render every section's bibliography (once), then highlight the
 * account holder's own entries and append inline badges. Shared by the print
 * templates (renderCvHtml) and the animated web export. `opts.publicExtras`
 * (+`opts.slug`, set only by the public `/p/[slug]` route) additionally appends the
 * per-publication Cite/Abstract/Full-text affordance under each citation entry.
 */
export function buildRenderedSections(cv: CanonicalCv, opts?: RenderOpts): RenderedSection[] {
  const publicExtras = Boolean(opts?.publicExtras && opts.slug);
  return prepareSections(cv, "html").map(({ section, items }) => {
    // Positions/Education entries render as a structured two-line record (built
    // from the source meta) — see positionEntryHtml. The flat-string ROR link
    // (withRorLink) is only the FALLBACK for these sections now (a user free-text
    // override, or an entry with no institution to anchor the structured layout).
    // (The rirekisho template builds its own 学歴・職歴 table from plain text, so it
    // naturally opts out — it never goes through buildRenderedSections.)
    const isHistory = section.type === "positions" || section.type === "education";
    // Datasets & Software ENTRY rows (DataCite/OpenAIRE) carry a DOI in their text;
    // make it clickable so they match the citeproc work rows in the same section.
    const linkDoi = section.type === "datasets";
    return {
      section,
      items: items.map(({ item, entry }) => {
        // Structured two-line layout for a source-derived history entry; fall back
        // to the flat line when the user typed an override or there's no institution.
        if (isHistory && !item.displayTextOverride && itemInstitution(item)) {
          return { item, html: positionEntryHtml(item, cv.display.locale) };
        }
        let html = entry;
        if (linkDoi && !item.csl) html = withDoiLink(html, item);
        if (cv.display.highlightSelf && item.authoredBySelf && item.selfNameVariants.length > 0) {
          html = highlightSelf(html, item.selfNameVariants);
        }
        html += itemBadges(item, cv.display);
        if (isHistory) html = withRorLink(html, item, cv.display.locale);
        // Public-page-only: a no-JS Cite/Abstract/Full-text affordance per work.
        if (publicExtras) html += itemToolsHtml(item, opts!.slug!, cv.display.locale);
        return { item, html };
      }),
    };
  });
}

export function renderCvHtml(cv: CanonicalCv, opts?: RenderOpts): string {
  const rendered = buildRenderedSections(cv, opts);
  const template = getTemplate(cv.display.template);
  const theme = resolveTheme(cv.display);
  return template.render(cv, rendered, theme, opts);
}

export const htmlRenderer: Renderer = {
  format: "html",
  async render({ cv, opts }: RenderInput): Promise<RenderResult> {
    const html = renderCvHtml(cv, opts);
    return {
      format: "html",
      mimeType: "text/html; charset=utf-8",
      filename: `${cvSlug(cv.owner.displayName)}-cv.html`,
      html,
      text: html,
    };
  },
};
