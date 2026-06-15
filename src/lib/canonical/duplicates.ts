import {
  isHidden,
  type CanonicalCv,
  type CvItem,
  type DuplicateRelationship,
  type DuplicateTier,
} from "./schema";

/**
 * Cross-source DUPLICATE DETECTION.
 *
 * SigmaCV aggregates a researcher's outputs from many open sources into one
 * canonical CV. The per-source builders already dedupe within a single feed by
 * an EXACT key (OpenAlex id, DOI, award number, …). What they cannot see is a
 * duplicate that spans sources or identifier boundaries: a bioRxiv preprint and
 * its published article (different DOIs, both shown), two OpenAlex records for
 * one paper, a manually-added work OpenAlex later attributes, the same grant
 * from Crossref and a national funder.
 *
 * This module is a PURE, fail-soft pass over the already-assembled object. It
 * never deletes or hides anything — like {@link CvItem.meta.reviewFlag} it is
 * advisory. It annotates the NON-representative member of each duplicate group
 * with `meta.reviewFlag = "duplicate"` + `meta.duplicateOf` (a pointer to the
 * richer/most-authoritative "representative" item, the tier, and the typed
 * relationship). The editor surfaces a badge; the user decides. The user's
 * decision rides the existing curation (`included` / `notMine` + reason
 * "duplicate") which already survives re-sync — the detector verdict itself is
 * RECOMPUTED every build (never trusted stale), and "not a duplicate"
 * dismissals are persisted separately in `display.dismissedDuplicates`.
 *
 * Tiers (most→least confident): `exact` (a normalized identifier is equal) →
 * `related` (a publisher/registry-asserted relationship, e.g. Crossref
 * is-preprint-of) → `strong` (title + authors + year all agree) → `weak` (title
 * similarity only).
 */

// ─── Normalization helpers (exported for unit testing + reuse) ───────────────

/** "https://doi.org/10.1/abc" / "doi:10.1/abc" → "10.1/abc" (lowercased). arXiv
 *  DOIs collapse their trailing version so v1/v2/v3 of one record compare equal. */
export function normDoi(doi: string | undefined | null): string | undefined {
  if (!doi) return undefined;
  let bare = doi
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .replace(/[.\s]+$/, "");
  // arXiv DOI: 10.48550/arxiv.2401.01234v3 → drop the "v3" so versions collapse.
  bare = bare.replace(/^(10\.48550\/arxiv\.\S+?)v\d+$/i, "$1");
  return bare || undefined;
}

/** Bare PubMed id (digits only, no leading zeros), or undefined. */
export function normPmid(pmid: string | undefined | null): string | undefined {
  if (!pmid) return undefined;
  const digits = pmid.replace(/\D+/g, "").replace(/^0+/, "");
  return digits || undefined;
}

/** A clinical-trial registry number, uppercased + whitespace-stripped. */
export function normTrialId(id: string | undefined | null): string | undefined {
  if (!id) return undefined;
  const k = id.trim().toUpperCase().replace(/\s+/g, "");
  return k || undefined;
}

/**
 * A patent publication number reduced to a comparison key — uppercased, with all
 * separators dropped (e.g. "EP 1 234 567 A1" → "EP1234567A1"). The KIND code is
 * deliberately KEPT, so an application (A1) and the later grant (B1) of one
 * invention stay distinct (a CV may legitimately list both). Undefined when the
 * input is empty or has no alphanumerics.
 */
export function normPatentNumber(n: string | undefined | null): string | undefined {
  if (!n) return undefined;
  const key = n
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return key || undefined;
}

/**
 * A funder award/grant number reduced to a comparison key: uppercased, with all
 * separators dropped (alphanumerics only). Bare award numbers collide across
 * funders ("R01"-shaped schemes are universal), so callers compare award keys
 * only when the funder also matches.
 */
export function normAward(award: string | undefined | null): string | undefined {
  if (!award) return undefined;
  const k = award
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return k || undefined;
}

// Genuine corrections/errata only (they share their target's base title). NOT
// "comment on"/"reply to" — those are distinct works; leaving their prefix in
// the title keeps their normalized base different, so they never mis-match.
const ERRATUM_RE =
  /^(erratum|corrigendum|correction|retraction|retracted|author correction|publisher correction|editorial expression of concern)\s*[:\-–—]+\s*/i;
const TRANSLATION_RE = /\((english|translation|en|fr|de|es|translated)\)\s*$/i;
const PART_RE = /[\s\-–—(]+(part|teil|partie)\s+([ivxlcdm]+|\d+)\)?\s*$/i;
const DATA_PREFIX_RE =
  /^(data from|dataset for|supplement to|supplementary data for)\s*[:\-–—]*\s*/i;

export interface NormalizedTitle {
  /** The comparison key: lowercased, de-diacriticked, punctuation-collapsed. */
  base: string;
  /** A captured "Part I"/"Part 2" marker (lowercased), so parts don't collide. */
  partLabel?: string;
  /** True when the title carried an erratum/correction/comment prefix. */
  isErratum: boolean;
  /** True when the title carried a trailing translation marker. */
  isTranslation: boolean;
}

/** Normalize a title for fuzzy comparison; see {@link NormalizedTitle}. */
export function normTitle(raw: string | undefined | null): NormalizedTitle {
  let s = (raw ?? "").trim();
  const isErratum = ERRATUM_RE.test(s);
  s = s.replace(ERRATUM_RE, "");
  s = s.replace(DATA_PREFIX_RE, "");
  const isTranslation = TRANSLATION_RE.test(s);
  s = s.replace(TRANSLATION_RE, "");
  let partLabel: string | undefined;
  const part = PART_RE.exec(s);
  if (part) {
    partLabel = part[2]!.toLowerCase();
    s = s.replace(PART_RE, "");
  }
  const base = s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
  return { base, partLabel, isErratum, isTranslation };
}

/** Tokenized title overlap (Jaccard over word sets), 0..1. */
export function titleTokenJaccard(a: string, b: string): number {
  const sa = new Set(a.split(" ").filter(Boolean));
  const sb = new Set(b.split(" ").filter(Boolean));
  return jaccard(sa, sb);
}

/** Sørensen–Dice similarity over character 3-grams of two strings, 0..1. */
export function trigramSim(a: string, b: string): number {
  const ga = trigrams(a);
  const gb = trigrams(b);
  if (ga.size === 0 || gb.size === 0) return 0;
  let inter = 0;
  for (const g of ga) if (gb.has(g)) inter++;
  return (2 * inter) / (ga.size + gb.size);
}

function trigrams(s: string): Set<string> {
  const t = s.replace(/\s+/g, " ");
  const out = new Set<string>();
  for (let i = 0; i + 3 <= t.length; i++) out.add(t.slice(i, i + 3));
  return out;
}

function jaccard<T>(a: Set<T>, b: Set<T>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

/** Lowercased, de-diacriticked author surnames from a citation item's CSL
 *  authors. Skips literal/CJK names (no `family`) — they can't discriminate. */
export function surnameSet(item: CvItem): Set<string> {
  const out = new Set<string>();
  for (const a of item.csl?.author ?? []) {
    const fam = typeof a.family === "string" ? a.family : "";
    if (!fam) continue;
    const norm = fam
      .toLowerCase()
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^\p{L}\p{N}]+/gu, "")
      .trim();
    if (norm) out.add(norm);
  }
  return out;
}

// ─── Detection ───────────────────────────────────────────────────────────────

interface FlatItem {
  item: CvItem;
  sectionId: string;
  sectionType: string;
  isPreprint: boolean;
  title: NormalizedTitle;
}

/** What kind of duplicate an edge represents (orientation-free). */
type EdgeKind = "same-work" | "preprint-pair" | "version" | "translation" | "erratum";

interface Edge {
  a: string;
  b: string;
  tier: DuplicateTier;
  kind: EdgeKind;
  score: number;
}

/** A Crossref-asserted relationship between two DOIs (Tier 2 input). */
export interface DoiRelation {
  /** The other DOI (already normalized). */
  target: string;
  kind: "preprint-pair" | "version";
}

export interface DetectOptions {
  /** Pair keys ({@link duplicatePairKey}) the user dismissed ("keep both"). */
  dismissed?: ReadonlySet<string>;
  /** Authoritative DOI→relations map (Crossref `relation`); normalized DOIs. */
  relations?: ReadonlyMap<string, readonly DoiRelation[]>;
}

/** One non-representative member of a duplicate group + its edge to the group. */
export interface DuplicateMember {
  /** The duplicate item's own id. */
  itemId: string;
  /** The representative (richer) item this one duplicates. */
  duplicateOfId: string;
  tier: DuplicateTier;
  relationship?: DuplicateRelationship;
}

/** A set of items judged to be the same work; the representative is the richest. */
export interface DuplicateGroup {
  /** Stable id for the group (the representative's item id). */
  groupId: string;
  /** The item to KEEP (most complete / authoritative). Advisory only. */
  representativeId: string;
  /** The other members, each with the relationship to the representative. */
  duplicates: DuplicateMember[];
  /** The strongest tier present in the group. */
  tier: DuplicateTier;
}

const CITATION_SECTIONS = new Set(["publications", "preprints", "conference"]);

/**
 * The stable anchor used to key a dismissal so it survives re-sync id churn:
 * the normalized DOI if present (stable across OpenAlex id merges), else the
 * PMID, else the item id.
 */
export function itemAnchor(item: CvItem): string {
  return normDoi(item.csl?.DOI ?? item.meta.doi) ?? normPmid(item.meta.pmid) ?? item.id;
}

/** Order-independent key for a pair of items (for `display.dismissedDuplicates`). */
export function duplicatePairKey(a: CvItem, b: CvItem): string {
  return [itemAnchor(a), itemAnchor(b)].sort().join("|");
}

/** Identifier keys an item exposes for EXACT (tier-1) matching, across sources. */
function identifierKeys(f: FlatItem): string[] {
  const { item, sectionType } = f;
  const keys: string[] = [];
  const doi = normDoi(item.csl?.DOI ?? item.meta.doi);
  if (doi) keys.push(`doi:${doi}`);
  const pmid = normPmid(item.meta.pmid);
  if (pmid) keys.push(`pmid:${pmid}`);
  if (sectionType === "clinical-trials") {
    const trial = normTrialId(item.sourceId);
    if (trial) keys.push(`trial:${trial}`);
  }
  if (sectionType === "patents") {
    const pat = normPatentNumber(item.sourceId);
    if (pat) keys.push(`patent:${pat}`);
  }
  if (sectionType === "grants") {
    const award = normAward(item.meta.awardId);
    const funder = item.meta.funderId?.trim().toLowerCase();
    // Funder-scoped: a bare award number collides across funders.
    if (award && funder) keys.push(`award:${funder}:${award}`);
  }
  return keys;
}

function makeEdge(a: string, b: string, tier: DuplicateTier, kind: EdgeKind, score: number): Edge {
  return a < b ? { a, b, tier, kind, score } : { a: b, b: a, tier, kind, score };
}

function yearOf(item: CvItem): number | undefined {
  return typeof item.meta.year === "number" ? item.meta.year : undefined;
}

function yearClose(a: CvItem, b: CvItem): boolean {
  const ya = yearOf(a);
  const yb = yearOf(b);
  if (ya === undefined || yb === undefined) return false;
  return Math.abs(ya - yb) <= 1;
}

function yearCloseOrMissing(a: CvItem, b: CvItem): boolean {
  const ya = yearOf(a);
  const yb = yearOf(b);
  if (ya === undefined || yb === undefined) return true;
  return Math.abs(ya - yb) <= 1;
}

/** Score a fuzzy (tier-3/4) pair of CITATION items, or null if not a candidate. */
function fuzzyEdge(fa: FlatItem, fb: FlatItem): Edge | null {
  const a = fa.item;
  const b = fb.item;
  /* v8 ignore next -- defensive: detect only ever calls this with two citation items */
  if (!a.csl || !b.csl) return null;
  const ta = fa.title;
  const tb = fb.title;
  /* v8 ignore next -- defensive: empty-title citations are skipped before blocking */
  if (!ta.base || !tb.base) return null;
  // Part I vs Part II are distinct works that share a base title.
  if ((ta.partLabel ?? "") !== (tb.partLabel ?? "")) return null;

  const titleEqual = ta.base === tb.base || titleTokenJaccard(ta.base, tb.base) >= 0.9;

  if (titleEqual && yearClose(a, b)) {
    // Erratum / translation pairs are LEGITIMATELY distinct items: surface as a
    // low-confidence "related work" hint, never a removable duplicate.
    if (ta.isErratum !== tb.isErratum) {
      return makeEdge(a.id, b.id, "weak", "erratum", 0.55);
    }
    if (ta.isTranslation !== tb.isTranslation) {
      return makeEdge(a.id, b.id, "weak", "translation", 0.55);
    }
    const sa = surnameSet(a);
    const sb = surnameSet(b);
    const comparable = sa.size > 0 && sb.size > 0;
    const aut = comparable ? jaccard(sa, sb) : 0;
    const preprintPair = fa.isPreprint !== fb.isPreprint;
    // Strong: authors agree, OR a preprint↔published pair (authors may be
    // uncomparable for CJK/single-author works — the preprint→VoR promotion).
    if (aut >= 0.5 || (preprintPair && (!comparable || aut >= 0.34))) {
      const kind: EdgeKind = preprintPair ? "preprint-pair" : "same-work";
      const score = 0.8 + 0.15 * (comparable ? aut : 0.5);
      return makeEdge(a.id, b.id, "strong", kind, score);
    }
    // Title + year agree but authors disagree → weak (possible same-name lab).
    return makeEdge(a.id, b.id, "weak", "same-work", 0.6);
  }

  const tri = trigramSim(ta.base, tb.base);
  if (tri >= 0.85 && yearCloseOrMissing(a, b)) {
    return makeEdge(a.id, b.id, "weak", "same-work", 0.5 + 0.3 * tri);
  }
  return null;
}

const TIER_RANK: Record<DuplicateTier, number> = { exact: 3, related: 2, strong: 1, weak: 0 };

/** Completeness score — the higher, the better the "keep" candidate. Advisory.
 *  (Only visible items reach here — hidden ones are filtered out of detection.) */
function completeness(f: FlatItem): number {
  const it = f.item;
  let s = 0;
  if (it.meta.peerReviewed) s += 3;
  if (it.csl?.DOI ?? it.meta.doi) s += 2;
  if (it.csl?.["container-title"]) s += 1;
  if (it.csl?.volume && it.csl?.page) s += 1;
  if (it.authoredBySelf) s += 1;
  if (typeof it.meta.citedByCount === "number") s += Math.min(it.meta.citedByCount, 1000) * 0.001;
  if (f.isPreprint) s -= 2;
  return s;
}

/** Map an edge kind → the relationship label from the MEMBER's perspective. */
function relationshipFor(kind: EdgeKind, memberIsPreprint: boolean): DuplicateRelationship {
  switch (kind) {
    case "preprint-pair":
      return memberIsPreprint ? "preprint-of" : "published-version-of";
    case "version":
      return "version-of";
    case "translation":
      return "translation-of";
    case "erratum":
      return "erratum-of";
    default:
      return "same-work";
  }
}

/**
 * Detect duplicate GROUPS across every section of the canonical object. Pure +
 * deterministic; no I/O. Returns one group per connected set of ≥2 items.
 */
export function detectDuplicates(cv: CanonicalCv, opts: DetectOptions = {}): DuplicateGroup[] {
  // Stored "keep both" dismissals are honored by default, so every caller
  // (annotate, relation candidates) respects them without extra plumbing.
  const dismissed =
    opts.dismissed ??
    (cv.display.dismissedDuplicates ? new Set(cv.display.dismissedDuplicates) : undefined);
  const flat: FlatItem[] = [];
  for (const s of cv.sections) {
    for (const item of s.items) {
      // A hidden / "not mine" item is already resolved — it's off the CV, so the
      // duplication no longer shows. Skipping it means hiding ONE of a pair
      // makes the flag disappear on the next build (the surviving item is alone),
      // so "keep this one" needs no extra bookkeeping; only "keep both" (both
      // still visible) requires an explicit dismissal.
      if (isHidden(item)) continue;
      flat.push({
        item,
        sectionId: s.id,
        sectionType: s.type,
        isPreprint: s.type === "preprints" || item.meta.peerReviewed === false,
        title: normTitle(item.csl?.title ?? item.displayText),
      });
    }
  }
  const byId = new Map(flat.map((f) => [f.item.id, f]));

  const edges: Edge[] = [];
  const seenPair = new Set<string>();
  const pushEdge = (e: Edge) => {
    const key = `${e.a} ${e.b}`;
    if (seenPair.has(key)) return;
    const fa = byId.get(e.a)!;
    const fb = byId.get(e.b)!;
    if (dismissed?.has(duplicatePairKey(fa.item, fb.item))) return;
    seenPair.add(key);
    edges.push(e);
  };

  // Tier 1 — exact identifier (cross-source, cross-section).
  const idBuckets = new Map<string, FlatItem[]>();
  for (const f of flat) {
    for (const k of identifierKeys(f)) {
      const list = idBuckets.get(k);
      if (list) list.push(f);
      else idBuckets.set(k, [f]);
    }
  }
  for (const list of idBuckets.values()) {
    if (list.length < 2) continue;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        pushEdge(makeEdge(list[i]!.item.id, list[j]!.item.id, "exact", "same-work", 1));
      }
    }
  }

  // Tier 2 — authoritative relationship (Crossref `relation`), matched GLOBALLY
  // by DOI rather than title-blocked: a preprint↔published link routinely
  // survives a journal retitling, so it must NOT depend on title similarity.
  // Pushed BEFORE the fuzzy tier so a publisher-asserted edge wins on a pair the
  // heuristic also catches (pushEdge keeps the first edge per pair).
  const relations = opts.relations;
  if (relations && relations.size > 0) {
    const byDoi = new Map<string, FlatItem>();
    for (const f of flat) {
      const d = normDoi(f.item.csl?.DOI ?? f.item.meta.doi);
      if (d && !byDoi.has(d)) byDoi.set(d, f);
    }
    for (const f of flat) {
      const da = normDoi(f.item.csl?.DOI ?? f.item.meta.doi);
      if (!da) continue;
      for (const rel of relations.get(da) ?? []) {
        const other = byDoi.get(rel.target);
        if (other && other.item.id !== f.item.id) {
          pushEdge(makeEdge(f.item.id, other.item.id, "related", rel.kind, 0.95));
        }
      }
    }
  }

  // Tier 3/4 — heuristic fuzzy, restricted to CITATION items and blocked by a
  // coarse title prefix so this stays well under O(n²) for a real CV.
  const citations = flat.filter((f) => f.item.csl && CITATION_SECTIONS.has(f.sectionType));
  const titleBuckets = new Map<string, FlatItem[]>();
  for (const f of citations) {
    if (!f.title.base) continue;
    const key = f.title.base.slice(0, 12);
    const list = titleBuckets.get(key);
    if (list) list.push(f);
    else titleBuckets.set(key, [f]);
  }
  for (const list of titleBuckets.values()) {
    if (list.length < 2) continue;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const fuzzy = fuzzyEdge(list[i]!, list[j]!);
        if (fuzzy) pushEdge(fuzzy);
      }
    }
  }

  return groupEdges(edges, byId);
}

/** Union-find over edges → groups; pick a representative + member relationships. */
function groupEdges(edges: Edge[], byId: Map<string, FlatItem>): DuplicateGroup[] {
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    let r = x;
    while (parent.get(r) !== undefined && parent.get(r) !== r) r = parent.get(r)!;
    // Path-compress.
    let c = x;
    while (parent.get(c) !== undefined && parent.get(c) !== c) {
      const next = parent.get(c)!;
      parent.set(c, r);
      c = next;
    }
    return r;
  };
  const union = (a: string, b: string) => {
    parent.set(a, parent.get(a) ?? a);
    parent.set(b, parent.get(b) ?? b);
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };
  for (const e of edges) union(e.a, e.b);

  // Bucket member ids + their incident edges by component root.
  const comps = new Map<string, Set<string>>();
  const incident = new Map<string, Edge[]>();
  for (const e of edges) {
    const root = find(e.a);
    const set = comps.get(root) ?? new Set<string>();
    set.add(e.a);
    set.add(e.b);
    comps.set(root, set);
    (incident.get(e.a) ?? incident.set(e.a, []).get(e.a)!).push(e);
    (incident.get(e.b) ?? incident.set(e.b, []).get(e.b)!).push(e);
  }

  const groups: DuplicateGroup[] = [];
  for (const ids of comps.values()) {
    const members = [...ids].map((id) => byId.get(id)!).filter(Boolean);
    /* v8 ignore next -- defensive: a graph component always has ≥2 nodes */
    if (members.length < 2) continue;
    // Representative = most complete; ties broken by id for determinism. Score
    // once per member (completeness does float work; calling it inside a
    // comparator twice per member is wasteful and unsound if it ever drifts).
    const scored = members.map((m) => ({ m, score: completeness(m) }));
    const rep = scored.reduce((best, cur) =>
      cur.score > best.score || (cur.score === best.score && cur.m.item.id < best.m.item.id)
        ? cur
        : best,
    ).m;
    const repId = rep.item.id;
    let groupTier: DuplicateTier = "weak";
    const duplicates: DuplicateMember[] = [];
    for (const m of members) {
      if (m.item.id === repId) continue;
      const incidentEdges = incident.get(m.item.id) ?? [];
      // Group tier = the strongest edge anywhere in the component.
      for (const e of incidentEdges) {
        if (TIER_RANK[e.tier] > TIER_RANK[groupTier]) groupTier = e.tier;
      }
      // Describe the relationship via the edge to the REPRESENTATIVE (so a 3-way
      // group labels each member by its link to the kept item, not to a sibling);
      // fall back to the strongest incident edge when there's no direct one.
      const toRep = incidentEdges.filter((e) => e.a === repId || e.b === repId);
      const pick = [...(toRep.length ? toRep : incidentEdges)].sort((x, y) => y.score - x.score)[0];
      /* v8 ignore next -- defensive: a component member always has an incident edge */
      if (!pick) continue;
      duplicates.push({
        itemId: m.item.id,
        duplicateOfId: repId,
        tier: pick.tier,
        relationship: relationshipFor(pick.kind, m.isPreprint),
      });
    }
    /* v8 ignore next -- defensive: a ≥2-member component yields ≥1 duplicate */
    if (duplicates.length === 0) continue;
    groups.push({ groupId: repId, representativeId: repId, duplicates, tier: groupTier });
  }
  return groups;
}

// ─── Annotation (pure, fail-soft) ────────────────────────────────────────────

/**
 * Annotate the canonical object's items with duplicate hints, in place of any
 * prior hints (idempotent — always recomputed). Pure + immutable + FAIL-SOFT:
 * any error returns the input unchanged so detection can never break a build.
 *
 * Non-representative members get `meta.reviewFlag = "duplicate"` (only when they
 * carry no other review flag — an orcid-conflict/name-matched flag is not
 * overwritten) plus `meta.duplicateOf`. Every other item has any stale duplicate
 * hint cleared.
 */
export function annotateDuplicates(cv: CanonicalCv, opts: DetectOptions = {}): CanonicalCv {
  try {
    const groups = detectDuplicates(cv, opts);

    // Build memberId → its annotation from the groups.
    const ann = new Map<
      string,
      { itemId: string; tier: DuplicateTier; relationship?: DuplicateRelationship; groupId: string }
    >();
    for (const g of groups) {
      for (const m of g.duplicates) {
        ann.set(m.itemId, {
          itemId: m.duplicateOfId,
          tier: m.tier,
          relationship: m.relationship,
          groupId: g.groupId,
        });
      }
    }

    let changed = false;
    const sections = cv.sections.map((s) => {
      let sectionChanged = false;
      const items = s.items.map((it) => {
        const target = ann.get(it.id);
        // Annotate ONLY when the slot is free: an item already flagged for another
        // reason (orcid-conflict / name-matched / orcid-doi) keeps that flag and is
        // NOT given a hidden duplicate hint the badge would never surface.
        const slotFree = it.meta.reviewFlag === undefined || it.meta.reviewFlag === "duplicate";
        if (target && slotFree) {
          sectionChanged = true;
          return {
            ...it,
            meta: {
              ...it.meta,
              reviewFlag: "duplicate" as const,
              duplicateOf: {
                itemId: target.itemId,
                tier: target.tier,
                relationship: target.relationship,
                groupId: target.groupId,
              },
            },
          };
        }
        // Not annotating (no duplicate, or another flag owns the slot): clear any
        // stale duplicate hint so the recomputed-every-build invariant holds.
        const hadHint = it.meta.reviewFlag === "duplicate" || it.meta.duplicateOf !== undefined;
        if (!hadHint) return it;
        sectionChanged = true;
        const { duplicateOf: _drop, ...metaRest } = it.meta;
        return {
          ...it,
          meta: {
            ...metaRest,
            reviewFlag: it.meta.reviewFlag === "duplicate" ? undefined : it.meta.reviewFlag,
          },
        };
      });
      if (!sectionChanged) return s;
      changed = true;
      return { ...s, items };
    });

    return changed ? { ...cv, sections } : cv;
  } catch {
    // Fail-soft: detection must never break a build/sync.
    return cv;
  }
}

/**
 * For each still-pending ORCID-discovered review candidate
 * (`reviewFlag === "orcid-doi"`, hidden and not marked "not mine"), the display
 * title of the first item ALREADY ON the CV (a shown item) that looks like the
 * same work — a shared DOI/PMID, or a closely matching title. These candidates
 * are exactly the ones another source (Crossref gap-fill, a manual entry, DBLP)
 * may already cover, so this lets the editor warn "you may already have this"
 * before the user clicks Show. Pure + advisory; compares only against SHOWN
 * items (a hidden entry isn't "present" on the CV). Returns an empty map when
 * there is nothing to flag.
 */
export function similarVisibleForOrcidCandidates(cv: CanonicalCv): Map<string, string> {
  const out = new Map<string, string>();
  try {
    // Index the shown items by identifier + normalized title (built once).
    const doiTitles = new Map<string, string>();
    const pmidTitles = new Map<string, string>();
    const titled: Array<{ base: string; title: string }> = [];
    const titleOf = (it: CvItem): string =>
      (typeof it.csl?.title === "string" ? it.csl.title : undefined) ?? it.displayText ?? "";
    for (const s of cv.sections) {
      for (const it of s.items) {
        if (isHidden(it)) continue;
        const title = titleOf(it);
        const doi = normDoi(it.csl?.DOI ?? it.meta.doi);
        if (doi && !doiTitles.has(doi)) doiTitles.set(doi, title);
        const pmid = normPmid(it.meta.pmid);
        if (pmid && !pmidTitles.has(pmid)) pmidTitles.set(pmid, title);
        const base = normTitle(title).base;
        if (base) titled.push({ base, title });
      }
    }

    for (const s of cv.sections) {
      for (const it of s.items) {
        if (it.meta.reviewFlag !== "orcid-doi" || it.included || it.notMine) continue;
        const doi = normDoi(it.csl?.DOI ?? it.meta.doi);
        const byDoi = doi ? doiTitles.get(doi) : undefined;
        if (byDoi !== undefined) {
          out.set(it.id, byDoi);
          continue;
        }
        const pmid = normPmid(it.meta.pmid);
        const byPmid = pmid ? pmidTitles.get(pmid) : undefined;
        if (byPmid !== undefined) {
          out.set(it.id, byPmid);
          continue;
        }
        const base = normTitle(titleOf(it)).base;
        if (!base) continue;
        const match = titled.find(
          (v) =>
            v.base === base ||
            titleTokenJaccard(base, v.base) >= 0.9 ||
            trigramSim(base, v.base) >= 0.85,
        );
        if (match) out.set(it.id, match.title);
      }
    }
    return out;
    /* v8 ignore next 4 -- fail-soft: a malformed item must never break the editor */
  } catch {
    // Advisory only — never let a malformed item break the editor.
    return out;
  }
}

/**
 * DOIs worth a Crossref `relation` lookup, bounded by `limit`. Two sources:
 *  (a) members of any fuzzy (strong/weak) group — title-similar but not yet
 *      identifier-linked pairs the publisher might confirm or refute; and
 *  (b) EVERY preprint with a DOI — a preprint's Crossref record asserts its
 *      published version even when the journal RETITLED the work (the common
 *      different-title preprint↔VoR case the title heuristic alone misses).
 * Pure. The matching relation edges are then formed globally by DOI in
 * {@link detectDuplicates}, independent of title blocking.
 */
export function relationCandidateDois(cv: CanonicalCv, limit = 60): string[] {
  const byId = new Map<string, CvItem>();
  for (const s of cv.sections) for (const it of s.items) byId.set(it.id, it);
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (doi: string | undefined): boolean => {
    if (!doi || seen.has(doi)) return false;
    seen.add(doi);
    out.push(doi);
    return out.length >= limit;
  };

  for (const g of detectDuplicates(cv)) {
    if (g.tier === "exact" || g.tier === "related") continue;
    const ids = [g.representativeId, ...g.duplicates.map((d) => d.itemId)];
    for (const id of ids) {
      const it = byId.get(id);
      if (add(normDoi(it?.csl?.DOI ?? it?.meta.doi))) return out;
    }
  }
  for (const s of cv.sections) {
    if (s.type !== "preprints") continue;
    for (const it of s.items) {
      if (isHidden(it)) continue; // a hidden preprint is already resolved — don't spend a lookup on it
      if (add(normDoi(it.csl?.DOI ?? it.meta.doi))) return out;
    }
  }
  return out;
}
