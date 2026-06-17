import {
  CANONICAL_SCHEMA_VERSION,
  CanonicalCvSchema,
  DEFAULT_SECTION_ORDER,
  DisplayChoicesSchema,
  isHidden,
  type CanonicalCv,
  type CvItem,
  type CvSection,
  type ReviewFlag,
} from "./schema";
import { annotateDuplicates } from "./duplicates";
import { annotateMisattribution } from "./misattribution";
import { formatEntryLine, rederiveEntryLine } from "./entryLine";
import { computeDerivedMetrics, workTopDecile } from "@/lib/openalex/deriveMetrics";
import { isDefaultSectionTitle, sectionTitle } from "@/lib/i18n";
import { toCslName, workToCsl } from "@/lib/openalex/toCsl";
import type { CslItem } from "@/types/csl";
import {
  normalizeOrcid,
  shortId,
  type OpenAlexAuthorship,
  type OpenAlexWork,
} from "@/lib/openalex/types";
import type { ResolvedAffiliation, ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OrcidFunding, OrcidPeerReviewGroup, OrcidPosition } from "@/lib/orcid/client";
import type { DataciteOutput } from "@/lib/datacite/client";
import type { EditorialRole } from "@/lib/oep/client";
import type { OpenaireOutput } from "@/lib/openaire/client";
import type { DblpConferencePaper } from "@/lib/dblp/client";
import type { CrossrefGrant } from "@/lib/crossref/client";
import type { FunderGrant } from "@/lib/grants/match";
import type { ExternalTrial } from "@/lib/trials/types";
import type { PatentRecord } from "@/lib/patents/types";

const PUBLICATIONS_SECTION_ID = "publications";

export interface BuildArgs {
  /** Stable canonical id — use the Cv DB row id. */
  id: string;
  resolved: ResolvedAuthor;
  works: OpenAlexWork[];
  /**
   * Works the user lists in ORCID that OpenAlex did NOT attribute to their author
   * profile (resolved back through OpenAlex by DOI — see cv/orcidDiscovery). Added
   * to Publications/Preprints as REVIEW CANDIDATES: hidden by default with
   * `meta.reviewFlag = "orcid-doi"`, never auto-included. Superseded automatically
   * once OpenAlex attributes the work (it then arrives in `works`).
   */
  orcidDiscoveredWorks?: OpenAlexWork[];
  /**
   * ORCID self-asserted work TYPE per DOI (bare-lowercased DOI → ORCID work-type
   * string, e.g. "journal-article" / "conference-poster" / "data-set"). ORCID's
   * controlled vocabulary is richer than OpenAlex's venue heuristics, so — matched
   * by DOI only — it REFINES section placement on top of `isPreprint(work)`:
   * publication types are rescued into Publications even when venue-less, preprint
   * types stay in Preprints, and non-publication outputs (posters, talks, datasets,
   * software) are pulled out of Preprints into an "Other Research Outputs" section.
   * A DOI absent from this map (or an unknown/empty type) leaves the existing
   * OpenAlex-only routing unchanged. Optional + fail-soft (empty = no override).
   */
  orcidWorkTypes?: Record<string, string>;
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
  /** OpenAIRE datasets & software (ORCID-matched; merged into Datasets, dedup by DOI). */
  openaireOutputs?: OpenaireOutput[];
  /** DBLP conference papers (ORCID-matched; the Conference Presentations section). */
  dblpConferencePapers?: DblpConferencePaper[];
  /** Crossref Grant Linking System grants (ORCID-matched; merged into Grants). */
  crossrefGrants?: CrossrefGrant[];
  /**
   * National funder grants (UKRI/NIH/NSF), matched by NAME + organization (no
   * ORCID). Surfaced in Grants as REVIEW CANDIDATES — hidden by default with a
   * "name-matched" review flag, never auto-included.
   */
  nationalGrants?: FunderGrant[];
  /**
   * Clinical trials where the account holder is an investigator, matched by NAME
   * + organization (no ORCID). The Clinical Trials section — REVIEW CANDIDATES,
   * hidden by default with a "name-matched" review flag, never auto-included.
   */
  clinicalTrials?: ExternalTrial[];
  /**
   * Patents where the account holder is an inventor (EPO OPS), matched by NAME +
   * applicant organization. The Patents section — REVIEW CANDIDATES, hidden by
   * default with a "name-matched" review flag, never auto-included.
   */
  patents?: PatentRecord[];
}

/** "https://doi.org/<bare>" for a DOI in any form. */
function doiUrl(doi: string): string {
  return `https://doi.org/${doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")}`;
}

/** "<title>. <publisher> (<year>) [<type>]. <doi-url>" for a DataCite output. The
 *  DOI is shown verbatim and linkified in HTML (see render/html.ts `withDoiLink`). */
function formatDatasetText(o: DataciteOutput): string {
  const head = o.publisher ? `${o.title}. ${o.publisher}` : o.title;
  const yr = o.year ? ` (${o.year})` : "";
  return `${head}${yr} [${o.type}]. ${doiUrl(o.doi)}`;
}

/** "<title>. <publisher> (<year>) [<type>]. <doi-url>" for an OpenAIRE output
 *  (the DOI is omitted when the product has none). */
function formatOpenaireText(o: OpenaireOutput): string {
  const head = o.publisher ? `${o.title}. ${o.publisher}` : o.title;
  const yr = o.year ? ` (${o.year})` : "";
  const doi = o.doi ? `. ${doiUrl(o.doi)}` : "";
  return `${head}${yr} [${o.type}]${doi}`;
}

/**
 * Collapse Zenodo concept↔version sibling DataCite records to one entry per
 * deposit. Zenodo mints a concept DOI plus a per-version DOI; each version
 * references the concept (IsVersionOf) and the concept self-references, so records
 * whose DOI sets connect are the same deposit — listing every version would clutter
 * the CV. We keep the concept DOI (stable, resolves to the latest version), else the
 * newest. Single-pass grouping suffices because every version carries the concept
 * DOI, so all siblings share it.
 */
function collapseDataciteVersions(outputs: DataciteOutput[]): DataciteOutput[] {
  const groups: { dois: Set<string>; members: DataciteOutput[] }[] = [];
  for (const o of outputs) {
    const ids = [o.doi.toLowerCase(), ...(o.relatedDois ?? []).map((d) => d.toLowerCase())];
    const g = groups.find((grp) => ids.some((d) => grp.dois.has(d)));
    if (g) {
      ids.forEach((d) => g.dois.add(d));
      g.members.push(o);
    } else {
      groups.push({ dois: new Set(ids), members: [o] });
    }
  }
  return groups.map(({ members }) => {
    if (members.length === 1) return members[0]!;
    // The concept DOI is the one the siblings point to — its own DOI is referenced
    // most across the group; tie-break on the newest year.
    const refs = new Map<string, number>();
    for (const m of members)
      for (const r of m.relatedDois ?? [])
        refs.set(r.toLowerCase(), (refs.get(r.toLowerCase()) ?? 0) + 1);
    return members.reduce((best, m) => {
      const s = refs.get(m.doi.toLowerCase()) ?? 0;
      const bs = refs.get(best.doi.toLowerCase()) ?? 0;
      if (s > bs) return m;
      if (s === bs && (m.year ?? 0) > (best.year ?? 0)) return m;
      return best;
    });
  });
}

/**
 * Datasets & Software section. DataCite is the primary source; OpenAIRE
 * SUPPLEMENTS it (both ORCID-matched, so auto-included), with anything DataCite
 * already lists deduplicated by DOI. Manual entries are carried over.
 */
function buildDatasetsSection(
  outputs: DataciteOutput[],
  openaireOutputs: OpenaireOutput[],
  prevItems: Map<string, CvItem>,
  manual: CvItem[],
  now: string,
): CvSection | null {
  const items: CvItem[] = [];
  let rank = 0;
  // DOIs DataCite covers — own + Zenodo concept↔version siblings — so an OpenAIRE
  // record for ANY sibling is suppressed below (no cross-source duplicate).
  const seenDois = new Set<string>();
  for (const o of outputs) {
    seenDois.add(o.doi.toLowerCase());
    for (const r of o.relatedDois ?? []) seenDois.add(r.toLowerCase());
  }
  // One entry per deposit (concept DOI), not every version.
  const sorted = collapseDataciteVersions(outputs).sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
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
  const oaSorted = [...openaireOutputs].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  for (const o of oaSorted) {
    if (o.doi && seenDois.has(o.doi.toLowerCase())) continue; // DataCite already has it
    const id = `dataset:openaire:${o.openaireId.replace(/[^a-z0-9]+/gi, "-")}`;
    const it = makeEntryItem(
      id,
      "openaire",
      o.openaireId,
      formatOpenaireText(o),
      prevItems.get(id),
      rank++,
      o.year,
      { lastVerifiedAt: now },
    );
    items.push(o.doi ? { ...it, meta: { ...it.meta, doi: o.doi } } : it);
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

/** "<title>. <venue> (<year>)" for a DBLP conference paper. */
function formatConferenceText(p: DblpConferencePaper): string {
  const head = p.venue ? `${p.title}. ${p.venue}` : p.title;
  const yr = p.year ? ` (${p.year})` : "";
  return `${head}${yr}`;
}

/**
 * Conference Presentations from DBLP (resolved ORCID→PID, so ORCID-matched and
 * auto-included). Manual entries are carried over.
 */
function buildConferenceSection(
  papers: DblpConferencePaper[],
  prevItems: Map<string, CvItem>,
  manual: CvItem[],
  now: string,
): CvSection | null {
  const items: CvItem[] = [];
  let rank = 0;
  const sorted = [...papers].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  for (const p of sorted) {
    const id = `conference:dblp:${p.key.replace(/[^a-z0-9]+/gi, "-")}`;
    const it = makeEntryItem(
      id,
      "dblp",
      p.key,
      formatConferenceText(p),
      prevItems.get(id),
      rank++,
      p.year,
      { lastVerifiedAt: now },
    );
    items.push(p.doi ? { ...it, meta: { ...it.meta, doi: p.doi } } : it);
  }
  for (const m of manual) {
    items.push({ ...m, order: prevItems.get(m.id)?.order ?? rank++ });
  }
  if (items.length === 0) return null;
  return {
    id: "conference",
    type: "conference",
    title: "Conference Presentations",
    visible: true,
    order: DEFAULT_SECTION_ORDER.conference,
    items: reindexItems(items),
  };
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
 * Whether a previous publication/preprint item is USER-OWNED state that the fresh
 * OpenAlex pull won't reproduce and so must be carried across a re-sync:
 *  - manual structured entries (`source === "manual"`);
 *  - DOI-claimed works (`meta.claimed`);
 *  - ORCID-discovered review candidates (`meta.reviewFlag === "orcid-doi"`) —
 *    persisted so a transient ORCID/OpenAlex hiccup never drops a candidate the
 *    user already reviewed/confirmed (they are re-discovered only when genuinely
 *    new; see cv/orcidDiscovery). This DELIBERATELY includes ones marked
 *    "not mine": dropping a rejected candidate would let the discovery diff (which
 *    excludes only DOIs already in the CV) re-surface it as a fresh candidate and
 *    lose the disambiguation signal — so we keep it (hidden) to honour
 *    "not mine hides, never deletes". Bounded by the user's finite ORCID record.
 */
function isCarriableUserItem(it: CvItem): boolean {
  return it.source === "manual" || it.meta.claimed === true || it.meta.reviewFlag === "orcid-doi";
}

/**
 * User-owned publication/preprint items the fresh pull didn't return (see
 * {@link isCarriableUserItem}). They must survive a re-sync: `mergeSection` only
 * preserves a section's chrome (title/visibility/order), not items, so without
 * this they would silently vanish. De-duped against the freshly-fetched set by id
 * AND DOI, so once OpenAlex finally attributes a claimed/discovered work, the
 * properly-attributed fetched copy supersedes it.
 */
function carryOverUserItems(
  fetched: CvItem[],
  previous: CanonicalCv | null | undefined,
  sectionType: CvSection["type"],
  fetchedIds: Set<string>,
  fetchedDois: Set<string>,
): CvItem[] {
  const prevSection = previous?.sections.find((s) => s.type === sectionType);
  if (!prevSection) return fetched;
  // Supersede a carried entry when OpenAlex now returns the same work in ANY
  // fetched section (by id OR DOI) — not just this one — so a claimed/discovered
  // preprint that becomes a published article isn't listed in both.
  const carried = prevSection.items.filter(
    (it) =>
      isCarriableUserItem(it) &&
      !fetchedIds.has(it.id) &&
      !(it.csl?.DOI && fetchedDois.has(it.csl.DOI.toLowerCase())),
  );
  return carried.length ? [...fetched, ...carried] : fetched;
}

/** Normalize a list to a clean 0..n order, preserving relative order. */
function reindexItems(items: CvItem[]): CvItem[] {
  return [...items].sort((a, b) => a.order - b.order).map((it, i) => ({ ...it, order: i }));
}

/** Bare-lowercased DOIs of a built section's items (csl.DOI or meta.doi). Used to
 *  avoid double-listing an ORCID "other-output" work whose DOI is already a
 *  Dataset (DataCite/OpenAIRE) or Conference (DBLP) item this sync. */
function sectionDois(section: CvSection | null): Set<string> {
  const out = new Set<string>();
  for (const it of section?.items ?? []) {
    const doi = it.csl?.DOI ?? it.meta.doi;
    if (doi) out.add(doi.toLowerCase());
  }
  return out;
}

/** Every DOI (bare-lowercased) that identifies a dataset/software deposit already
 *  surfaced in the Datasets & Software section — each DataCite output's own DOI
 *  PLUS its Zenodo concept↔version siblings, and each OpenAIRE output's DOI. The
 *  OpenAlex-indexed copy of such a deposit (which often carries the sibling DOI,
 *  Zenodo minting both a concept and per-version DOI) is then dropped from the
 *  works rather than mis-filed in Preprints or double-listed. */
function collectDatasetDepositDois(
  datacite: DataciteOutput[],
  openaire: OpenaireOutput[],
): Set<string> {
  const out = new Set<string>();
  for (const o of datacite) {
    if (o.doi) out.add(o.doi.toLowerCase());
    for (const r of o.relatedDois ?? []) out.add(r.toLowerCase());
  }
  for (const o of openaire) {
    if (o.doi) out.add(o.doi.toLowerCase());
  }
  return out;
}

/** Apply a section's preserved title/visibility/order from the previous CV. */
function mergeSection(built: CvSection, previous: CanonicalCv | null | undefined): CvSection {
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
    institution?: string;
    institutionNames?: Record<string, string>;
    institutionUrl?: string;
    lastVerifiedAt?: string;
    funderId?: string;
    funderName?: string;
    awardId?: string;
    /** Source role/title + department + date range for positions/education entries. */
    roleTitle?: string;
    department?: string;
    startYear?: number;
    endYear?: number;
  },
): CvItem {
  const meta: CvItem["meta"] = {};
  if (year) meta.year = year;
  if (extraMeta?.rorId) meta.rorId = extraMeta.rorId;
  if (extraMeta?.institution) meta.institution = extraMeta.institution;
  if (extraMeta?.institutionNames) meta.institutionNames = extraMeta.institutionNames;
  if (extraMeta?.institutionUrl) meta.institutionUrl = extraMeta.institutionUrl;
  if (extraMeta?.lastVerifiedAt) meta.lastVerifiedAt = extraMeta.lastVerifiedAt;
  if (extraMeta?.funderId) meta.funderId = extraMeta.funderId;
  if (extraMeta?.funderName) meta.funderName = extraMeta.funderName;
  if (extraMeta?.awardId) meta.awardId = extraMeta.awardId;
  if (extraMeta?.roleTitle) meta.roleTitle = extraMeta.roleTitle;
  if (extraMeta?.department) meta.department = extraMeta.department;
  // `!= null` (not truthiness) so a structured year is stored faithfully — the
  // line re-derive in `curate.ts` reads these back and must agree with the build.
  if (extraMeta?.startYear != null) meta.startYear = extraMeta.startYear;
  if (extraMeta?.endYear != null) meta.endYear = extraMeta.endYear;
  // A user edit of the role / institution / dates (positions/education) survives
  // re-sync, exactly like `displayTextOverride` — while the source values above
  // keep refreshing underneath, so "revert to source" stays meaningful.
  if (prev?.meta.roleTitleOverride) meta.roleTitleOverride = prev.meta.roleTitleOverride;
  if (prev?.meta.departmentOverride) meta.departmentOverride = prev.meta.departmentOverride;
  if (prev?.meta.institutionOverride) meta.institutionOverride = prev.meta.institutionOverride;
  if (prev?.meta.dateRangeOverride) meta.dateRangeOverride = prev.meta.dateRangeOverride;
  return {
    id,
    source,
    sourceId,
    displayText,
    // A user edit of the line (positions/education) is preserved across re-sync,
    // exactly like `included`/`order` — while `displayText` above keeps refreshing
    // from the live source underneath, so "revert to source" stays meaningful.
    displayTextOverride: prev?.displayTextOverride,
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

/**
 * The Positions / Education line for an ORCID entry, from the SOURCE values. The
 * builders re-derive it through {@link rederiveEntryLine} so any carried-over
 * role / institution / date override is applied; this is the no-override form.
 */
function formatPositionText(p: OrcidPosition): string {
  return formatEntryLine({
    roleTitle: p.roleTitle,
    department: p.department,
    institution: p.organization,
    startYear: p.startYear,
    endYear: p.endYear,
  });
}

/** Re-derive an entry's line from its effective meta (applying carried
 *  role/institution/date overrides); falls back to the built line when the item
 *  has no institution (so non-entry items pass through untouched). */
function withDerivedLine(item: CvItem): CvItem {
  const line = rederiveEntryLine(item);
  return line === undefined ? item : { ...item, displayText: line };
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
    (a, b) => positionRecency(b.startYear, b.endYear) - positionRecency(a.startYear, a.endYear),
  );
  for (const e of sortedEmp) {
    seen.add(normInstitution(e.organization));
    const id = `position:orcid:${e.putCode}`;
    // The line is re-derived from the item's effective meta (role / institution /
    // date overrides), so the source `formatPositionText(e)` is just the no-override
    // form; `withDerivedLine` applies whatever the user has carried over.
    items.push(
      withDerivedLine(
        makeEntryItem(
          id,
          "orcid",
          e.putCode,
          formatPositionText(e),
          prevItems.get(id),
          rank++,
          e.startYear,
          {
            rorId: e.rorId,
            institution: e.organization,
            institutionNames: e.institutionNames,
            institutionUrl: e.institutionUrl,
            roleTitle: e.roleTitle,
            department: e.department,
            startYear: e.startYear,
            endYear: e.endYear,
            lastVerifiedAt: now,
          },
        ),
      ),
    );
  }
  for (const a of affiliations) {
    if (seen.has(normInstitution(a.institution))) continue;
    seen.add(normInstitution(a.institution));
    const id = `position:openalex:${normInstitution(a.institution).replace(/[^a-z0-9]+/g, "-")}`;
    // OpenAlex affiliations carry no job title; `withDerivedLine` honours a role /
    // institution / dates the user typed in (carried overrides), else the line is
    // just institution + years.
    const prev = prevItems.get(id);
    const text = formatEntryLine({
      institution: a.institution,
      startYear: a.startYear,
      endYear: a.endYear,
    });
    // OpenAlex affiliations are inferred from papers and are NOISY (they include
    // co-authors' institutions / spurious years). They default to HIDDEN, but we
    // respect a user who explicitly un-hid one (prev.included === true) so the
    // choice survives re-sync. New ones start hidden.
    const item = withDerivedLine(
      makeEntryItem(id, "openalex", "openalex", text, prev, rank++, a.startYear, {
        rorId: a.rorId,
        institution: a.institution,
        institutionNames: a.institutionNames,
        institutionUrl: a.institutionUrl,
        startYear: a.startYear,
        endYear: a.endYear,
        lastVerifiedAt: now,
      }),
    );
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
    (a, b) => positionRecency(b.startYear, b.endYear) - positionRecency(a.startYear, a.endYear),
  );
  for (const e of sorted) {
    const id = `${opts.idPrefix}:orcid:${e.putCode}`;
    const prev = opts.prevItems.get(id);
    if (opts.singleYear) {
      // Awards are points-in-time (the "role" IS the award name) — formatted as-is,
      // no structured role/dates and no line re-derive.
      items.push(
        makeEntryItem(id, "orcid", e.putCode, formatAwardText(e), prev, rank++, e.startYear, {
          rorId: e.rorId,
          institution: e.organization,
          institutionNames: e.institutionNames,
          institutionUrl: e.institutionUrl,
          lastVerifiedAt: opts.now,
        }),
      );
    } else {
      // Range entries (education/talks/service) carry structured, editable
      // role / institution / dates; their line is re-derived from effective meta.
      items.push(
        withDerivedLine(
          makeEntryItem(id, "orcid", e.putCode, formatPositionText(e), prev, rank++, e.startYear, {
            rorId: e.rorId,
            institution: e.organization,
            institutionNames: e.institutionNames,
            institutionUrl: e.institutionUrl,
            roleTitle: e.roleTitle,
            department: e.department,
            startYear: e.startYear,
            endYear: e.endYear,
            lastVerifiedAt: opts.now,
          }),
        ),
      );
    }
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
  const seenIds = new Map<string, number>();
  for (const g of groups) {
    const label = g.journal ?? g.organization;
    // Stable id keyed by ISSN when available, else the label.
    const key = g.issn ?? normInstitution(label);
    let id = `peer-review:orcid:${key.replace(/[^a-z0-9]+/g, "-")}`;
    // Disambiguate two ISSN-less venues that normalize to the same label, so the
    // second's curation isn't lost to an id collision with the first.
    const dupe = seenIds.get(id) ?? 0;
    seenIds.set(id, dupe + 1);
    if (dupe > 0) id = `${id}-${dupe}`;
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
 * Index OpenAlex paper-level `awards[]` by award number (lower-cased) so a
 * person-attributed ORCID funding lacking a disambiguated identifier can borrow
 * the matching OpenAlex funder id/name. OpenAlex awards are NOT a standalone
 * source (they're often co-authors' funding) — only used to attach identifiers
 * to a grant the user already asserted via ORCID.
 */
export function indexFundersByAward(
  works: OpenAlexWork[],
): Map<string, { funderId?: string; funderName?: string }> {
  const out = new Map<string, { funderId?: string; funderName?: string }>();
  for (const w of works) {
    for (const a of w.awards ?? []) {
      const award = a.funder_award_id?.trim().toLowerCase();
      if (!award || out.has(award)) continue;
      out.set(award, {
        funderId: a.funder_id ?? undefined,
        funderName: a.funder_display_name ?? undefined,
      });
    }
  }
  return out;
}

/**
 * Resolve the interoperable funder identifiers for one ORCID funding record.
 * ORCID's own disambiguated-organization id + org name + award number are
 * authoritative; an OpenAlex `awards[]` match (by award number) fills only the
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
 * OpenAlex `awards[]` (matched by award number) filling a missing funder id only.
 * Manual entries are carried over.
 */
/** "<title>, <funder> (<years>)" for a Crossref Grant Linking System grant. */
function formatCrossrefGrantText(g: CrossrefGrant): string {
  const label = g.funderName ? `${g.title}, ${g.funderName}` : g.title;
  const yrs = grantYears(g.startYear, g.endYear);
  return yrs ? `${label} ${yrs}` : label;
}

/** "<title>, <funder> (<years>)" for a national-funder (UKRI/NIH/NSF) grant. */
function formatFunderGrantText(g: FunderGrant): string {
  const label = g.funder ? `${g.title}, ${g.funder}` : g.title;
  const yrs = grantYears(g.startYear, g.endYear);
  return yrs ? `${label} ${yrs}` : label;
}

/**
 * Grants & Funding. Three signals merge here:
 *  - ORCID funding records (person-attributed) — the primary, auto-included set;
 *  - Crossref Grant Linking System grants (ORCID-matched) — auto-included,
 *    deduped against an ORCID funding the user already has (by award number);
 *  - national funder grants (UKRI/NIH/NSF), matched by NAME + organization — added
 *    as REVIEW CANDIDATES (hidden by default, `meta.reviewFlag = "name-matched"`),
 *    never auto-included because there is no identifier match.
 * Manual entries are carried over.
 */
function buildGrantsSection(
  fundings: OrcidFunding[],
  crossrefGrants: CrossrefGrant[],
  nationalGrants: FunderGrant[],
  prevItems: Map<string, CvItem>,
  manual: CvItem[],
  now: string,
  fundersByAward: Map<string, { funderId?: string; funderName?: string }>,
): CvSection | null {
  const items: CvItem[] = [];
  let rank = 0;
  const seenAwards = new Set<string>();
  const sorted = [...fundings].sort((a, b) => (b.startYear ?? 0) - (a.startYear ?? 0));
  for (const f of sorted) {
    if (f.awardId) seenAwards.add(f.awardId.trim().toLowerCase());
    const id = `grant:orcid:${f.putCode}`;
    const funder = resolveFunderIds(f, fundersByAward);
    items.push(
      makeEntryItem(
        id,
        "orcid",
        f.putCode,
        formatFundingText(f),
        prevItems.get(id),
        rank++,
        f.startYear,
        {
          lastVerifiedAt: now,
          funderId: funder.funderId,
          funderName: funder.funderName,
          awardId: funder.awardId,
        },
      ),
    );
  }
  const crSorted = [...crossrefGrants].sort((a, b) => (b.startYear ?? 0) - (a.startYear ?? 0));
  for (const g of crSorted) {
    if (g.award && seenAwards.has(g.award.trim().toLowerCase())) continue; // ORCID already has it
    const id = `grant:crossref:${g.doi.replace(/[^a-z0-9]+/gi, "-")}`;
    items.push(
      makeEntryItem(
        id,
        "crossref",
        g.doi,
        formatCrossrefGrantText(g),
        prevItems.get(id),
        rank++,
        g.startYear,
        {
          lastVerifiedAt: now,
          funderId: g.funderId,
          funderName: g.funderName,
          awardId: g.award,
        },
      ),
    );
  }
  const natSorted = [...nationalGrants].sort((a, b) => (b.startYear ?? 0) - (a.startYear ?? 0));
  for (const g of natSorted) {
    const id = `grant:${g.source}:${g.externalId.replace(/[^a-z0-9]+/gi, "-")}`;
    const prev = prevItems.get(id);
    const it = makeEntryItem(
      id,
      g.source,
      g.externalId,
      formatFunderGrantText(g),
      prev,
      rank++,
      g.startYear,
      {
        lastVerifiedAt: now,
        funderName: g.funder,
        awardId: g.externalId,
      },
    );
    // NAME+org match → review candidate: hidden by default, flagged for review.
    items.push({
      ...it,
      included: prev?.included ?? false,
      meta: { ...it.meta, reviewFlag: "name-matched" },
    });
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
    const years = r.startYear ? ` (${r.startYear}–${r.endYear ?? "present"})` : "";
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

/** "<title>, <sponsor> [<registryId>] <phase> (<years>)" for a clinical trial. */
function formatTrialText(t: ExternalTrial): string {
  const label = t.sponsor ? `${t.title}, ${t.sponsor}` : t.title;
  const tail = [t.phase, grantYears(t.startYear, t.endYear)].filter(Boolean).join(" ");
  return `${label} [${t.registryId}]${tail ? ` ${tail}` : ""}`;
}

/**
 * Clinical Trials where the account holder is an investigator. Registry-sourced
 * (ClinicalTrials.gov) and matched by NAME + organization — so every entry is a
 * REVIEW CANDIDATE: hidden by default with `meta.reviewFlag = "name-matched"`,
 * never auto-included. Manual entries are carried over.
 */
function buildClinicalTrialsSection(
  trials: ExternalTrial[],
  prevItems: Map<string, CvItem>,
  manual: CvItem[],
  now: string,
): CvSection | null {
  const items: CvItem[] = [];
  let rank = 0;
  const sorted = [...trials].sort((a, b) => (b.startYear ?? 0) - (a.startYear ?? 0));
  for (const t of sorted) {
    const id = `trial:${t.source}:${t.registryId.replace(/[^a-z0-9]+/gi, "-")}`;
    const prev = prevItems.get(id);
    // ExternalTrial.source ("clinicaltrials" | "ctis") IS the canonical item source.
    const it = makeEntryItem(
      id,
      t.source,
      t.registryId,
      formatTrialText(t),
      prev,
      rank++,
      t.startYear,
      { lastVerifiedAt: now },
    );
    items.push({
      ...it,
      included: prev?.included ?? false,
      meta: { ...it.meta, reviewFlag: "name-matched", type: t.phase },
    });
  }
  for (const m of manual) {
    items.push({ ...m, order: prevItems.get(m.id)?.order ?? rank++ });
  }
  if (items.length === 0) return null;
  return {
    id: "clinical-trials",
    type: "clinical-trials",
    title: "Clinical Trials",
    visible: true,
    order: DEFAULT_SECTION_ORDER["clinical-trials"],
    items: reindexItems(items),
  };
}

/** "<title>, <applicant> (<year>) [<publicationNumber>]" for a patent. */
function formatPatentText(p: PatentRecord): string {
  const label = p.applicants[0] ? `${p.title}, ${p.applicants[0]}` : p.title;
  const yr = p.year ? ` (${p.year})` : "";
  return `${label}${yr} [${p.publicationNumber}]`;
}

/**
 * Patents where the account holder is an inventor (EPO OPS). Matched by NAME +
 * applicant organization — so every entry is a REVIEW CANDIDATE: hidden by
 * default with `meta.reviewFlag = "name-matched"`, never auto-included. Manual
 * entries are carried over.
 */
function buildPatentsSection(
  patents: PatentRecord[],
  prevItems: Map<string, CvItem>,
  manual: CvItem[],
  now: string,
): CvSection | null {
  const items: CvItem[] = [];
  let rank = 0;
  const sorted = [...patents].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  for (const p of sorted) {
    const id = `patent:epo:${p.publicationNumber.replace(/[^a-z0-9]+/gi, "-")}`;
    const prev = prevItems.get(id);
    const it = makeEntryItem(
      id,
      "epo",
      p.publicationNumber,
      formatPatentText(p),
      prev,
      rank++,
      p.year,
      { lastVerifiedAt: now },
    );
    items.push({
      ...it,
      included: prev?.included ?? false,
      meta: { ...it.meta, reviewFlag: "name-matched" },
    });
  }
  for (const m of manual) {
    items.push({ ...m, order: prevItems.get(m.id)?.order ?? rank++ });
  }
  if (items.length === 0) return null;
  return {
    id: "patents",
    type: "patents",
    title: "Patents",
    visible: true,
    order: DEFAULT_SECTION_ORDER.patents,
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

// ── ORCID work-type → CV-section routing ────────────────────────────────────
// ORCID's self-asserted, controlled work-type vocabulary, partitioned into the
// three CV destinations. A type NOT in any set yields no signal (undefined →
// fall back to the OpenAlex-only `isPreprint` routing). See {@link orcidTypeClass}.

/** ORCID types that are bona-fide PUBLICATIONS — rescued into the Publications
 *  section even when OpenAlex finds no venue (`conference-paper` included). */
const ORCID_PUBLICATION_TYPES = new Set([
  "journal-article",
  "conference-paper",
  "book",
  "book-chapter",
  "edited-book",
  "dissertation-thesis",
  "report",
  "magazine-article",
  "newspaper-article",
  "dictionary-entry",
  "encyclopedia-entry",
  "translation",
  "manual",
  "newsletter-article",
]);

/** ORCID types that ARE preprints / unpublished working papers (→ Preprints). */
const ORCID_PREPRINT_TYPES = new Set(["preprint", "working-paper"]);

/** ORCID types that are DATASETS or SOFTWARE — routed to the Datasets & Software
 *  section (alongside DataCite/OpenAIRE), not Other Research Outputs. */
const ORCID_DATASET_TYPES = new Set([
  "data-set",
  "software",
  "research-tool",
  "data-management-plan",
  "physical-object",
]);

/** ORCID types that are other NON-publication research outputs — pulled out of
 *  Preprints into the "Other Research Outputs" section (posters, abstracts,
 *  talks/teaching, standards, websites, …). Datasets/software go to Datasets &
 *  Software instead (see {@link ORCID_DATASET_TYPES}). */
const ORCID_OTHER_OUTPUT_TYPES = new Set([
  "conference-poster",
  "conference-abstract",
  "lecture-speech",
  "other",
  "online-resource",
  "website",
  "annotation",
  "research-technique",
  "standards-and-policy",
  "technical-standard",
  "registered-copyright",
]);

/**
 * The CV-routing class for an ORCID self-asserted work `type` (matched by DOI in
 * the build), or `undefined` when ORCID carries no usable signal (no entry /
 * empty / a type outside the three known sets) — in which case the existing
 * OpenAlex-only `isPreprint` routing stands. `conference-paper` is a
 * `"publication"`; `conference-poster`/`conference-abstract` are `"other-output"`.
 *  - "publication"  → Publications (overrides `isPreprint`, e.g. a venue-less work);
 *  - "preprint"     → Preprints;
 *  - "other-output" → Other Research Outputs (unless its DOI is already a Dataset
 *                     or Conference item this sync — then the work is dropped).
 */
export function orcidTypeClass(
  orcidType: string | undefined,
): "publication" | "preprint" | "dataset" | "other-output" | undefined {
  const t = orcidType?.trim().toLowerCase();
  if (!t) return undefined;
  if (ORCID_PUBLICATION_TYPES.has(t)) return "publication";
  if (ORCID_PREPRINT_TYPES.has(t)) return "preprint";
  if (ORCID_DATASET_TYPES.has(t)) return "dataset";
  if (ORCID_OTHER_OUTPUT_TYPES.has(t)) return "other-output";
  return undefined;
}

/**
 * The CV-routing class for an OpenAlex work, or `undefined` when it carries no
 * non-article signal (→ the OpenAlex-only `isPreprint` routing stands). Consulted
 * in the no-ORCID-signal fallback so a non-article output leaves Preprints. Signals:
 *  - `type` is `dataset` → `"dataset"` (Datasets & Software). OpenAlex has no
 *    "software" type, so software (e.g. a CRAN package) also arrives typed `dataset`.
 *  - `type` is `supplementary-materials`, OR the catch-all `other` on a `repository`
 *    source (a Zenodo deposit OpenAlex couldn't type) → `"other-output"` (Other
 *    Research Outputs). Gated on the repository source so venue-bearing `other`
 *    miscellany stays put, and never matches arXiv/bioRxiv preprints (typed `preprint`).
 * An ORCID type, when present, still takes precedence over this (see {@link routeWork}).
 */
export function openalexTypeClass(work: OpenAlexWork): "dataset" | "other-output" | undefined {
  const t = (work.type ?? "").trim().toLowerCase();
  if (t === "dataset") return "dataset";
  if (t === "supplementary-materials") return "other-output";
  const isRepository = (work.primary_location?.source?.type ?? "").toLowerCase() === "repository";
  if (t === "other" && isRepository) return "other-output";
  return undefined;
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
): ReviewFlag | undefined {
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
  return work.primary_location?.license ?? work.best_oa_location?.license ?? undefined;
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

/**
 * The work's primary topic reduced to FIELD + DOMAIN display names, or undefined
 * when OpenAlex carries neither (older/unclassified works). Stored on the item for
 * the misattribution heuristic's cross-domain check; never invented.
 */
export function workTopic(work: OpenAlexWork): { field?: string; domain?: string } | undefined {
  const field = work.primary_topic?.field?.display_name?.trim() || undefined;
  const domain = work.primary_topic?.domain?.display_name?.trim() || undefined;
  return field || domain ? { field, domain } : undefined;
}

/**
 * ROR ids of the institutions on the account holder's OWN authorship of a work
 * (their affiliation as printed on this paper). Identifier-only — institutions
 * without a ROR contribute nothing; deduped + bounded. Drives the misattribution
 * affiliation check; never name-derived. Undefined when none carry a ROR.
 */
export function selfWorkInstitutions(
  selfAuth: OpenAlexAuthorship | undefined,
): string[] | undefined {
  const rors = (selfAuth?.institutions ?? [])
    .map((i) => i.ror?.trim())
    .filter((r): r is string => !!r);
  return rors.length ? [...new Set(rors)].slice(0, 50) : undefined;
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

/**
 * Upper bound on co-author ORCIDs stored per work. Bounds the document size on
 * hyper-authorship papers (consortia with hundreds/thousands of authors); the
 * chance a co-author past this cap is a SigmaCV user when none before it are is
 * negligible. Kept ≤ the schema's `.max(300)` so a build never fails validation.
 */
const MAX_COAUTHOR_ORCIDS = 256;

/**
 * Bare ORCID iDs of a work's co-authors — the account holder's own ORCID
 * excluded — deduped, in author order, capped. Identifier-only (an authorship
 * with no ORCID contributes nothing); never name-derived. Drives the public
 * JSON-LD `knows` graph; see {@link CvItem.meta.coauthorOrcids}.
 */
export function collectCoauthorOrcids(work: OpenAlexWork, ownerOrcid: string): string[] {
  const out = new Set<string>();
  for (const a of work.authorships ?? []) {
    const orcid = normalizeOrcid(a.author?.orcid);
    if (!orcid || orcid === ownerOrcid) continue;
    out.add(orcid);
    if (out.size >= MAX_COAUTHOR_ORCIDS) break;
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

interface WorkItemOptions {
  /** Pre-computed CSL (callers already need `csl.id`/`csl.DOI`). */
  csl: CslItem;
  /** Prior curation for this work (preserves included / "not mine" / order). */
  prev?: CvItem;
  /** Order to assign when there is no prior curation. */
  order: number;
  /** `included` when there is no prior curation (review candidates start hidden). */
  defaultIncluded: boolean;
  /**
   * Forced `meta.reviewFlag` (review candidates). When omitted the orcid-conflict
   * heuristic applies (an own work whose authorship lists a different ORCID).
   */
  reviewFlagOverride?: ReviewFlag;
  /**
   * Forced `meta.peerReviewed`, used when ORCID's work type reclassifies where a
   * work lands: `true` for a publication-type rescue (journal-article /
   * conference-paper), `false` for an "Other Research Outputs" item. Omitted
   * (undefined) keeps the source heuristic `isPeerReviewed(work)`.
   */
  peerReviewedOverride?: boolean;
}

/**
 * Build a publication/preprint CvItem from one OpenAlex work. The metadata —
 * year, citations, FWCI, author position, peer-reviewed status — is entirely
 * source-driven (un-paddable). Shared by the primary author-id pull and the
 * ORCID-discovered review candidates so the two can never drift apart.
 */
function buildWorkCvItem(
  work: OpenAlexWork,
  matcher: ReturnType<typeof makeSelfMatcher>,
  ownerOrcid: string,
  now: string,
  opts: WorkItemOptions,
): CvItem {
  const { matches, basisFor } = matcher;
  const { csl, prev, order, defaultIncluded, reviewFlagOverride, peerReviewedOverride } = opts;
  const selfIndex = (work.authorships ?? []).findIndex(matches);
  const selfAuth = selfIndex >= 0 ? work.authorships![selfIndex] : undefined;
  const authoredBySelf = Boolean(selfAuth);
  const coauthors = collectCoauthorOrcids(work, ownerOrcid);
  return {
    id: csl.id,
    source: "openalex",
    sourceId: work.id,
    csl,
    // Keep the user's earlier display + disambiguation decisions on re-sync, so a
    // re-pull never resurfaces a hidden or asserted-not-mine work.
    included: prev?.included ?? defaultIncluded,
    notMine: prev?.notMine ?? false,
    notMineAssertedAt: prev?.notMineAssertedAt,
    notMineReason: prev?.notMineReason,
    order: prev ? prev.order : order,
    authoredBySelf,
    selfNameVariants: authoredBySelf ? selfNameVariants(work, matches) : [],
    meta: {
      year: work.publication_year ?? undefined,
      type: work.type ?? undefined,
      doi: csl.DOI,
      citedByCount: work.cited_by_count,
      // Per-work field-normalized data, stored so the FWCI mean + top-10% share
      // recompute over the CURATED works (excluding "not mine"/hidden).
      fwci: typeof work.fwci === "number" ? work.fwci : undefined,
      topDecile: workTopDecile(work),
      oaStatus:
        work.open_access?.is_oa && work.open_access.oa_status
          ? work.open_access.oa_status
          : undefined,
      // OA determination (open/closed/unknown) for the honest OA-share denominator.
      oaIsOpen: typeof work.open_access?.is_oa === "boolean" ? work.open_access.is_oa : undefined,
      // Reuse license + PubMed id (FAIR / open-science surfacing).
      license: workLicense(work),
      pmid: workPmid(work),
      // Per-item freshness: this work came from a live OpenAlex fetch.
      lastVerifiedAt: now,
      authorRole: authorRoleLabel(selfAuth),
      authorCount: work.authorships?.length,
      // 1-based position of the account holder among the authors (authorship
      // table) + corresponding flag.
      authorPosition: authoredBySelf ? selfIndex + 1 : undefined,
      isCorresponding: selfAuth?.is_corresponding === true ? true : undefined,
      // Co-author ORCIDs (identifier-only) for the public JSON-LD `knows` graph;
      // omitted when none of the co-authors carry an ORCID.
      coauthorOrcids: coauthors.length ? coauthors : undefined,
      // Which identifier made the self-match (ORCID > OpenAlex id). Recorded so
      // the disambiguation-error study can stratify errors by match strength.
      matchBasis: selfAuth ? (basisFor(selfAuth) ?? undefined) : undefined,
      peerReviewed: peerReviewedOverride ?? isPeerReviewed(work),
      // Primary research field/domain — denormalized for the misattribution
      // heuristic (cross-domain check); see annotateMisattribution.
      topic: workTopic(work),
      // ROR ids of the user's affiliation on THIS paper — for the misattribution
      // affiliation check; only set for own works that carry a ROR'd institution.
      workInstitutions: authoredBySelf ? selfWorkInstitutions(selfAuth) : undefined,
      reviewFlag:
        reviewFlagOverride ?? (authoredBySelf ? reviewFlagFor(selfAuth, ownerOrcid) : undefined),
    },
  };
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
      if (doi) {
        const key = doi.toLowerCase();
        const existing = prevByDoi.get(key);
        // When the same DOI appears in two prior sections, keep the entry with
        // the stronger curation signal (hidden / "not mine") so the DOI-index
        // fallback can never silently drop a hide/disambiguation decision.
        if (!existing || (isHidden(it) && !isHidden(existing))) prevByDoi.set(key, it);
      }
    }
  }
  // New works are appended AFTER everything the user already curated (newest
  // first, since `works` is recency-sorted) so a re-sync never reshuffles their
  // existing arrangement.
  const prevOrders = [...prevItems.values()].map((it) => it.order);
  const maxPrevOrder = prevOrders.length > 0 ? Math.max(...prevOrders) : -1;
  let newItemRank = 0;

  const matcher = { matches, basisFor };
  const orcidWorkTypes = args.orcidWorkTypes ?? {};
  /** ORCID-asserted routing class for a work, matched by DOI (bare, lower-cased)
   *  — or undefined when ORCID carries no usable signal for it. */
  const orcidClassFor = (csl: CslItem) =>
    csl.DOI ? orcidTypeClass(orcidWorkTypes[csl.DOI.toLowerCase()]) : undefined;
  // Per-item routing buckets (by csl.id). `preprintIds` keeps existing behaviour
  // (OpenAlex `isPreprint` heuristic) as the FALLBACK; the ORCID class, when
  // present, overrides it: a publication is rescued out of Preprints, a preprint
  // stays, and a non-publication output is pulled into "Other Research Outputs".
  const preprintIds = new Set<string>();
  const otherOutputIds = new Set<string>();
  const datasetWorkIds = new Set<string>();
  /** Route one work item by ORCID class (over OpenAlex's `isPreprint`) and return
   *  the matching `peerReviewedOverride` to pass to {@link buildWorkCvItem}. */
  const routeWork = (work: OpenAlexWork, csl: CslItem): { peerReviewedOverride?: boolean } => {
    const cls = orcidClassFor(csl);
    if (cls === "publication") {
      // journal-article / conference-paper are peer-reviewed; other publication
      // types keep the source heuristic (book chapters, reports, theses, …).
      const t = orcidWorkTypes[csl.DOI!.toLowerCase()];
      const peer = t === "journal-article" || t === "conference-paper" ? true : undefined;
      return { peerReviewedOverride: peer };
    }
    if (cls === "preprint") {
      preprintIds.add(csl.id);
      return {};
    }
    if (cls === "dataset") {
      datasetWorkIds.add(csl.id);
      return { peerReviewedOverride: false };
    }
    if (cls === "other-output") {
      otherOutputIds.add(csl.id);
      return { peerReviewedOverride: false };
    }
    // No ORCID signal → OpenAlex's own `type` still routes a non-article output:
    // a `dataset` (incl. software, e.g. a CRAN package) into Datasets & Software,
    // a repository `other` / supplementary materials into Other Research Outputs;
    // otherwise the `isPreprint` heuristic decides the split.
    const oaCls = openalexTypeClass(work);
    if (oaCls === "dataset") {
      datasetWorkIds.add(csl.id);
      return { peerReviewedOverride: false };
    }
    if (oaCls === "other-output") {
      otherOutputIds.add(csl.id);
      return { peerReviewedOverride: false };
    }
    if (isPreprint(work)) preprintIds.add(csl.id);
    return {};
  };
  const items: CvItem[] = works.map((work) => {
    const csl = workToCsl(work);
    const { peerReviewedOverride } = routeWork(work, csl);
    // Match by id, else by DOI (id churn) to preserve hide / "not mine" decisions.
    // When the prior item was an ORCID-discovered candidate, its curation
    // (incl. an un-confirmed hidden state) is preserved like any other — a re-sync
    // never resurfaces a hidden work. Its "orcid-doi" review flag is naturally
    // dropped here (recomputed for a now-attributed work).
    const prev =
      prevItems.get(csl.id) ?? (csl.DOI ? prevByDoi.get(csl.DOI.toLowerCase()) : undefined);
    return buildWorkCvItem(work, matcher, ownerOrcid, now, {
      csl,
      prev,
      order: maxPrevOrder + 1 + newItemRank++,
      defaultIncluded: true,
      peerReviewedOverride,
    });
  });

  // The OpenAlex-attributed set fetched THIS sync (by id + DOI). Used to supersede
  // carried claim/manual/discovered items, and to drop a discovered candidate the
  // primary pull already returned.
  const fetchedIds = new Set(items.map((it) => it.id));
  const fetchedDois = new Set(
    items.map((it) => it.csl?.DOI?.toLowerCase()).filter((d): d is string => Boolean(d)),
  );

  // ORCID-discovered review candidates: works the user lists in ORCID that the
  // author-id pull missed (resolved back via OpenAlex by DOI). Added hidden, with
  // a "orcid-doi" review flag. Skip any the primary pull already returned
  // (attributed → it wins) or that the CV already has (carried over below, so
  // never built twice). Identifiers/metadata only — never a name-string match.
  const discovered: CvItem[] = [];
  const seenDiscoveredDois = new Set<string>();
  for (const work of dedupeWorks(args.orcidDiscoveredWorks ?? [])) {
    const csl = workToCsl(work);
    const doiKey = csl.DOI?.toLowerCase();
    if (fetchedIds.has(csl.id) || (doiKey && fetchedDois.has(doiKey))) continue;
    if (prevItems.has(csl.id) || (doiKey && prevByDoi.has(doiKey))) continue;
    // Two discovered works can share a DOI (OpenAlex duplicate records); keep one.
    if (doiKey && seenDiscoveredDois.has(doiKey)) continue;
    if (doiKey) seenDiscoveredDois.add(doiKey);
    // Route by ORCID class exactly like the primary pull. The candidate STAYS a
    // hidden review candidate (`defaultIncluded:false`, `orcid-doi` flag) whatever
    // section it lands in — routing only changes its bucket, never its state.
    const { peerReviewedOverride } = routeWork(work, csl);
    discovered.push(
      buildWorkCvItem(work, matcher, ownerOrcid, now, {
        csl,
        order: maxPrevOrder + 1 + newItemRank++,
        defaultIncluded: false,
        reviewFlagOverride: "orcid-doi",
        peerReviewedOverride,
      }),
    );
  }

  // Normalize order to a clean 0..n sequence (respecting any preserved order).
  const ordered = [...items, ...discovered]
    .sort((a, b) => a.order - b.order)
    .map((it, i) => ({ ...it, order: i }));

  // Build the Datasets (DataCite/OpenAIRE) + Conference (DBLP) sections FIRST, so
  // their item DOIs are known before the works split: an ORCID "other-output"
  // work whose DOI is already one of these is DROPPED rather than double-listed
  // in "Other Research Outputs".
  // DataCite/OpenAIRE entry items for Datasets & Software. Manual items are NOT
  // pulled in here ([] below): the final `datasets` section (assembled after the
  // works split) merges these entries with OpenAlex-identified dataset/software
  // works, and carryOverUserItems handles manual/claimed carry-over once for the
  // combined section.
  const datasetEntrySection = buildDatasetsSection(
    args.dataciteOutputs ?? [],
    args.openaireOutputs ?? [],
    prevItems,
    [],
    now,
  );
  const conferenceSection = buildConferenceSection(
    args.dblpConferencePapers ?? [],
    prevItems,
    previousManualItems(previous, "conference"),
    now,
  );
  const datasetConferenceDois = new Set<string>([
    ...sectionDois(datasetEntrySection),
    ...sectionDois(conferenceSection),
  ]);

  // The OpenAlex-indexed copy of a Zenodo/DataCite deposit already surfaced in the
  // Datasets & Software section is a duplicate (it would otherwise mis-file in
  // Preprints because Zenodo is a `repository`). Drop it from the works entirely —
  // matched on the deposit's own DOI OR a concept↔version sibling, so the copy is
  // recognised whichever Zenodo DOI it carries. Falls through untouched when
  // DataCite hasn't indexed the deposit yet (then `openalexTypeClass` still keeps a
  // dataset/software work out of Preprints, in Other Research Outputs).
  const datasetDepositDois = collectDatasetDepositDois(
    args.dataciteOutputs ?? [],
    args.openaireOutputs ?? [],
  );
  const orderedDeduped = ordered.filter((it) => {
    const doi = it.csl?.DOI?.toLowerCase();
    return !(doi && datasetDepositDois.has(doi));
  });

  // Route every work into exactly ONE of Publications / Preprints / Other
  // Research Outputs. The default split is OpenAlex's `isPreprint` heuristic;
  // ORCID's work type (captured in `preprintIds`/`otherOutputIds` above) overrides
  // it. An "other-output" work already produced as a Dataset/Conference item this
  // sync is dropped (not double-listed). carryOverUserItems uses the fetched
  // id+DOI sets so a carried claim/manual/discovered item is superseded when
  // OpenAlex now returns the same work in EITHER section.
  const isOtherOutput = (it: CvItem): boolean => {
    if (!otherOutputIds.has(it.id)) return false;
    const doi = it.csl?.DOI?.toLowerCase();
    return !(doi && datasetConferenceDois.has(doi)); // drop ones already listed
  };
  const pubItems = reindexItems(
    carryOverUserItems(
      orderedDeduped.filter(
        (it) => !preprintIds.has(it.id) && !otherOutputIds.has(it.id) && !datasetWorkIds.has(it.id),
      ),
      previous,
      "publications",
      fetchedIds,
      fetchedDois,
    ),
  );
  const preprintItems = reindexItems(
    carryOverUserItems(
      orderedDeduped.filter((it) => preprintIds.has(it.id)),
      previous,
      "preprints",
      fetchedIds,
      fetchedDois,
    ),
  );
  const otherItems = reindexItems(
    carryOverUserItems(
      orderedDeduped.filter(isOtherOutput),
      previous,
      "other",
      fetchedIds,
      fetchedDois,
    ),
  );

  // Datasets & Software: DataCite/OpenAIRE entry items + OpenAlex-identified
  // dataset/software WORKS (CSL items — e.g. a CRAN package OpenAlex types
  // `dataset`, which DataCite never has). The renderer dispatches per item
  // (`item.csl` → citeproc, else the entry line), so a mixed section renders
  // correctly. A work already surfaced as a DataCite/OpenAIRE deposit was dropped
  // from `orderedDeduped` above (by DOI), so entries and works never double-list.
  const datasetWorkItems = orderedDeduped.filter((it) => datasetWorkIds.has(it.id));
  const datasetItems = reindexItems(
    carryOverUserItems(
      [...(datasetEntrySection?.items ?? []), ...datasetWorkItems].map((it, i) => ({
        ...it,
        order: i,
      })),
      previous,
      "datasets",
      fetchedIds,
      fetchedDois,
    ),
  );
  const datasetsSection: CvSection | null =
    datasetItems.length > 0
      ? mergeSection(
          {
            id: "datasets",
            type: "datasets",
            title: "Datasets & Software",
            visible: true,
            order: DEFAULT_SECTION_ORDER.datasets,
            items: datasetItems,
          },
          previous,
        )
      : null;

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

  // "Other Research Outputs": ORCID-typed non-publication outputs (posters,
  // talks/teaching, datasets, software, …) that would otherwise mis-file as
  // preprints. A work-item section (CSL) like Publications/Preprints, so it
  // renders consistently. Only built when non-empty. The title is the en-US
  // DEFAULT for `other` ("Other") so the post-build localization pass
  // (isDefaultSectionTitle → sectionTitle) re-localizes the heading per locale
  // (fr "Autres", ja "その他", …) — a fixed "Other Research Outputs" string would
  // be treated as a user rename and stay English on a non-English CV.
  const otherOutputsSection: CvSection | null =
    otherItems.length > 0
      ? mergeSection(
          {
            id: "other",
            type: "other",
            title: sectionTitle("en-US", "other"),
            visible: true,
            order: DEFAULT_SECTION_ORDER.other,
            items: otherItems,
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
    args.crossrefGrants ?? [],
    args.nationalGrants ?? [],
    prevItems,
    previousManualItems(previous, "grants"),
    now,
    indexFundersByAward(works),
  );

  // (the conference section + the DataCite/OpenAIRE dataset entries are built
  // before the works split so their DOIs can suppress double-listed works; the
  // final `datasetsSection` is assembled just above, after the split.)
  const clinicalTrialsSection = buildClinicalTrialsSection(
    args.clinicalTrials ?? [],
    prevItems,
    previousManualItems(previous, "clinical-trials"),
    now,
  );
  const patentsSection = buildPatentsSection(
    args.patents ?? [],
    prevItems,
    previousManualItems(previous, "patents"),
    now,
  );

  const builtSections: CvSection[] = [
    publicationsSection,
    preprintsSection,
    otherOutputsSection,
    conferenceSection ? mergeSection(conferenceSection, previous) : null,
    datasetsSection,
    positionsSection ? mergeSection(positionsSection, previous) : null,
    educationSection ? mergeSection(educationSection, previous) : null,
    awardsSection ? mergeSection(awardsSection, previous) : null,
    talksSection ? mergeSection(talksSection, previous) : null,
    serviceSection ? mergeSection(serviceSection, previous) : null,
    peerReviewSection ? mergeSection(peerReviewSection, previous) : null,
    editorialSection ? mergeSection(editorialSection, previous) : null,
    grantsSection ? mergeSection(grantsSection, previous) : null,
    clinicalTrialsSection ? mergeSection(clinicalTrialsSection, previous) : null,
    patentsSection ? mergeSection(patentsSection, previous) : null,
  ].filter((s): s is CvSection => s !== null);

  // Carry over any PREVIOUS section that the source-driven build doesn't produce
  // — user-added manual-only sections (skills / languages / references / teaching
  // / supervision / other) and PROSE sections (the narrative contributions +
  // statements, which are user-authored and never sourced). Without this they'd
  // silently vanish on every re-sync. Matched by id so a built section never
  // duplicates its carried-over twin; appended after the built sections.
  const builtIds = new Set(builtSections.map((s) => s.id));
  const carriedSections: CvSection[] = [];
  for (const s of previous?.sections ?? []) {
    if (builtIds.has(s.id)) continue;
    // Drop any carried item this sync already produced elsewhere (by id or DOI):
    // a claimed/manual entry OpenAlex now attributes moves into a built section,
    // so the stale copy here (e.g. a claimed preprint that became published,
    // leaving the built Preprints section empty) must not be resurrected.
    const keptItems = s.items.filter(
      (it) => !fetchedIds.has(it.id) && !(it.csl?.DOI && fetchedDois.has(it.csl.DOI.toLowerCase())),
    );
    // Only drop the section when FILTERING emptied a once-populated source
    // section; originally-empty prose/user sections (a statement's body) stay.
    if (keptItems.length === 0 && s.items.length > 0) continue;
    carriedSections.push({ ...s, items: keptItems });
  }
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

  // Cross-source duplicate detection: a PURE, fail-soft pass over the fully
  // assembled object (sees every section, unlike the per-source dedupers). It
  // annotates likely-duplicate items with an advisory hint and never hides
  // anything. Identifier + heuristic tiers run here (no I/O); the Crossref
  // `relation` tier is layered on in cv/sync via annotateDuplicates(relations).
  const annotated = annotateDuplicates(cv);

  // Misattribution detection: a PURE, fail-soft pass flagging OpenAlex-author-id-only
  // matches that disagree with the rest of the identifier-confirmed profile (a probable
  // same-name over-merge). Runs AFTER duplicates so a stronger flag (duplicate /
  // orcid-conflict) always keeps the slot; advisory only, never hides anything.
  const withMisattribution = annotateMisattribution(annotated);

  // Guarantee the output satisfies the load-bearing schema.
  return CanonicalCvSchema.parse(withMisattribution);
}
