import {
  CANONICAL_SCHEMA_VERSION,
  CanonicalCvSchema,
  DisplayChoicesSchema,
  type CanonicalCv,
  type CvItem,
  type CvSection,
} from "./schema";
import { computeDerivedMetrics } from "@/lib/openalex/deriveMetrics";
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
import type { OrcidFunding, OrcidPosition } from "@/lib/orcid/client";
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
    order: 1,
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
    order: 3,
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
    order: 2,
    items,
  };
}

/** A work is a preprint if OpenAlex types it so, or its primary source is a repository. */
function isPreprint(work: OpenAlexWork): boolean {
  if ((work.type ?? "").toLowerCase() === "preprint") return true;
  return (work.primary_location?.source?.type ?? "").toLowerCase() === "repository";
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
    args.employments ?? [],
    resolved.affiliations ?? [],
    prevItems,
    previousManualItems(previous, "positions"),
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

  const sections: CvSection[] = [
    publicationsSection,
    preprintsSection,
    positionsSection ? mergeSection(positionsSection, previous) : null,
    editorialSection ? mergeSection(editorialSection, previous) : null,
    grantsSection ? mergeSection(grantsSection, previous) : null,
  ].filter((s): s is CvSection => s !== null);

  // Provenance reflects the sources that actually contributed (always include
  // openalex, the primary works source).
  const usedSources = new Set<CvItem["source"]>(["openalex"]);
  for (const s of sections) for (const it of s.items) usedSources.add(it.source);

  const display = previous?.display ?? DisplayChoicesSchema.parse({});

  const cv: CanonicalCv = {
    schemaVersion: CANONICAL_SCHEMA_VERSION,
    id,
    owner: {
      orcid: resolved.orcid,
      openAlexAuthorIds: resolved.authorIds,
      displayName: resolved.displayName,
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
