import {
  CANONICAL_SCHEMA_VERSION,
  CanonicalCvSchema,
  DEFAULT_SECTION_ORDER,
  DisplayChoicesSchema,
  type CanonicalCv,
  type CvItem,
  type CvSection,
} from "./schema";
import { computeDerivedMetrics } from "@/lib/openalex/deriveMetrics";
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
): CvItem {
  return {
    id,
    source,
    sourceId,
    displayText,
    included: prev?.included ?? true,
    notMine: prev?.notMine ?? false,
    notMineAssertedAt: prev?.notMineAssertedAt,
    order: prev?.order ?? order,
    authoredBySelf: false,
    selfNameVariants: [],
    meta: year ? { year } : {},
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
      makeEntryItem(id, "orcid", e.putCode, formatPositionText(e), prevItems.get(id), rank++, e.startYear),
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
    const item = makeEntryItem(id, "openalex", "openalex", text, prev, rank++, a.startYear);
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
      makeEntryItem(id, "orcid", e.putCode, text, opts.prevItems.get(id), rank++, e.startYear),
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

/** Peer-review section: one entry per convening venue with a review count. */
function buildPeerReviewSection(
  groups: OrcidPeerReviewGroup[],
  prevItems: Map<string, CvItem>,
  manual: CvItem[],
): CvSection | null {
  const items: CvItem[] = [];
  let rank = 0;
  for (const g of groups) {
    const id = `peer-review:orcid:${normInstitution(g.organization).replace(/[^a-z0-9]+/g, "-")}`;
    const text = `${g.organization} — ${g.count} review${g.count === 1 ? "" : "s"}`;
    items.push(makeEntryItem(id, "orcid", "peer-review", text, prevItems.get(id), rank++));
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
 * Grants & funding from the user's OWN ORCID funding records (person-attributed),
 * NOT OpenAlex paper-level awards (which are often co-authors'). Manual entries
 * are carried over.
 */
function buildGrantsSection(
  fundings: OrcidFunding[],
  prevItems: Map<string, CvItem>,
  manual: CvItem[],
): CvSection | null {
  const items: CvItem[] = [];
  let rank = 0;
  const sorted = [...fundings].sort((a, b) => (b.startYear ?? 0) - (a.startYear ?? 0));
  for (const f of sorted) {
    const id = `grant:orcid:${f.putCode}`;
    items.push(
      makeEntryItem(id, "orcid", f.putCode, formatFundingText(f), prevItems.get(id), rank++, f.startYear),
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

/** Build the editorial-roles section from OEP data. */
function buildEditorialSection(
  roles: EditorialRole[],
  prevIncluded: Map<string, boolean>,
): CvSection | null {
  if (roles.length === 0) return null;
  const items: CvItem[] = roles.map((r, i) => {
    const id = `editorial:${i}`;
    const years = r.startYear
      ? ` (${r.startYear}–${r.endYear ?? "present"})`
      : "";
    return {
      id,
      source: "oep",
      sourceId: "oep",
      displayText: `${r.role}, ${r.journal}${years}`,
      included: prevIncluded.get(id) ?? true,
      notMine: false,
      order: i,
      authoredBySelf: false,
      selfNameVariants: [],
      meta: {},
    };
  });
  return {
    id: "editorial",
    type: "editorial",
    title: "Editorial Roles",
    visible: true,
    order: 6,
    items,
  };
}

/**
 * A work is a preprint if OpenAlex/Crossref types it so ("preprint" or
 * "posted-content"), or its primary source is a repository. Catches preprints
 * that would otherwise land in Publications.
 */
function isPreprint(work: OpenAlexWork): boolean {
  const type = (work.type ?? "").toLowerCase();
  if (type === "preprint" || type === "posted-content") return true;
  return (work.primary_location?.source?.type ?? "").toLowerCase() === "repository";
}

// OpenAlex `type` values that are NOT peer-reviewed scholarship.
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
  "letter",
]);

/**
 * Heuristic: is this a peer-reviewed output? False for preprints (by type OR
 * repository source — catches preprints that slipped into Publications), for
 * non-scholarly types, and for works with no published venue. Identifier/metadata
 * based; the user can still override per item via hide. Drives the
 * "peer-reviewed only" filter.
 */
function isPeerReviewed(work: OpenAlexWork): boolean {
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
function reviewFlagFor(
  selfAuth: OpenAlexAuthorship | undefined,
  ownerOrcid: string,
): string | undefined {
  if (!selfAuth || !ownerOrcid) return undefined;
  const authOrcid = normalizeOrcid(selfAuth.author?.orcid);
  return authOrcid && authOrcid !== ownerOrcid ? "orcid-conflict" : undefined;
}

/** A human label for the account holder's authorship role on a work, or undefined. */
function authorRoleLabel(a: OpenAlexAuthorship | undefined): string | undefined {
  if (!a) return undefined;
  const parts: string[] = [];
  const pos = (a.author_position ?? "").toLowerCase();
  if (pos === "first") parts.push("first");
  else if (pos === "last") parts.push("last");
  if (a.is_corresponding) parts.push("corresponding");
  return parts.length ? parts.join(", ") : undefined;
}

/** Build the identifier matcher for the account holder. */
function makeSelfMatcher(resolved: ResolvedAuthor) {
  const selfOrcid = normalizeOrcid(resolved.orcid);
  const selfAuthorIds = new Set(resolved.authorIds.map(shortId).filter(Boolean));

  return function matches(a: OpenAlexAuthorship): boolean {
    const aid = shortId(a.author?.id);
    if (aid && selfAuthorIds.has(aid)) return true;
    const ao = normalizeOrcid(a.author?.orcid);
    return !!ao && ao === selfOrcid;
  };
}

/** Self name(s) exactly as printed on this work (from matched authorships). */
function selfNameVariants(
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
  const matches = makeSelfMatcher(resolved);
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
    const selfAuth = (work.authorships ?? []).find(matches);
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
        oaStatus:
          work.open_access?.is_oa && work.open_access.oa_status
            ? work.open_access.oa_status
            : undefined,
        authorRole: authorRoleLabel(selfAuth),
        authorCount: work.authorships?.length,
        peerReviewed: isPeerReviewed(work),
        reviewFlag: authoredBySelf ? reviewFlagFor(selfAuth, ownerOrcid) : undefined,
      },
    };
  });

  // Normalize order to a clean 0..n sequence (respecting any preserved order).
  const ordered = [...items]
    .sort((a, b) => a.order - b.order)
    .map((it, i) => ({ ...it, order: i }));

  const prevIncluded = new Map<string, boolean>();
  for (const [id, it] of prevItems) prevIncluded.set(id, it.included);

  // Split into Publications vs Preprints (so the CV doesn't double-count a
  // preprint and its published version, and matches academic convention).
  const pubItems = reindexItems(ordered.filter((it) => !preprintIds.has(it.id)));
  const preprintItems = reindexItems(ordered.filter((it) => preprintIds.has(it.id)));

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
    [...(args.employments ?? []), ...(args.invitedPositions ?? [])],
    resolved.affiliations ?? [],
    prevItems,
    previousManualItems(previous, "positions"),
  );
  const educationSection = buildOrcidEntrySection(args.education ?? [], {
    id: "education",
    type: "education",
    title: "Education",
    order: 3,
    idPrefix: "education",
    prevItems,
    manual: previousManualItems(previous, "education"),
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
  });
  const serviceSection = buildOrcidEntrySection(args.service ?? [], {
    id: "service",
    type: "service",
    title: "Service & Memberships",
    order: 5,
    idPrefix: "service",
    prevItems,
    manual: previousManualItems(previous, "service"),
  });
  const peerReviewSection = buildPeerReviewSection(
    args.peerReviews ?? [],
    prevItems,
    previousManualItems(previous, "peer-review"),
  );
  const editorialSection = buildEditorialSection(
    args.editorialRoles ?? [],
    prevIncluded,
  );
  const grantsSection = buildGrantsSection(
    args.fundings ?? [],
    prevItems,
    previousManualItems(previous, "grants"),
  );

  const datasetsSection = buildDatasetsSection(
    args.dataciteOutputs ?? [],
    prevItems,
    previousManualItems(previous, "datasets"),
  );

  const builtSections: CvSection[] = [
    publicationsSection,
    preprintsSection,
    datasetsSection ? mergeSection(datasetsSection, previous) : null,
    positionsSection ? mergeSection(positionsSection, previous) : null,
    educationSection ? mergeSection(educationSection, previous) : null,
    awardsSection ? mergeSection(awardsSection, previous) : null,
    serviceSection ? mergeSection(serviceSection, previous) : null,
    peerReviewSection ? mergeSection(peerReviewSection, previous) : null,
    editorialSection ? mergeSection(editorialSection, previous) : null,
    grantsSection ? mergeSection(grantsSection, previous) : null,
  ].filter((s): s is CvSection => s !== null);

  // Localize default section headings to the chosen locale (genuine user
  // renames are left untouched), and snap NEWLY-created sections to the
  // canonical default order. Sections the user already had keep their
  // arrangement (preserved by mergeSection), so re-sync never reshuffles them.
  const locale = (previous?.display ?? DisplayChoicesSchema.parse({})).locale;
  const prevSectionIds = new Set((previous?.sections ?? []).map((s) => s.id));
  const sections: CvSection[] = builtSections.map((s) => {
    const titled = isDefaultSectionTitle(s.type, s.title)
      ? { ...s, title: sectionTitle(locale, s.type) }
      : s;
    return prevSectionIds.has(s.id)
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
    provenance: {
      generatedAt: previous?.provenance.generatedAt ?? now,
      lastSyncedAt: now,
      sources: [...usedSources],
    },
  };

  // Guarantee the output satisfies the load-bearing schema.
  return CanonicalCvSchema.parse(cv);
}
