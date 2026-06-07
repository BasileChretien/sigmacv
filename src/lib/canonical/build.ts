import {
  CANONICAL_SCHEMA_VERSION,
  CanonicalCvSchema,
  DEFAULT_SECTION_ORDER,
  DisplayChoicesSchema,
  type CanonicalCv,
  type CvItem,
  type CvSection,
} from "./schema";
import { computeDerivedMetrics, workTopDecile } from "@/lib/openalex/deriveMetrics";
import { isDefaultSectionTitle, sectionTitle } from "@/lib/i18n";
import { toCslName, workToCsl } from "@/lib/openalex/toCsl";
import {
  normalizeOrcid,
  shortId,
  type OpenAlexAuthorship,
  type OpenAlexWork,
} from "@/lib/openalex/types";
import type {
  ResolvedAffiliation,
  ResolvedAuthor,
} from "@/lib/openalex/resolveAuthor";
import type {
  OrcidFunding,
  OrcidPeerReviewGroup,
  OrcidPosition,
} from "@/lib/orcid/client";
import type { DataciteOutput } from "@/lib/datacite/client";
import type { EditorialRole } from "@/lib/oep/client";

const PUBLICATIONS_SECTION_ID = "publications";

export interface BuildArgs {
  /** Stable canonical id — use the Cv DB row id. */
  id: string;
  resolved: ResolvedAuthor;
  works: OpenAlexWork[];
  /** ISO timestamp; caller supplies for determinism/testing. */
  now: string;
  /** Previous canonical object, to preserve curation + display on re-sync. */
  previous?: CanonicalCv | null;
  /** Editorial roles from OEP (optional; empty = no editorial section). */
  editorialRoles?: EditorialRole[];
  /** Self-asserted employment history from ORCID (Positions section). */
  employments?: OrcidPosition[];
  /** Self-asserted funding/grants from ORCID (Grants section). */
  fundings?: OrcidFunding[];
  /** ORCID invited positions — merged into the Positions section. */
  invitedPositions?: OrcidPosition[];
  /** ORCID education + qualification records (Education section). */
  education?: OrcidPosition[];
  /** ORCID distinctions (Awards & Honors section). */
  distinctions?: OrcidPosition[];
  /** ORCID memberships + services (Service section). */
  service?: OrcidPosition[];
  /** ORCID peer-review activity, aggregated by venue (Peer Review section). */
  peerReviews?: OrcidPeerReviewGroup[];
  /** DataCite datasets/software outputs (Datasets & Software section). */
  dataciteOutputs?: DataciteOutput[];
}

/** "<title>. <publisher> (<year>) [<type>]" for a DataCite output. */
function formatDatasetText(o: DataciteOutput): string {
  const head = o.publisher ? `${o.title}. ${o.publisher}` : o.title;
  const yr = o.year ? ` (${o.year})` : "";
  return `${head}${yr} [${o.type}]`;
}

/** Datasets & Software section from DataCite outputs (+ manual entries). */
function buildDatasetsSection(
  outputs: DataciteOutput[],
  prevItems: Map<string, CvItem>,
  manual: CvItem[],
  now: string,
): CvSection | null {
  const items: CvItem[] = [];
  let rank = 0;
  const sorted = [...outputs].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  for (const o of sorted) {
    const id = `dataset:datacite:${o.doi.replace(/[^a-z0-9]+/gi, "-")}`;
    const it = makeEntryItem(
      id,
      "datacite",
      o.doi,
      formatDatasetText(o),
      prevItems.get(id),
      rank++,
      o.year,
      { lastVerifiedAt: now },
    );
    items.push({ ...it, meta: { ...it.meta, doi: o.doi } });
  }
  for (const m of manual) {
    items.push({ ...m, order: prevItems.get(m.id)?.order ?? rank++ });
  }
  if (items.length === 0) return null;
  return {
    id: "datasets",
    type: "datasets",
    title: "Datasets & Software",
    visible: true,
    order: 2,
    items: reindexItems(items),
  };
}

/** Year range like "(2012–2024)" / "(2024–present)". Empty if no years. */
function yearRange(start?: number, end?: number): string {
  if (start && end) return `(${start}–${end})`;
  if (start) return `(${start}–present)`;
  if (end) return `(until ${end})`;
  return "";
}

function normInstitution(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Carry over the user's manually-added items of a given section type. */
function previousManualItems(
  previous: CanonicalCv | null | undefined,
  sectionType: CvSection["type"],
): CvItem[] {
  const section = previous?.sections.find((s) => s.type === sectionType);
  return (section?.items ?? []).filter((it) => it.source === "manual");
}

/**
 * User-added publication/preprint items the fresh pull didn't return — manual
 * structured entries AND DOI-claimed works (`meta.claimed`). They must survive a
 * re-sync: `mergeSection` only preserves a section's chrome (title/visibility/
 * order), not items, so without this they would silently vanish. De-duped against
 * the freshly-fetched set by id AND DOI, so once OpenAlex finally attributes a
 * claimed work, the properly-attributed fetched copy supersedes the claim.
 */
function carryOverUserItems(
  fetched: CvItem[],
  previous: CanonicalCv | null | undefined,
  sectionType: CvSection["type"],
): CvItem[] {
  const prevSection = previous?.sections.find((s) => s.type === sectionType);
  if (!prevSection) return fetched;
  const ids = new Set(fetched.map((it) => it.id));
  const dois = new Set(
    fetched
      .map((it) => it.csl?.DOI?.toLowerCase())
      .filter((d): d is string => Boolean(d)),
  );
  const carried = prevSection.items.filter(
    (it) =>
      (it.source === "manual" || it.meta.claimed === true) &&
      !ids.has(it.id) &&
      !(it.csl?.DOI && dois.has(it.csl.DOI.toLowerCase())),
  );
  return carried.length ? [...fetched, ...carried] : fetched;
}

/** Normalize a list to a clean 0..n order, preserving relative order. */
function reindexItems(items: CvItem[]): CvItem[] {
  return [...items]
    .sort((a, b) => a.order - b.order)
    .map((it, i) => ({ ...it, order: i }));
}

/** Apply a section's preserved title/visibility/order from the previous CV. */
function mergeSection(
  built: CvSection,
  previous: CanonicalCv | null | undefined,
): CvSection {
  const prev = previous?.sections.find((s) => s.id === built.id);
  if (!prev) return built;
  return { ...built, title: prev.title, visible: prev.visible, order: prev.order };
}

/** A non-citation item (position / grant) with curation preserved from prev. */
function makeEntryItem(
  id: string,
  source: CvItem["source"],
  sourceId: string,
  displayText: string,
  prev: CvItem | undefined,
  order: number,
  year?: number,
  /** Extra meta (ROR id, freshness, funder ids) for items from a live source fetch. */
  extraMeta?: {
    rorId?: string;
    lastVerifiedAt?: string;
    funderId?: string;
    funderName?: string;
    awardId?: string;
  },
): CvItem {
  const meta: CvItem["meta"] = {};
  if (year) meta.year = year;
  if (extraMeta?.rorId) meta.rorId = extraMeta.rorId;
  if (extraMeta?.lastVerifiedAt) meta.lastVerifiedAt = extraMeta.lastVerifiedAt;
  if (extraMeta?.funderId) meta.funderId = extraMeta.funderId;
  if (extraMeta?.funderName) meta.funderName = extraMeta.funderName;
  if (extraMeta?.awardId) meta.awardId = extraMeta.awardId;
  return {
    id,
    source,
    sourceId,
    displayText,
    included: prev?.included ?? true,
    notMine: prev?.notMine ?? false,
    notMineAssertedAt: prev?.notMineAssertedAt,
    // Preserve the disambiguation reason across re-syncs (parity with the
    // publications path) — entry items can be "not mine" too (e.g. an OEP
    // editorial role attributed to the wrong ORCID).
    notMineReason: prev?.notMineReason,
    order: prev?.order ?? order,
    authoredBySelf: false,
    selfNameVariants: [],
    meta,
  };
}

function formatPositionText(p: OrcidPosition): string {
  const head = [p.roleTitle, p.department].filter(Boolean).join(", ");
  const label = head ? `${head}, ${p.organization}` : p.organization;
  const yrs = yearRange(p.startYear, p.endYear);
  return yrs ? `${label} ${yrs}` : label;
}

/** "present"/current positions first, then by start year descending. */
function positionRecency(start?: number, end?: number): number {
  return (end ?? 9999) * 10000 + (start ?? 0);
}

/**
 * Positions / employment. Primary source: ORCID employments (role + dates).
 * OpenAlex affiliations fill in institutions ORCID doesn't list. The user's own
 * manually-added positions are always carried over.
 */
function buildPositionsSection(
  employments: OrcidPosition[],
  affiliations: ResolvedAffiliation[],
  prevItems: Map<string, CvItem>,
  manual: CvItem[],
  now: string,
): CvSection | null {
  const items: CvItem[] = [];
  const seen = new Set<string>();
  let rank = 0;

  const sortedEmp = [...employments].sort(
    (a, b) =>
      positionRecency(b.startYear, b.endYear) -
      positionRecency(a.startYear, a.endYear),
  );
  for (const e of sortedEmp) {
    seen.add(normInstitution(e.organization));
    const id = `position:orcid:${e.putCode}`;
    items.push(
      makeEntryItem(id, "orcid", e.putCode, formatPositionText(e), prevItems.get(id), rank++, e.startYear, {
        rorId: e.rorId,
        lastVerifiedAt: now,
      }),
    );
  }
  for (const a of affiliations) {
    if (seen.has(normInstitution(a.institution))) continue;
    seen.add(normInstitution(a.institution));
    const id = `position:openalex:${normInstitution(a.institution).replace(/[^a-z0-9]+/g, "-")}`;
    const yrs = yearRange(a.startYear, a.endYear);
    const text = yrs ? `${a.institution} ${yrs}` : a.institution;
    // OpenAlex affiliations are inferred from papers and are NOISY (they include
    // co-authors' institutions / spurious years). They default to HIDDEN, but we
    // respect a user who explicitly un-hid one (prev.included === true) so the
    // choice survives re-sync. New ones start hidden.
    const prev = prevItems.get(id);
    const item = makeEntryItem(id, "openalex", "openalex", text, prev, rank++, a.startYear, {
      rorId: a.rorId,
      lastVerifiedAt: now,
    });
    items.push({ ...item, included: prev?.included ?? false });
  }
  for (const m of manual) {
    items.push({ ...m, order: prevItems.get(m.id)?.order ?? rank++ });
  }

  if (items.length === 0) return null;
  return {
    id: "positions",
    type: "positions",
    title: "Positions",
    visible: true,
    order: 2,
    items: reindexItems(items),
  };
}

/** Award/distinction text: "<award>, <org> (<year>)". */
function formatAwardText(p: OrcidPosition): string {
  const label = p.roleTitle
    ? `${p.roleTitle}${p.organization ? `, ${p.organization}` : ""}`
    : p.organization;
  const yrs = grantYears(p.startYear, p.endYear);
  return yrs ? `${label} ${yrs}` : label;
}

interface OrcidEntrySectionOpts {
  id: string;
  type: CvSection["type"];
  title: string;
  order: number;
  idPrefix: string;
  prevItems: Map<string, CvItem>;
  manual: CvItem[];
  /** Build timestamp — per-item freshness for these live (ORCID) entries. */
  now: string;
  /** Awards are points in time → "(2020)"; positions/education are ranges. */
  singleYear?: boolean;
}

/** Generic builder for ORCID-sourced entry sections (education, awards, service). */
function buildOrcidEntrySection(
  entries: OrcidPosition[],
  opts: OrcidEntrySectionOpts,
): CvSection | null {
  const items: CvItem[] = [];
  let rank = 0;
  const sorted = [...entries].sort(
    (a, b) =>
      positionRecency(b.startYear, b.endYear) -
      positionRecency(a.startYear, a.endYear),
  );
  for (const e of sorted) {
    const id = `${opts.idPrefix}:orcid:${e.putCode}`;
    const text = opts.singleYear ? formatAwardText(e) : formatPositionText(e);
    items.push(
      makeEntryItem(id, "orcid", e.putCode, text, opts.prevItems.get(id), rank++, e.startYear, {
        rorId: e.rorId,
        lastVerifiedAt: opts.now,
      }),
    );
  }
  for (const m of opts.manual) {
    items.push({ ...m, order: opts.prevItems.get(m.id)?.order ?? rank++ });
  }
  if (items.length === 0) return null;
  return {
    id: opts.id,
    type: opts.type,
    title: opts.title,
    visible: true,
    order: opts.order,
    items: reindexItems(items),
  };
}

/** Peer-review section: one entry per journal with a review count. Labelled by
 *  the resolved JOURNAL name (falls back to the convening org/publisher). */
function buildPeerReviewSection(
  groups: OrcidPeerReviewGroup[],
  prevItems: Map<string, CvItem>,
  manual: CvItem[],
  now: string,
): CvSection | null {
  const items: CvItem[] = [];
  let rank = 0;
  for (const g of groups) {
    const label = g.journal ?? g.organization;
    // Stable id keyed by ISSN when available, else the label.
    const key = g.issn ?? normInstitution(label);
    const id = `peer-review:orcid:${key.replace(/[^a-z0-9]+/g, "-")}`;
    const text = `${label} — ${g.count} review${g.count === 1 ? "" : "s"}`;
    items.push(
      makeEntryItem(id, "orcid", "peer-review", text, prevItems.get(id), rank++, undefined, {
        lastVerifiedAt: now,
      }),
    );
  }
  for (const m of manual) {
    items.push({ ...m, order: prevItems.get(m.id)?.order ?? rank++ });
  }
  if (items.length === 0) return null;
  return {
    id: "peer-review",
    type: "peer-review",
    title: "Peer Review",
    visible: true,
    order: 7,
    items: reindexItems(items),
  };
}

/** Grant year(s): a single award year stays "(2025)" (not "2025–present"). */
function grantYears(start?: number, end?: number): string {
  if (start && end && start !== end) return `(${start}–${end})`;
  if (start) return `(${start})`;
  if (end) return `(${end})`;
  return "";
}

function formatFundingText(f: OrcidFunding): string {
  const label = f.organization ? `${f.title}, ${f.organization}` : f.title;
  const yrs = grantYears(f.startYear, f.endYear);
  return yrs ? `${label} ${yrs}` : label;
}

/**
 * Index OpenAlex paper-level `grants[]` by award number (lower-cased) so a
 * person-attributed ORCID funding lacking a disambiguated identifier can borrow
 * the matching OpenAlex funder id/name. OpenAlex grants are NOT a standalone
 * source (they're often co-authors' funding) — only used to attach identifiers
 * to a grant the user already asserted via ORCID.
 */
export function indexFundersByAward(
  works: OpenAlexWork[],
): Map<string, { funderId?: string; funderName?: string }> {
  const out = new Map<string, { funderId?: string; funderName?: string }>();
  for (const w of works) {
    for (const g of w.grants ?? []) {
      const award = g.award_id?.trim().toLowerCase();
      if (!award || out.has(award)) continue;
      out.set(award, {
        funderId: g.funder ?? undefined,
        funderName: g.funder_display_name ?? undefined,
      });
    }
  }
  return out;
}

/**
 * Resolve the interoperable funder identifiers for one ORCID funding record.
 * ORCID's own disambiguated-organization id + org name + award number are
 * authoritative; an OpenAlex `grants[]` match (by award number) fills only the
 * funder id/name that ORCID didn't carry. Never invents an identifier.
 */
export function resolveFunderIds(
  f: OrcidFunding,
  fundersByAward: Map<string, { funderId?: string; funderName?: string }>,
): { funderId?: string; funderName?: string; awardId?: string } {
  const oa = f.awardId ? fundersByAward.get(f.awardId.trim().toLowerCase()) : undefined;
  return {
    funderId: f.funderId ?? oa?.funderId,
    funderName: f.organization ?? oa?.funderName,
    awardId: f.awardId,
  };
}

/**
 * Grants & funding from the user's OWN ORCID funding records (person-attributed),
 * NOT OpenAlex paper-level awards (which are often co-authors'). Funder/award
 * identifiers come from ORCID's disambiguated organization + external ids, with
 * OpenAlex `grants[]` (matched by award number) filling a missing funder id only.
 * Manual entries are carried over.
 */
function buildGrantsSection(
  fundings: OrcidFunding[],
  prevItems: Map<string, CvItem>,
  manual: CvItem[],
  now: string,
  fundersByAward: Map<string, { funderId?: string; funderName?: string }>,
): CvSection | null {
  const items: CvItem[] = [];
  let rank = 0;
  const sorted = [...fundings].sort((a, b) => (b.startYear ?? 0) - (a.startYear ?? 0));
  for (const f of sorted) {
    const id = `grant:orcid:${f.putCode}`;
    const funder = resolveFunderIds(f, fundersByAward);
    items.push(
      makeEntryItem(id, "orcid", f.putCode, formatFundingText(f), prevItems.get(id), rank++, f.startYear, {
        lastVerifiedAt: now,
        funderId: funder.funderId,
        funderName: funder.funderName,
        awardId: funder.awardId,
      }),
    );
  }
  for (const m of manual) {
    items.push({ ...m, order: prevItems.get(m.id)?.order ?? rank++ });
  }

  if (items.length === 0) return null;
  return {
    id: "grants",
    type: "grants",
    title: "Grants & Funding",
    visible: true,
    order: 8,
    items: reindexItems(items),
  };
}

/**
 * Build the editorial-roles section. Roles come from the Open Editors Plus
 * dataset (the OepEditorialRole table, populated by `npm run oep:import`); the
 * user's own manually-added editorial entries are always carried over too — so
 * the section works even with no OEP data. Returns null only when there are
 * neither.
 *
 * Each OEP role gets a STABLE content-based id (journal + role) and goes through
 * `makeEntryItem`, so the user's curation — Hide AND a "not mine" assertion (OEP
 * attributed this editorship to the wrong ORCID) with its reason — survives a
 * re-sync even if the dataset's row order changes. Editorial roles are a
 * third-party identifier match, so "not mine" is a real disambiguation signal,
 * exactly like publications.
 */
function buildEditorialSection(
  roles: EditorialRole[],
  prevItems: Map<string, CvItem>,
  manual: CvItem[],
  now: string,
): CvSection | null {
  const key = (s: string) => normInstitution(s).replace(/[^a-z0-9]+/g, "-");
  const items: CvItem[] = [];
  let rank = 0;
  for (const r of roles) {
    const years = r.startYear
      ? ` (${r.startYear}–${r.endYear ?? "present"})`
      : "";
    const id = `editorial:${key(r.journal)}:${key(r.role)}`;
    items.push(
      makeEntryItem(
        id,
        "oep",
        "oep",
        `${r.role}, ${r.journal}${years}`,
        prevItems.get(id),
        rank++,
        undefined,
        { lastVerifiedAt: now },
      ),
    );
  }
  for (const m of manual) {
    items.push({ ...m, order: prevItems.get(m.id)?.order ?? rank++ });
  }
  if (items.length === 0) return null;
  return {
    id: "editorial",
    type: "editorial",
    title: "Editorial Roles",
    visible: true,
    order: 6,
    items: reindexItems(items),
  };
}

/**
 * A work is a preprint if OpenAlex/Crossref types it so ("preprint" or
 * "posted-content"), or its primary source is a repository. Catches preprints
 * that would otherwise land in Publications.
 */
export function isPreprint(work: OpenAlexWork): boolean {
  const type = (work.type ?? "").toLowerCase();
  if (type === "preprint" || type === "posted-content") return true;
  if ((work.primary_location?.source?.type ?? "").toLowerCase() === "repository") return true;
  // No published venue (journal/conference) → treat as a preprint/unpublished.
  return !work.primary_location?.source?.display_name;
}

// OpenAlex `type` values that are NOT peer-reviewed scholarship.
// NOTE: "letter" is NOT here — a letter/correspondence published in a real
// journal venue (research letters, ADR case letters, etc.) IS peer-reviewed.
// A letter with no venue still falls through isPreprint() → not peer-reviewed.
const NON_PEER_REVIEWED_TYPES = new Set([
  "preprint",
  "posted-content",
  "dataset",
  "paratext",
  "supplementary-materials",
  "other",
  "peer-review",
  "grant",
  "editorial",
]);

/**
 * Heuristic: is this a peer-reviewed output? False for preprints (by type OR
 * repository source — catches preprints that slipped into Publications), for
 * non-scholarly types, and for works with no published venue. Identifier/metadata
 * based; the user can still override per item via hide. Drives the
 * "peer-reviewed only" filter.
 */
export function isPeerReviewed(work: OpenAlexWork): boolean {
  if (isPreprint(work)) return false;
  const type = (work.type ?? "").toLowerCase();
  if (NON_PEER_REVIEWED_TYPES.has(type)) return false;
  // Require a real publication venue (journal/conference/book), not a repository.
  return Boolean(work.primary_location?.source?.display_name);
}

/**
 * A soft disambiguation hint for proactive review. The work matched as the
 * account holder's (typically by OpenAlex author id), but THIS paper lists a
 * DIFFERENT ORCID for that authorship — a classic same-name collision. Purely
 * identifier-based (never name strings); advisory only and never auto-hides.
 */
export function reviewFlagFor(
  selfAuth: OpenAlexAuthorship | undefined,
  ownerOrcid: string,
): string | undefined {
  if (!selfAuth || !ownerOrcid) return undefined;
  const authOrcid = normalizeOrcid(selfAuth.author?.orcid);
  return authOrcid && authOrcid !== ownerOrcid ? "orcid-conflict" : undefined;
}

/**
 * Reuse license of a work, from OpenAlex's `primary_location.license`, falling
 * back to `best_oa_location.license` (a work can be closed at its primary
 * location but openly licensed via an OA copy). Undefined when neither carries one.
 */
export function workLicense(work: OpenAlexWork): string | undefined {
  return (
    work.primary_location?.license ?? work.best_oa_location?.license ?? undefined
  );
}

/**
 * Bare PubMed id from OpenAlex `ids.pmid`, which is a URL
 * ("https://pubmed.ncbi.nlm.nih.gov/12345678"). Returns just the numeric id, or
 * undefined when absent / not numeric.
 */
export function workPmid(work: OpenAlexWork): string | undefined {
  const pmid = work.ids?.pmid;
  if (!pmid) return undefined;
  const m = /(\d+)\/?$/.exec(pmid.trim());
  return m ? m[1] : undefined;
}

/** A human label for the account holder's authorship role on a work, or undefined. */
export function authorRoleLabel(a: OpenAlexAuthorship | undefined): string | undefined {
  if (!a) return undefined;
  const parts: string[] = [];
  const pos = (a.author_position ?? "").toLowerCase();
  if (pos === "first") parts.push("first");
  else if (pos === "last") parts.push("last");
  if (a.is_corresponding) parts.push("corresponding");
  return parts.length ? parts.join(", ") : undefined;
}

/** Build the identifier matcher for the account holder. */
/** How an authorship matched the account holder — the crux signal for the
 *  author-disambiguation-error study (an ORCID match is far stronger than an
 *  OpenAlex-author-id match). null = no match. */
export type MatchBasis = "orcid" | "openalex-id" | "both";

export function makeSelfMatcher(resolved: ResolvedAuthor) {
  const selfOrcid = normalizeOrcid(resolved.orcid);
  const selfAuthorIds = new Set(resolved.authorIds.map(shortId).filter(Boolean));

  function basisFor(a: OpenAlexAuthorship): MatchBasis | null {
    const aid = shortId(a.author?.id);
    const byId = !!(aid && selfAuthorIds.has(aid));
    const ao = normalizeOrcid(a.author?.orcid);
    const byOrcid = !!ao && ao === selfOrcid;
    if (byId && byOrcid) return "both";
    if (byOrcid) return "orcid";
    if (byId) return "openalex-id";
    return null;
  }

  function matches(a: OpenAlexAuthorship): boolean {
    return basisFor(a) !== null;
  }

  return { matches, basisFor };
}

/** Self name(s) exactly as printed on this work (from matched authorships). */
export function selfNameVariants(
  work: OpenAlexWork,
  matches: (a: OpenAlexAuthorship) => boolean,
): string[] {
  const out = new Set<string>();
  for (const a of work.authorships ?? []) {
    if (!matches(a)) continue;
    const display = a.author?.display_name ?? a.raw_author_name;
    if (display) {
      out.add(display);
      const csl = toCslName(display);
      if (csl.family) out.add(csl.family);
    }
    if (a.raw_author_name) out.add(a.raw_author_name);
  }
  return [...out];
}

function dedupeWorks(works: OpenAlexWork[]): OpenAlexWork[] {
  const seen = new Set<string>();
  const out: OpenAlexWork[] = [];
  for (const w of works) {
    const id = shortId(w.id);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(w);
  }
  return out;
}

/** Newest first, then by title for stable ordering. */
function byRecency(a: OpenAlexWork, b: OpenAlexWork): number {
  const ya = a.publication_year ?? 0;
  const yb = b.publication_year ?? 0;
  if (yb !== ya) return yb - ya;
  return (a.title ?? "").localeCompare(b.title ?? "");
}

export function buildCanonicalCv(args: BuildArgs): CanonicalCv {
  const { id, resolved, now, previous } = args;
  const { matches, basisFor } = makeSelfMatcher(resolved);
  const ownerOrcid = normalizeOrcid(resolved.orcid);
  const works = dedupeWorks(args.works).sort(byRecency);

  // Preserve prior per-item curation (included flag) and ordering on re-sync.
  const prevItems = new Map<string, CvItem>();
  // Secondary index by DOI: OpenAlex occasionally changes a work's primary id
  // (merges/splits). Anchoring on DOI too means a hidden / "not mine" decision
  // survives id churn — a resurrected "not mine" would both mis-display the CV
  // and corrupt the disambiguation dataset.
  const prevByDoi = new Map<string, CvItem>();
  for (const s of previous?.sections ?? []) {
    for (const it of s.items) {
      prevItems.set(it.id, it);
      const doi = it.csl?.DOI ?? it.meta.doi;
      if (doi) prevByDoi.set(doi.toLowerCase(), it);
    }
  }
  // New works are appended AFTER everything the user already curated (newest
  // first, since `works` is recency-sorted) so a re-sync never reshuffles their
  // existing arrangement.
  const prevOrders = [...prevItems.values()].map((it) => it.order);
  const maxPrevOrder = prevOrders.length > 0 ? Math.max(...prevOrders) : -1;
  let newItemRank = 0;

  const preprintIds = new Set<string>();
  const items: CvItem[] = works.map((work) => {
    const csl = workToCsl(work);
    const selfIndex = (work.authorships ?? []).findIndex(matches);
    const selfAuth = selfIndex >= 0 ? work.authorships![selfIndex] : undefined;
    const authoredBySelf = Boolean(selfAuth);
    if (isPreprint(work)) preprintIds.add(csl.id);
    // Match by id, else by DOI (id churn) to preserve hide / "not mine" decisions.
    const prev =
      prevItems.get(csl.id) ??
      (csl.DOI ? prevByDoi.get(csl.DOI.toLowerCase()) : undefined);
    return {
      id: csl.id,
      source: "openalex",
      sourceId: work.id,
      csl,
      // Keep the user's earlier display + disambiguation decisions on re-sync,
      // so a re-pull never resurfaces a hidden or asserted-not-mine work.
      included: prev?.included ?? true,
      notMine: prev?.notMine ?? false,
      notMineAssertedAt: prev?.notMineAssertedAt,
      // Preserve the user's disambiguation reason across re-syncs.
      notMineReason: prev?.notMineReason,
      order: prev ? prev.order : maxPrevOrder + 1 + newItemRank++,
      authoredBySelf,
      selfNameVariants: authoredBySelf ? selfNameVariants(work, matches) : [],
      meta: {
        year: work.publication_year ?? undefined,
        type: work.type ?? undefined,
        doi: csl.DOI,
        citedByCount: work.cited_by_count,
        // Per-work field-normalized data, stored so the FWCI mean + top-10%
        // share recompute over the CURATED works (excluding "not mine"/hidden).
        fwci: typeof work.fwci === "number" ? work.fwci : undefined,
        topDecile: workTopDecile(work),
        oaStatus:
          work.open_access?.is_oa && work.open_access.oa_status
            ? work.open_access.oa_status
            : undefined,
        // Reuse license + PubMed id (FAIR / open-science surfacing).
        license: workLicense(work),
        pmid: workPmid(work),
        // Per-item freshness: this work came from a live OpenAlex fetch.
        lastVerifiedAt: now,
        authorRole: authorRoleLabel(selfAuth),
        authorCount: work.authorships?.length,
        // 1-based position of the account holder among the authors (for the
        // authorship-summary table) + corresponding flag.
        authorPosition: authoredBySelf ? selfIndex + 1 : undefined,
        isCorresponding: selfAuth?.is_corresponding === true ? true : undefined,
        // Which identifier made the self-match (ORCID > OpenAlex id). Recorded so
        // the disambiguation-error study can stratify errors by match strength.
        matchBasis: selfAuth ? (basisFor(selfAuth) ?? undefined) : undefined,
        peerReviewed: isPeerReviewed(work),
        reviewFlag: authoredBySelf ? reviewFlagFor(selfAuth, ownerOrcid) : undefined,
      },
    };
  });

  // Normalize order to a clean 0..n sequence (respecting any preserved order).
  const ordered = [...items]
    .sort((a, b) => a.order - b.order)
    .map((it, i) => ({ ...it, order: i }));

  // Split into Publications vs Preprints (so the CV doesn't double-count a
  // preprint and its published version, and matches academic convention).
  const pubItems = reindexItems(
    carryOverUserItems(
      ordered.filter((it) => !preprintIds.has(it.id)),
      previous,
      "publications",
    ),
  );
  const preprintItems = reindexItems(
    carryOverUserItems(
      ordered.filter((it) => preprintIds.has(it.id)),
      previous,
      "preprints",
    ),
  );

  const publicationsSection = mergeSection(
    {
      id: PUBLICATIONS_SECTION_ID,
      type: "publications",
      title: "Publications",
      visible: true,
      order: 0,
      items: pubItems,
    },
    previous,
  );

  const preprintsSection: CvSection | null =
    preprintItems.length > 0
      ? mergeSection(
          {
            id: "preprints",
            type: "preprints",
            title: "Preprints",
            visible: true,
            order: 1,
            items: preprintItems,
          },
          previous,
        )
      : null;

  const positionsSection = buildPositionsSection(
    args.employments ?? [],
    resolved.affiliations ?? [],
    prevItems,
    previousManualItems(previous, "positions"),
    now,
  );
  // ORCID "invited positions" are visiting/invited roles & talks — surfaced as a
  // dedicated Invited Talks section (a CV staple) rather than buried in Positions.
  const talksSection = buildOrcidEntrySection(args.invitedPositions ?? [], {
    id: "talks",
    type: "talks",
    title: "Invited Talks",
    order: DEFAULT_SECTION_ORDER.talks,
    idPrefix: "talk",
    prevItems,
    manual: previousManualItems(previous, "talks"),
    now,
  });
  const educationSection = buildOrcidEntrySection(args.education ?? [], {
    id: "education",
    type: "education",
    title: "Education",
    order: 3,
    idPrefix: "education",
    prevItems,
    manual: previousManualItems(previous, "education"),
    now,
  });
  const awardsSection = buildOrcidEntrySection(args.distinctions ?? [], {
    id: "awards",
    type: "awards",
    title: "Awards & Honors",
    order: 4,
    idPrefix: "award",
    prevItems,
    manual: previousManualItems(previous, "awards"),
    singleYear: true,
    now,
  });
  const serviceSection = buildOrcidEntrySection(args.service ?? [], {
    id: "service",
    type: "service",
    title: "Service & Memberships",
    order: 5,
    idPrefix: "service",
    prevItems,
    manual: previousManualItems(previous, "service"),
    now,
  });
  const peerReviewSection = buildPeerReviewSection(
    args.peerReviews ?? [],
    prevItems,
    previousManualItems(previous, "peer-review"),
    now,
  );
  const editorialSection = buildEditorialSection(
    args.editorialRoles ?? [],
    prevItems,
    previousManualItems(previous, "editorial"),
    now,
  );
  const grantsSection = buildGrantsSection(
    args.fundings ?? [],
    prevItems,
    previousManualItems(previous, "grants"),
    now,
    indexFundersByAward(works),
  );

  const datasetsSection = buildDatasetsSection(
    args.dataciteOutputs ?? [],
    prevItems,
    previousManualItems(previous, "datasets"),
    now,
  );

  const builtSections: CvSection[] = [
    publicationsSection,
    preprintsSection,
    datasetsSection ? mergeSection(datasetsSection, previous) : null,
    positionsSection ? mergeSection(positionsSection, previous) : null,
    educationSection ? mergeSection(educationSection, previous) : null,
    awardsSection ? mergeSection(awardsSection, previous) : null,
    talksSection ? mergeSection(talksSection, previous) : null,
    serviceSection ? mergeSection(serviceSection, previous) : null,
    peerReviewSection ? mergeSection(peerReviewSection, previous) : null,
    editorialSection ? mergeSection(editorialSection, previous) : null,
    grantsSection ? mergeSection(grantsSection, previous) : null,
  ].filter((s): s is CvSection => s !== null);

  // Carry over any PREVIOUS section that the source-driven build doesn't produce
  // — user-added manual-only sections (skills / languages / references /
  // conference / other) and PROSE sections (the narrative contributions +
  // statements, which are user-authored and never sourced). Without this they'd
  // silently vanish on every re-sync. Matched by id so a built section never
  // duplicates its carried-over twin; appended after the built sections.
  const builtIds = new Set(builtSections.map((s) => s.id));
  const carriedSections: CvSection[] = (previous?.sections ?? []).filter(
    (s) => !builtIds.has(s.id),
  );
  const allSections = [...builtSections, ...carriedSections];

  // Localize default section headings to the chosen locale (genuine user
  // renames are left untouched), and snap NEWLY-created sections to the
  // canonical default order. Sections the user already had keep their
  // arrangement (preserved by mergeSection), so re-sync never reshuffles them.
  const prevDisplay = previous?.display ?? DisplayChoicesSchema.parse({});
  const locale = prevDisplay.locale;
  // Until the user manually reorders sections, always apply the canonical
  // default order (so Positions/Education lead by default). Once they've
  // customized, keep their arrangement; only brand-new sections snap to default.
  const customized = prevDisplay.sectionsCustomized;
  const prevSectionIds = new Set((previous?.sections ?? []).map((s) => s.id));
  const sections: CvSection[] = allSections.map((s) => {
    const titled = isDefaultSectionTitle(s.type, s.title)
      ? { ...s, title: sectionTitle(locale, s.type) }
      : s;
    return customized && prevSectionIds.has(s.id)
      ? titled
      : { ...titled, order: DEFAULT_SECTION_ORDER[s.type] };
  });

  // Provenance reflects the sources that actually contributed (always include
  // openalex, the primary works source).
  const usedSources = new Set<CvItem["source"]>(["openalex"]);
  for (const s of sections) for (const it of s.items) usedSources.add(it.source);

  const display = previous?.display ?? DisplayChoicesSchema.parse({});

  // User-entered header/profile fields are NEVER sourced from OpenAlex, so they
  // must survive a re-sync. displayName is OpenAlex-derived but user-editable —
  // keep the user's value once set.
  const prevOwner = previous?.owner;

  const cv: CanonicalCv = {
    schemaVersion: CANONICAL_SCHEMA_VERSION,
    id,
    owner: {
      orcid: resolved.orcid,
      openAlexAuthorIds: resolved.authorIds,
      displayName: prevOwner?.displayName || resolved.displayName,
      honorific: prevOwner?.honorific,
      headline: prevOwner?.headline,
      summary: prevOwner?.summary,
      photo: prevOwner?.photo,
      contact: prevOwner?.contact,
      links: prevOwner?.links ?? [],
      personal: prevOwner?.personal,
      // Author-record metrics + field-normalized aggregates derived from works.
      metrics: { ...(resolved.metrics ?? {}), ...computeDerivedMetrics(works) },
      countsByYear: resolved.countsByYear ?? [],
    },
    display,
    sections,
    // Saved view-presets are a pure display concern — carry them across re-syncs.
    presets: previous?.presets ?? [],
    provenance: {
      generatedAt: previous?.provenance.generatedAt ?? now,
      lastSyncedAt: now,
      sources: [...usedSources],
    },
  };

  // Guarantee the output satisfies the load-bearing schema.
  return CanonicalCvSchema.parse(cv);
}
