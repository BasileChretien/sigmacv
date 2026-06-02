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
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
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

/** Aggregate distinct grants across the works into a non-citation section. */
function buildGrantsSection(
  works: OpenAlexWork[],
  prevIncluded: Map<string, boolean>,
): CvSection | null {
  const seen = new Set<string>();
  const items: CvItem[] = [];
  for (const w of works) {
    // OpenAlex `awards` (formerly `grants`): funder + the funder's grant number.
    for (const g of w.awards ?? []) {
      const funder = (g.funder_display_name || "").trim();
      const award = (g.funder_award_id || g.display_name || "").trim();
      if (!funder && !award) continue;
      const key = `${funder}|${award}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const id = `grant:${key.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      items.push({
        id,
        source: "derived",
        sourceId: w.id,
        displayText: award ? `${funder} — ${award}` : funder,
        included: prevIncluded.get(id) ?? true,
        notMine: false,
        order: items.length,
        authoredBySelf: false,
        selfNameVariants: [],
        meta: {},
      });
    }
  }
  if (items.length === 0) return null;
  return {
    id: "grants",
    type: "grants",
    title: "Grants & Funding",
    visible: true,
    order: 2,
    items,
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
    order: 1,
    items,
  };
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
  for (const s of previous?.sections ?? []) {
    for (const it of s.items) prevItems.set(it.id, it);
  }
  // New works are appended AFTER everything the user already curated (newest
  // first, since `works` is recency-sorted) so a re-sync never reshuffles their
  // existing arrangement.
  const prevOrders = [...prevItems.values()].map((it) => it.order);
  const maxPrevOrder = prevOrders.length > 0 ? Math.max(...prevOrders) : -1;
  let newItemRank = 0;

  const items: CvItem[] = works.map((work) => {
    const csl = workToCsl(work);
    const authoredBySelf = (work.authorships ?? []).some(matches);
    const prev = prevItems.get(csl.id);
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
      },
    };
  });

  // Normalize order to a clean 0..n sequence (respecting any preserved order).
  const ordered = [...items]
    .sort((a, b) => a.order - b.order)
    .map((it, i) => ({ ...it, order: i }));

  const prevIncluded = new Map<string, boolean>();
  for (const [id, it] of prevItems) prevIncluded.set(id, it.included);

  const publicationsSection = mergeSection(
    {
      id: PUBLICATIONS_SECTION_ID,
      type: "publications",
      title: "Publications",
      visible: true,
      order: 0,
      items: ordered,
    },
    previous,
  );

  const editorialSection = buildEditorialSection(
    args.editorialRoles ?? [],
    prevIncluded,
  );
  const grantsSection = buildGrantsSection(works, prevIncluded);

  const sections: CvSection[] = [
    publicationsSection,
    editorialSection ? mergeSection(editorialSection, previous) : null,
    grantsSection ? mergeSection(grantsSection, previous) : null,
  ].filter((s): s is CvSection => s !== null);

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
    },
    display,
    sections,
    provenance: {
      generatedAt: previous?.provenance.generatedAt ?? now,
      lastSyncedAt: now,
      sources: ["openalex"],
    },
  };

  // Guarantee the output satisfies the load-bearing schema.
  return CanonicalCvSchema.parse(cv);
}
