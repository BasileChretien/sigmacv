import { z } from "zod";
import { CslItemSchema } from "@/types/csl";

/**
 * ───────────────────────────────────────────────────────────────────────────
 * THE CANONICAL CV OBJECT — single source of truth.
 * ───────────────────────────────────────────────────────────────────────────
 * One structured JSON document = curated data + the user's display choices.
 * Every renderer (HTML, PDF, and later DOCX/LaTeX/Markdown) derives from this
 * object. It is stored verbatim in `Cv.document` (Postgres JSON).
 *
 * This contract is LOAD-BEARING. Bump `CANONICAL_SCHEMA_VERSION` and add a
 * migration when its shape changes; everything downstream depends on it.
 */

export const CANONICAL_SCHEMA_VERSION = 2 as const;

/**
 * Licenses offered for the whole-CV reuse statement (`display.cvLicense`) and
 * the human/URL mapping in `license.ts`. "none" + "all-rights-reserved" are the
 * two non-CC sentinels (no canonical SPDX URL). Proper nouns — NOT i18n'd.
 */
export const CV_LICENSES = [
  "none",
  "CC0-1.0",
  "CC-BY-4.0",
  "CC-BY-SA-4.0",
  "all-rights-reserved",
] as const;
export type CvLicenseKey = (typeof CV_LICENSES)[number];

export const SECTION_TYPES = [
  "publications",
  "preprints",
  "datasets",
  "positions",
  "education",
  "conference",
  "awards",
  "talks",
  "teaching",
  "supervision",
  "service",
  "peer-review",
  "editorial",
  "grants",
  // Clinical trials where the account holder is an investigator (registry-sourced,
  // name+org matched → review candidates). Non-prose entry section.
  "clinical-trials",
  // Patents where the account holder is an inventor (EPO OPS, name+org matched →
  // review candidates). Non-prose entry section.
  "patents",
  // ── Prose sections (free-text body, no items) ──────────────────────────────
  // The four R4RI / Royal-Society "narrative CV" contribution modules plus a
  // generic free-titled statement. They are first-class sections, managed like
  // any other (add / reorder / hide / rename) — see PROSE_SECTION_TYPES.
  "narrative-knowledge",
  "narrative-individuals",
  "narrative-community",
  "narrative-society",
  "statement",
  "skills",
  "languages",
  "references",
  "other",
] as const;
export const CvSectionTypeSchema = z.enum(SECTION_TYPES);
export type CvSectionType = z.infer<typeof CvSectionTypeSchema>;

/**
 * The PROSE section types — sections that carry a free-text `body` (a heading +
 * running prose) INSTEAD of `items[]`. Render + UI branch on this set to use the
 * `body` field and a single textarea rather than an item-row list. The four
 * `narrative-*` types are the standard funder "narrative CV" contribution
 * modules (UKRI Résumé for Research and Innovation / Royal Society Résumé for
 * Researchers framing); `statement` is a generic prose block the user titles.
 */
export const PROSE_SECTION_TYPES = new Set<CvSectionType>([
  "narrative-knowledge",
  "narrative-individuals",
  "narrative-community",
  "narrative-society",
  "statement",
]);

/** Whether a section type is a prose section (uses `body`, not `items`). */
export function isProseSectionType(type: CvSectionType): boolean {
  return PROSE_SECTION_TYPES.has(type);
}

/** Mirror of the `body` cap (`CvSectionSchema.body`) — used by the prose editor. */
export const PROSE_BODY_MAX = 8000;

/**
 * Canonical default ordering of sections on a fresh CV (standard academic
 * sequence). Single source of truth — the build applies it to newly-created
 * sections, while any arrangement the user has already made is preserved.
 */
export const DEFAULT_SECTION_ORDER: Record<CvSectionType, number> = {
  positions: 0,
  education: 1,
  publications: 2,
  preprints: 3,
  conference: 4,
  datasets: 5,
  grants: 6,
  // Clinical trials + patents sit with the other research outputs, after grants.
  "clinical-trials": 7,
  patents: 8,
  // The four narrative contribution modules sit together next.
  "narrative-knowledge": 9,
  "narrative-individuals": 10,
  "narrative-community": 11,
  "narrative-society": 12,
  awards: 13,
  talks: 14,
  teaching: 15,
  supervision: 16,
  editorial: 17,
  "peer-review": 18,
  service: 19,
  skills: 20,
  languages: 21,
  references: 22,
  // A generic prose statement sits near the end, just before "Other".
  statement: 23,
  other: 24,
};

/**
 * Why a user asserted a work "isn't mine". Optional structured signal captured
 * alongside the `notMine` flag — it sharpens the author-disambiguation-error
 * study (a same-name collision is a very different error from a duplicate).
 */
export const NOT_MINE_REASONS = ["different-person", "duplicate", "wrong-field", "other"] as const;
export const NotMineReasonSchema = z.enum(NOT_MINE_REASONS);
export type NotMineReason = z.infer<typeof NotMineReasonSchema>;
export const NOT_MINE_REASON_LABELS: Record<NotMineReason, string> = {
  "different-person": "A different researcher (name or ID collision)",
  duplicate: "Duplicate of another listed work",
  "wrong-field": "Outside my field of research",
  other: "Other reason",
};

/**
 * Authorship positions for the optional authorship-summary table (counts of how
 * often the account holder is first/last/corresponding/etc. across PEER-REVIEWED
 * publications — preprints excluded). The user chooses which rows to show.
 */
export const AUTHORSHIP_ROLES = [
  "first",
  "second",
  "third",
  "middle",
  "second-last",
  "last",
  "corresponding",
] as const;
export type AuthorshipRole = (typeof AUTHORSHIP_ROLES)[number];
export const AUTHORSHIP_ROLE_LABELS: Record<AuthorshipRole, string> = {
  first: "First author",
  second: "Second author",
  third: "Third author",
  middle: "k-th author",
  "second-last": "Second-to-last author",
  last: "Last author",
  corresponding: "Corresponding author",
};

/**
 * Computed disambiguation/review hints on an item (`meta.reviewFlag`). Advisory
 * only — never auto-hides; the user decides. A closed set so the value is typed
 * everywhere (no magic strings) and can't carry untrusted text; adding a new
 * heuristic is a one-line edit here. Stored docs with an unknown value degrade to
 * `undefined` (the field's `.catch`), never failing the whole CV read.
 *  - "orcid-conflict": an own work whose authorship lists a DIFFERENT ORCID;
 *  - "name-matched": a name+org-matched registry candidate (grants/trials/patents);
 *  - "orcid-doi": a work listed in the user's ORCID that OpenAlex didn't attribute;
 *  - "duplicate": this item likely duplicates another listed work (see `duplicateOf`);
 *  - "likely-misattributed": an OpenAlex-author-id-only match (no confirming ORCID on
 *    the paper) that disagrees with the rest of the profile on ≥2 strong signals —
 *    a probable over-merge of a same-name researcher (see `misattribution`).
 */
export const REVIEW_FLAGS = [
  "orcid-conflict",
  "name-matched",
  "orcid-doi",
  "duplicate",
  "likely-misattributed",
] as const;
export type ReviewFlag = (typeof REVIEW_FLAGS)[number];

/**
 * The independent signals a work can fail against the rest of the account
 * holder's profile, fed into `meta.misattribution`. A closed enum (typed, no
 * untrusted free-text); stored so the editor can explain WHY a work was flagged
 * and so the consent-gated disambiguation-error study can learn which signals
 * actually predict a confirmed "not mine".
 *  - "no-coauthor-overlap": shares no co-author (by ORCID) with the profile's
 *    identifier-confirmed works (the mandatory anchor — see misattribution.ts);
 *  - "different-field": its OpenAlex research field AND domain are absent from the
 *    profile's confirmed works (a cross-domain mismatch, e.g. medicine vs literature);
 *  - "affiliation-novel": its author-affiliation institution(s) (by ROR) never appear
 *    among the account holder's known institutions (confirmed works + positions);
 *  - "pre-career": published well before the account holder's earliest confirmed work
 *    (a corroborator only — never enough to flag on its own).
 */
export const MISATTRIBUTION_SIGNALS = [
  "no-coauthor-overlap",
  "different-field",
  "affiliation-novel",
  "pre-career",
] as const;
export type MisattributionSignal = (typeof MISATTRIBUTION_SIGNALS)[number];

/**
 * Confidence tier of a duplicate hint (`meta.duplicateOf.tier`), most→least:
 *  - "exact": a normalized identifier (DOI/PMID/registry/award) is equal;
 *  - "related": a publisher/registry-asserted relationship (e.g. Crossref preprint-of);
 *  - "strong": title + authors + year all agree;
 *  - "weak": title similarity only.
 * Closed enum so the value is typed everywhere; an unknown stored value degrades
 * to "weak" (the field's `.catch`) rather than failing the CV read.
 */
export const DUPLICATE_TIERS = ["exact", "related", "strong", "weak"] as const;
export type DuplicateTier = (typeof DUPLICATE_TIERS)[number];

/**
 * The typed relationship a duplicate has to its representative
 * (`meta.duplicateOf.relationship`), from the duplicate's perspective. Drives
 * the editor's explanatory copy (a preprint↔published pair reads very differently
 * from a translation or an erratum — and many are legitimately listed twice).
 */
export const DUPLICATE_RELATIONSHIPS = [
  "same-work",
  "preprint-of",
  "published-version-of",
  "version-of",
  "translation-of",
  "erratum-of",
] as const;
export type DuplicateRelationship = (typeof DUPLICATE_RELATIONSHIPS)[number];

/** A single CV entry. For MVP these come from OpenAlex works. */
export const CvItemSchema = z.object({
  /** Stable id — e.g. the OpenAlex short id "W2741809807", or "position:…". */
  id: z.string().max(1024),
  /** Where the item came from. "manual" = user-entered; "orcid" = ORCID record. */
  source: z.enum([
    "openalex",
    "orcid",
    "oep",
    "datacite",
    "crossref",
    "openaire",
    "dblp",
    // National funder APIs (name+org matched → review candidates, never auto-included).
    "ukri",
    "nih",
    "nsf",
    "clinicaltrials",
    "ctis",
    "ictrp",
    "epo",
    "derived",
    "manual",
  ]),
  /** Full source identifier (e.g. OpenAlex URL form, ORCID put-code, or "manual"). */
  sourceId: z.string().max(2048),
  /** CSL-JSON payload handed to citeproc. Absent for non-citation items. */
  csl: CslItemSchema.optional(),
  /** Plain display string for non-citation items (editorial roles, grants). */
  displayText: z.string().max(10_000).optional(),
  /**
   * USER OVERRIDE of the display string for a SOURCE-DERIVED entry (a Positions /
   * Education line built from ORCID/OpenAlex). When set it REPLACES `displayText`
   * everywhere the entry is shown, while `displayText` keeps being rebuilt from the
   * live source on every re-sync underneath — so a user edit (a) survives re-sync
   * (carried over in `build.ts` like `included`) and (b) can always be reverted to
   * the current source text by clearing it (see `setItemTextOverride`). Bounded
   * like `displayText`; optional + back-compat (an item without it renders the
   * source text exactly as before). NEVER set on citation items — those render
   * only through citeproc; the field is read only via {@link itemDisplayText}.
   */
  displayTextOverride: z.string().max(10_000).optional(),
  /**
   * DISPLAY curation. false = hidden from this CV (a work the user authored but
   * chose to leave off). Distinct from `notMine`. Never deletes the item.
   */
  included: z.boolean(),
  /**
   * DISAMBIGUATION assertion: true = "this work is wrongly attributed to me".
   * Orthogonal to `included`. Excludes the item from every output AND is the
   * exact signal a future v2 OpenAlex upstream-push would send. `.default(false)`
   * keeps pre-existing stored documents valid (treated as not-asserted, i.e. an
   * old `included:false` is a plain hide, never a disambiguation claim).
   */
  notMine: z.boolean().default(false),
  /** ISO timestamp when `notMine` was last set true (study + v2 push). */
  notMineAssertedAt: z.string().optional(),
  /** Optional structured reason for a `notMine` assertion (disambiguation study). */
  notMineReason: NotMineReasonSchema.optional(),
  /** Order within its section (ascending). */
  order: z.number().int(),
  /**
   * True when the account holder's identifier (ORCID / OpenAlex author id)
   * matched an authorship on this work. Drives self-name highlighting.
   * NEVER set by matching a name string.
   */
  authoredBySelf: z.boolean(),
  /**
   * The account holder's name(s) exactly as printed on THIS work, taken from
   * the authorship that matched by identifier. Used to wrap the right substring
   * when highlighting — only ever populated for `authoredBySelf` items.
   */
  selfNameVariants: z.array(z.string().max(300)).max(100),
  /** Lightweight denormalized metadata for the curation UI and grouping. */
  meta: z.object({
    year: z.number().int().optional(),
    type: z.string().max(200).optional(),
    doi: z.string().max(1000).optional(),
    citedByCount: z.number().int().optional(),
    /** Per-work field-weighted citation impact (OpenAlex `fwci`). Stored so the
     *  FWCI mean can be RECOMPUTED over the curated works (excluding "not mine"). */
    fwci: z.number().optional(),
    /** Whether this work is in the top decile by field+year citations (OpenAlex
     *  percentile ≥ 90). Stored so top-10% share recomputes over curated works. */
    topDecile: z.boolean().optional(),
    /** Open-access status from OpenAlex ("gold"/"green"/"hybrid"/"bronze"/"diamond"). */
    oaStatus: z.string().max(200).optional(),
    /** Whether OpenAlex DETERMINED this work's open-access state at build time:
     *  true = open, false = closed, undefined = no determination (or a CV synced
     *  before this field existed). Lets the profile OA share use an honest
     *  denominator — `oaStatus` alone is OA-only, so "closed" and "unknown" are
     *  otherwise indistinguishable. */
    oaIsOpen: z.boolean().optional(),
    /**
     * Reuse license of THIS work (e.g. "cc-by", "cc-by-nc-nd"), taken from the
     * OpenAlex location (`primary_location.license`, else `best_oa_location`).
     * Free-form (OpenAlex's own slug) — surfaced for FAIR/open-science display.
     */
    license: z.string().max(200).optional(),
    /** PubMed id (bare numeric, e.g. "12345678"), extracted from OpenAlex `ids.pmid`. */
    pmid: z.string().max(200).optional(),
    /** NIH iCite Relative Citation Ratio for this work (keyed by PMID), folded in
     *  by the iCite enrichment. Field-normalized but biomedical-only; stored so the
     *  RCR mean recomputes over the curated works. */
    rcr: z.number().optional(),
    /** True when Crossref records this work (by DOI) as RETRACTED — folded in by the
     *  retraction enrichment (Crossref `updated-by`/`relation.is-retracted-by`,
     *  publisher- or Retraction-Watch-sourced). Surfaced as a research-integrity flag. */
    retracted: z.boolean().optional(),
    /** ROR id of the institution this item was canonicalized to, when ROR matched. */
    rorId: z.string().max(2048).optional(),
    /**
     * Canonical institution NAME for a positions/education entry (ORCID org or
     * OpenAlex affiliation, post-ROR canonicalization). Stored so a renderer can
     * locate the institution substring inside the formatted line and link it to
     * its ROR record. Additive + optional; not used for matching.
     */
    institution: z.string().max(500).optional(),
    /**
     * Localized institution display names by language subtag (e.g.
     * `{ ja: "名古屋大学", fr: "Université de Nagoya" }`), from ROR's multilingual
     * `names[]`, restricted to the UI languages. A renderer shows the variant in
     * the CV's own language when present, falling back to {@link institution}
     * (ROR's `ror_display`). Additive + optional; populated on re-sync.
     */
    institutionNames: z.record(z.string().max(35), z.string().max(500)).optional(),
    /**
     * The institution's homepage URL, from ROR's `links[]` (`type:"website"`),
     * captured on a confident ROR match. A renderer links the institution name to
     * this site — the click target a reader expects — in preference to the ROR
     * record page; the ROR id (`rorId`) remains the persistent identifier and the
     * link fallback when no website is recorded. Additive + optional; only an
     * http(s) URL ROR carried, re-validated at render via `safeHref`.
     */
    institutionUrl: z.string().max(2048).optional(),
    /**
     * SOURCE role/title for a positions/education entry (ORCID `role-title`, e.g.
     * "Assistant Professor", "PharmD"). Refreshed from the source each build, like
     * {@link CvItem.displayText}. Undefined when the source carries none (e.g. an
     * OpenAlex-inferred affiliation, which has no job title). Read as discrete data
     * by the editor (the fillable "Role / title" field) and the public JSON-LD.
     */
    roleTitle: z.string().max(500).optional(),
    /**
     * USER edit of the role/title for a source-derived positions/education entry —
     * the value typed into the editor's "Role / title" field. Carried across
     * re-sync (like {@link CvItem.displayTextOverride}) and wins over the source
     * {@link roleTitle}; a blank value, or one equal to the source role, clears it
     * (revert to source). The effective role is {@link itemRoleTitle}.
     */
    roleTitleOverride: z.string().max(500).optional(),
    /** Source department/sub-unit for a positions/education entry (ORCID `department-name`). */
    department: z.string().max(500).optional(),
    /**
     * USER edit of the department/sub-unit for a source-derived positions/education
     * entry — the "Edit details" field. Carried across re-sync (like
     * {@link roleTitleOverride}) and wins over the source {@link department}; a blank
     * value, or one equal to the source, clears it. Effective value: {@link itemDepartment}.
     */
    departmentOverride: z.string().max(500).optional(),
    /** Start year of a positions/education entry's date range (for re-deriving the line). */
    startYear: z.number().int().optional(),
    /** End year of a positions/education entry's date range; undefined = ongoing ("present"). */
    endYear: z.number().int().optional(),
    /**
     * USER edit of the institution NAME for a source-derived positions/education
     * entry. Carried across re-sync (like {@link roleTitleOverride}) and wins over
     * the source {@link institution}. Editing it makes the text authoritative —
     * its ROR auto-link/localized variant no longer applies (the user's spelling
     * is shown verbatim). Cleared (blank, or equal to the source name) to revert.
     */
    institutionOverride: z.string().max(500).optional(),
    /**
     * USER edit of the date range for a source-derived positions/education entry.
     * When set it REPLACES the source {@link startYear}/{@link endYear} entirely;
     * an absent `endYear` inside it means ongoing/"present". Carried across re-sync;
     * cleared to revert to the source dates. The effective range is {@link itemDateRange}.
     */
    dateRangeOverride: z
      .object({
        startYear: z.number().int().optional(),
        endYear: z.number().int().optional(),
      })
      .optional(),
    /**
     * Funder identifier for a grant item (interoperable funding metadata). The
     * OpenAlex funder id (e.g. "https://openalex.org/F4320332161") or the ORCID
     * funding's disambiguated-organization identifier (FundRef/ROR/GRID). Additive
     * + optional — never invented; left undefined when the source carries none.
     */
    funderId: z.string().max(2048).optional(),
    /** Human-readable funder name for a grant item (OpenAlex `funder_display_name` / ORCID org name). */
    funderName: z.string().max(1000).optional(),
    /** Award / grant number for a grant item (OpenAlex `awards[].funder_award_id` / ORCID grant external id). */
    awardId: z.string().max(500).optional(),
    /**
     * ISO timestamp of the build that last fetched this item from a LIVE source
     * (openalex/orcid/…). Per-item freshness for FAIR provenance; undefined for
     * purely manual entries that were never re-fetched.
     */
    lastVerifiedAt: z.string().optional(),
    /** The account holder's authorship role on this work ("first"/"last"/"corresponding"). */
    authorRole: z.string().max(200).optional(),
    /** Total number of authors on the work. */
    authorCount: z.number().int().optional(),
    /** The account holder's 1-based position among the authors (authorship table). */
    authorPosition: z.number().int().optional(),
    /** Whether the account holder is a corresponding author on this work. */
    isCorresponding: z.boolean().optional(),
    /**
     * Bare ORCID iDs of this work's CO-AUTHORS (the account holder's own ORCID
     * excluded), captured from OpenAlex authorships at build time. Identifier
     * data ONLY — never a name. Drives server-side resolution of co-authors who
     * ALSO have a published + search-indexable SigmaCV CV, surfaced solely as
     * schema.org `knows` links in the public JSON-LD (never an inline citation
     * link, never name-matched). STRIPPED by {@link projectCvForPublic} so the
     * raw list never reaches the machine downloads; resolution runs on the
     * stored (unprojected) document, server-side only. Bounded at build.
     */
    coauthorOrcids: z.array(z.string().max(50)).max(300).optional(),
    /**
     * Which identifier matched the account holder on this work: "orcid" (strong),
     * "openalex-id", "both", or "claimed" (no identifier match — the user asserted
     * ownership when adding the work by DOI). Recorded so the disambiguation-error
     * study can stratify assertions by how the (possibly wrong) match was made.
     */
    matchBasis: z.enum(["orcid", "openalex-id", "both", "claimed"]).optional(),
    /**
     * True when the user added this work themselves by DOI (fetched from OpenAlex
     * but not attributed to their author profile). The metadata is still from the
     * source — only the ownership is user-asserted. Marked so re-sync preserves it
     * (it won't be re-fetched) and the disambiguation study can use the
     * false-negative correction signal (the mirror of "not mine").
     */
    claimed: z.boolean().optional(),
    /**
     * Whether this citation is a peer-reviewed output (computed at build from the
     * work type + venue). false for preprints, datasets, editorials, etc. Drives
     * the "peer-reviewed only" display filter. Undefined for non-citation items.
     */
    peerReviewed: z.boolean().optional(),
    /** True when this item's metadata was gap-filled from Crossref (source display). */
    enriched: z.boolean().optional(),
    /**
     * A computed disambiguation/review hint (see {@link REVIEW_FLAGS}). Advisory
     * only — never hides the item; the user decides. A closed enum (typed
     * everywhere, no untrusted free-text); an unknown stored value degrades to
     * `undefined` rather than failing the CV read.
     */
    reviewFlag: z.enum(REVIEW_FLAGS).optional().catch(undefined),
    /**
     * Cross-source DUPLICATE hint (set with `reviewFlag === "duplicate"`). Points
     * at the richer/"representative" item this one likely duplicates, with the
     * detector's confidence tier + typed relationship. ADVISORY only — never
     * hides the item; the user decides. RECOMPUTED every build (never trusted
     * stale); a "not a duplicate" dismissal is persisted separately in
     * `display.dismissedDuplicates`. Closed enums (no untrusted free-text); an
     * unknown stored value degrades rather than failing the whole CV read.
     */
    duplicateOf: z
      .object({
        /** Item id of the representative (the work to keep). */
        itemId: z.string().max(1024),
        tier: z.enum(DUPLICATE_TIERS).catch("weak"),
        relationship: z.enum(DUPLICATE_RELATIONSHIPS).optional().catch(undefined),
        /** Stable id of the duplicate group (the representative's id). */
        groupId: z.string().max(1024),
      })
      .optional()
      .catch(undefined),
    /**
     * The work's primary OpenAlex research topic, reduced to its FIELD and DOMAIN
     * display names (e.g. `{ field: "Oncology", domain: "Health Sciences" }`) — the
     * top two levels of OpenAlex's topic taxonomy. Denormalized source metadata
     * (like {@link authorRole}); used only by the misattribution heuristic to detect
     * a cross-domain mismatch with the rest of the profile. Optional — absent for
     * older records or works OpenAlex hasn't topic-classified. STRIPPED from the
     * public projection (internal signal, not a render input).
     */
    topic: z
      .object({
        field: z.string().max(300).optional(),
        domain: z.string().max(300).optional(),
      })
      .optional()
      .catch(undefined),
    /**
     * ROR ids of the institutions on the account holder's OWN authorship of this work
     * (their affiliation as printed on this paper, from OpenAlex). Denormalized source
     * metadata; used only by the misattribution heuristic's affiliation check (does
     * this paper's institution ever match one the user is actually associated with).
     * Bounded; institutions without a ROR contribute nothing. STRIPPED from the public
     * projection (internal signal, not a render input).
     */
    workInstitutions: z.array(z.string().max(2048)).max(50).optional().catch(undefined),
    /**
     * Misattribution hint (set with `reviewFlag === "likely-misattributed"`): an
     * OpenAlex-author-id-only match (no confirming ORCID on the paper) that disagrees
     * with the rest of the identifier-confirmed profile on ≥2 strong signals — a
     * probable over-merge of a same-name researcher. `score` (0..1) ranks confidence;
     * `signals` lists which checks fired (see {@link MISATTRIBUTION_SIGNALS}), driving
     * the editor's "why" copy and the consent-gated disambiguation study. ADVISORY
     * only — never hides the item; the user decides. RECOMPUTED every build (never
     * trusted stale). STRIPPED from the public projection. An unknown stored value
     * degrades to `undefined` rather than failing the whole CV read.
     */
    misattribution: z
      .object({
        score: z.number().min(0).max(1),
        signals: z.array(z.enum(MISATTRIBUTION_SIGNALS)).max(MISATTRIBUTION_SIGNALS.length),
      })
      .optional()
      .catch(undefined),
  }),
});
export type CvItem = z.infer<typeof CvItemSchema>;

/**
 * Single source of truth for "should this item be left off the rendered CV?".
 * True when the user hid it (display) OR asserted it isn't theirs (disambiguation).
 * Every renderer routes through `visibleItems`, which uses this.
 */
export function isHidden(item: Pick<CvItem, "included" | "notMine">): boolean {
  return !item.included || item.notMine === true;
}

/**
 * The effective display string for a non-citation entry item: the user's
 * `displayTextOverride` when set, otherwise the source-built `displayText`. Every
 * renderer and the editor route through this so a user's edit of a Positions /
 * Education line shows everywhere, while the source value keeps refreshing
 * underneath (and can be restored by clearing the override). Returns undefined
 * for items that carry neither (e.g. citation items, which render via citeproc).
 */
export function itemDisplayText(
  item: Pick<CvItem, "displayText" | "displayTextOverride">,
): string | undefined {
  return item.displayTextOverride ?? item.displayText;
}

/**
 * The effective role/title for a positions/education item: the user's
 * `meta.roleTitleOverride` when set, otherwise the source-built `meta.roleTitle`.
 * The editor binds the "Role / title" field to this (so a user edit shows while
 * the source value refreshes underneath, restorable by clearing the override),
 * and the line re-derive ({@link rederiveEntryLine}) uses it. Returns undefined
 * when the item has neither (e.g. an OpenAlex position the user hasn't titled).
 */
export function itemRoleTitle(item: Pick<CvItem, "meta">): string | undefined {
  return item.meta.roleTitleOverride ?? item.meta.roleTitle;
}

/**
 * The effective institution NAME for a positions/education item: the user's
 * `meta.institutionOverride` when set, otherwise the source `meta.institution`.
 * A renderer localizes + ROR-links the SOURCE name only; an override is shown
 * verbatim (the user's spelling wins, no link).
 */
export function itemInstitution(item: Pick<CvItem, "meta">): string | undefined {
  return item.meta.institutionOverride ?? item.meta.institution;
}

/**
 * The effective department/sub-unit for a positions/education item: the user's
 * `meta.departmentOverride` when set, otherwise the source `meta.department`.
 */
export function itemDepartment(item: Pick<CvItem, "meta">): string | undefined {
  return item.meta.departmentOverride ?? item.meta.department;
}

/**
 * The effective date range for a positions/education item: the user's
 * `meta.dateRangeOverride` when set (an absent `endYear` = ongoing), otherwise
 * the source `meta.startYear`/`meta.endYear`. Used to re-derive the line and to
 * localize the "present"/"until" term at render.
 */
export function itemDateRange(item: Pick<CvItem, "meta">): {
  startYear?: number;
  endYear?: number;
} {
  return (
    item.meta.dateRangeOverride ?? { startYear: item.meta.startYear, endYear: item.meta.endYear }
  );
}

/**
 * The institution NAME to display for a positions/education item in a given CV
 * locale: ROR's localized variant in the CV's language (`meta.institutionNames`)
 * when one exists, otherwise the canonical `meta.institution` (ROR `ror_display`,
 * not forced to English). Pure; the renderers use it both to substitute the name
 * into the formatted line and to locate it for the ROR link, so the two stay in
 * agreement. Returns undefined only when the item carries no institution at all.
 */
export function displayInstitution(item: Pick<CvItem, "meta">, locale: string): string | undefined {
  const base = item.meta.institution;
  const names = item.meta.institutionNames;
  if (!base || !names) return base;
  const lang = locale.split("-")[0]?.toLowerCase();
  return (lang ? names[lang] : undefined) ?? base;
}

export const CvSectionSchema = z.object({
  id: z.string().max(200),
  type: CvSectionTypeSchema,
  /** User-editable section heading. */
  title: z.string().max(1000),
  /** Section show/hide toggle. */
  visible: z.boolean(),
  order: z.number().int(),
  // Bounded to cap render cost / payload size (defence against a crafted giant
  // document forcing multi-second citeproc renders). 10k items per section is
  // far beyond any real CV yet blocks pathological abuse.
  items: z.array(CvItemSchema).max(10_000),
  /**
   * USER FREE-TEXT prose body. Used ONLY by prose sections (`PROSE_SECTION_TYPES`)
   * — a heading + running prose, with `items` left `[]`. Bounded (8k chars) to
   * keep the canonical document a sane size. It is user-controlled and must be
   * escaped / safe-transformed by every renderer (never interpreted as raw
   * HTML/markdown). Optional + back-compat: a non-prose section omits it.
   */
  body: z.string().max(8000).optional(),
});
export type CvSection = z.infer<typeof CvSectionSchema>;

/**
 * Author-level metrics captured from OpenAlex at sync time. Stored regardless
 * of display choice; only shown if the user opts in. Keyed by OpenAlex's own
 * field names so the mapping is obvious.
 */
export const OwnerMetricsSchema = z.object({
  "2yr_mean_citedness": z.number().optional(),
  h_index: z.number().int().optional(),
  i10_index: z.number().int().optional(),
  works_count: z.number().int().optional(),
  cited_by_count: z.number().int().optional(),
  // Derived field-normalized measures (computed from per-work data at build).
  fwci_mean: z.number().optional(),
  fwci_n: z.number().int().optional(), // works the FWCI mean was computed over
  top10pct_share: z.number().optional(), // 0..1
  // Mean NIH iCite Relative Citation Ratio over works with a PMID + RCR.
  // Field-normalized but BIOMEDICAL-ONLY (PMID-keyed) — surfaced opt-in with a caveat.
  rcr_mean: z.number().optional(),
  rcr_n: z.number().int().optional(), // works the RCR mean was computed over
});
export type OwnerMetrics = z.infer<typeof OwnerMetricsSchema>;

/** One year's output + citation counts (from OpenAlex), for the mini charts. */
export const CountsByYearSchema = z.object({
  year: z.number().int(),
  works: z.number().int(),
  citations: z.number().int(),
});
export type CountsByYear = z.infer<typeof CountsByYearSchema>;

/** An extra labelled link (personal site, Google Scholar, GitHub, …). */
export const CvLinkSchema = z.object({
  label: z.string().max(120),
  url: z.string().max(2048),
});
export type CvLink = z.infer<typeof CvLinkSchema>;

/** Optional contact block. All user-entered, optional, deleted with the account. */
export const CvContactSchema = z.object({
  email: z.string().max(254).optional(),
  phone: z.string().max(60).optional(),
  website: z.string().max(2048).optional(),
  location: z.string().max(200).optional(),
});
export type CvContact = z.infer<typeof CvContactSchema>;

/**
 * Personal fields for the Japanese rirekisho (履歴書) form. PERSONAL DATA under
 * GDPR/APPI: entirely optional, user-entered, never auto-populated, included in
 * the data export and cascade-deleted with the account. Only rendered by the
 * rirekisho template and only when the user fills them in.
 */
export const CvPersonalSchema = z.object({
  /** Furigana / phonetic reading of the name (ふりがな). */
  phoneticName: z.string().max(200).optional(),
  /** Free-form or ISO date — we never parse/validate the calendar. */
  dateOfBirth: z.string().max(40).optional(),
  gender: z.string().max(40).optional(),
  nationality: z.string().max(120).optional(),
  address: z.string().max(400).optional(),
});
export type CvPersonal = z.infer<typeof CvPersonalSchema>;

/** Max length of an embedded photo data URL (~1 MB). Keeps the document sane. */
export const PHOTO_DATA_URL_MAX = 1_400_000;

export const CvOwnerSchema = z.object({
  /** Bare ORCID iD, e.g. "0000-0002-7483-2489". */
  orcid: z.string().max(64),
  /** All OpenAlex author ids for this iD (one iD can map to several). */
  openAlexAuthorIds: z.array(z.string().max(256)).max(200),
  /** Header display only — never used for matching/highlighting. */
  displayName: z.string().max(1000),
  /** An honorific/title prefix shown BEFORE the name, e.g. "Dr" (user-editable). */
  honorific: z.string().max(60).optional(),
  /** A short headline / role shown UNDER the name (user-editable). */
  headline: z.string().max(200).optional(),
  /** A few-sentence professional summary shown at the top (user-editable). */
  summary: z.string().max(2000).optional(),
  /**
   * Profile photo as an embedded data URL (client-side downscaled + capped).
   * Lives in the document — no external host, deleted with the account. Only
   * shown by templates that support a photo (modern / rirekisho).
   */
  photo: z
    .string()
    .max(PHOTO_DATA_URL_MAX)
    // Raster formats only. Crucially this REJECTS image/svg+xml, which can carry
    // embedded scripts. END-ANCHORED to a strict base64 body so nothing can be
    // smuggled AFTER the base64 (e.g. `…;base64,AAAA"><script>`): the schema is a
    // real boundary, not just a prefix check. The client downscales to JPEG, so a
    // non-conforming value only arrives via a crafted request.
    .regex(
      /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/i,
      "photo must be a JPEG, PNG, WebP, or GIF data URL",
    )
    .optional(),
  contact: CvContactSchema.optional(),
  links: z.array(CvLinkSchema).max(20).default([]),
  personal: CvPersonalSchema.optional(),
  metrics: OwnerMetricsSchema.optional(),
  /** Per-year works/citations (drives the optional charts). Default empty. */
  countsByYear: z.array(CountsByYearSchema).default([]),
  /**
   * Wikidata entity URI for the account holder, matched by ORCID (`wdt:P496`).
   * Surfaced as a `sameAs` link in the public page's schema.org Person graph —
   * never used for matching/highlighting. Optional + back-compat.
   */
  wikidataUri: z.string().max(2048).optional(),
  /**
   * Additional authority-file `sameAs` URIs discovered via Wikidata (the Wikidata
   * entity itself plus any VIAF / ISNI links). Strengthens the public page's
   * structured-data identity graph. Optional (consumers treat absent as empty).
   */
  wikidataSameAs: z.array(z.string().max(2048)).max(20).optional(),
});
export type CvOwner = z.infer<typeof CvOwnerSchema>;

/** Constrained customization options (kept tasteful + safe-to-inject). */
export const TEMPLATES = ["classic", "modern", "sidebar", "ats", "rirekisho"] as const;
/**
 * Online-only animated "showcase" styles for the public living page (`/p/[slug]`).
 * `"match"` (default) renders the public page with the document `template`; the
 * other keys apply an animated, web-only style. These NEVER affect any export
 * (PDF/DOCX/LaTeX/Markdown) — those always use the document `template`.
 */
export const PUBLIC_STYLES = [
  "match",
  "folio",
  "meridian",
  "trajectory",
  "lumina",
  "prism",
  "pop",
  "neon",
  "synthwave",
  "terminal",
  "riso",
  "aura",
  "mesh",
  "marquee",
  "clockwork",
  "arcade",
  "meadow",
  "cyberpunk",
] as const;
export const FONT_PAIRINGS = ["serif", "sans", "palatino"] as const;
export const DENSITIES = ["comfortable", "compact"] as const;
/** How the account holder's name is emphasised in their own works. */
export const HIGHLIGHT_STYLES = ["accent", "bold", "underline", "accent-underline"] as const;
export type HighlightStyle = (typeof HIGHLIGHT_STYLES)[number];
/** Curated accent swatches offered in the UI (any valid 6-digit hex is allowed). */
export const ACCENT_PRESETS = [
  "#1f4fd8",
  "#0f766e",
  "#9333ea",
  "#b42318",
  "#b45309",
  "#334155",
] as const;

export type TemplateKey = (typeof TEMPLATES)[number];
export type PublicStyleKey = (typeof PUBLIC_STYLES)[number];
export type FontPairing = (typeof FONT_PAIRINGS)[number];
export type Density = (typeof DENSITIES)[number];

/** Validated 6-digit hex — prevents CSS injection via the accent colour. */
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/**
 * A user-supplied CSL style fetched from the Zotero/CSL repository (or a URL).
 * The resolved INDEPENDENT style XML is stored inline so every render is
 * reproducible and offline-safe — `cslStyle` equals this `id` when selected.
 * Validated server-side before it ever lands here (see api/cv/style/resolve).
 */
export const CustomStyleSchema = z.object({
  id: z.string().min(1).max(128),
  title: z.string().max(300),
  /** Independent CSL XML. Capped to keep the canonical document a sane size. */
  xml: z.string().min(1).max(600_000),
});
export type CustomStyle = z.infer<typeof CustomStyleSchema>;

export const DisplayChoicesSchema = z.object({
  // .catch keeps old saved CVs loading if they reference a since-removed
  // template (e.g. minimal/compact/editorial) — they fall back to classic.
  template: z.enum(TEMPLATES).default("classic").catch("classic"),
  /**
   * Public-page-only showcase style (see PUBLIC_STYLES). `"match"` (default)
   * renders the living public page with the document `template`; any other key
   * applies an animated, web-only style. Never affects exports. `.catch` keeps
   * old/garbage values loading by falling back to "match".
   */
  publicStyle: z.enum(PUBLIC_STYLES).default("match").catch("match"),
  /** Bundled CSL style key, e.g. "apa" (see src/lib/citeproc/assets/styles). */
  cslStyle: z.string().max(200).default("apa"),
  /**
   * A user-added CSL style (from the Zotero/CSL repo). When `cslStyle` matches
   * its `id`, this XML is used instead of a bundled style. Optional + back-compat.
   */
  customStyle: CustomStyleSchema.optional(),
  /** Bundled locale, e.g. "en-US". Constrained to a BCP-47-shaped tag (the UI
   *  only offers the ten supported locales); `.catch` keeps an old/garbage stored
   *  value loading by falling back to en-US instead of failing the whole CV read,
   *  and neutralizes any injection-shaped value before it reaches Intl/JSON-LD. */
  locale: z
    .string()
    .regex(/^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/)
    .default("en-US")
    .catch("en-US"),
  highlightSelf: z.boolean().default(true),
  /** How the self-name is emphasised (colour / bold / underline). */
  highlightStyle: z.enum(HIGHLIGHT_STYLES).default("accent"),
  /**
   * Whole-CV reuse license (FAIR / open-science). Default "none" = no statement.
   * `licenseInfo()` in `license.ts` maps the key → human name + SPDX URL.
   */
  cvLicense: z.enum(CV_LICENSES).default("none"),
  /** Master metrics toggle. Brief: metrics default to NONE. */
  showMetrics: z.boolean().default(false),
  /** Which metric keys to show (subset of METRIC_KEYS). Default none. */
  metrics: z.array(z.string().max(64)).max(100).default([]),
  /** Show the publications/citations-per-year mini charts (HTML/PDF). Default off. */
  showCharts: z.boolean().default(false),
  /** Show an "Open Access" badge on OA publications (HTML/PDF). Opt-in, default
   *  off — consistent with the metrics-default-none, DORA-aligned stance (an OA
   *  indicator is factual, not evaluative, but stays the user's explicit choice). */
  showOpenAccess: z.boolean().default(false),
  /** Hide works flagged as retracted (`meta.retracted`) from every output. Default
   *  off → retracted works are shown WITH the always-on "Retracted" badge; the user
   *  can opt to exclude them entirely. */
  hideRetracted: z.boolean().default(false),
  /** Show the account holder's authorship role (first/last/corresponding). Default off. */
  showAuthorRole: z.boolean().default(false),
  /** Show a per-entry citation count on publications/preprints (HTML/PDF). Default off. */
  showCitationCounts: z.boolean().default(false),
  /**
   * Show a data-provenance footer (sources, sync date, hidden/corrected counts,
   * classification caveat). Opt-IN: it's meta-information that doesn't belong on
   * a finished CV by default (and "N hidden" over-shares curation). Kept as an
   * option for transparency/auditability. Default off.
   */
  showProvenance: z.boolean().default(false),
  /**
   * Render only peer-reviewed citations (drops preprints + non-peer-reviewed
   * works wherever they sit, e.g. a preprint mis-filed under Publications).
   * Non-citation entries (positions, grants, …) are unaffected. Default off.
   */
  peerReviewedOnly: z.boolean().default(false),
  /**
   * Count LETTERS (correspondence / research letters — `type: "letter"`) toward
   * the publication list AND the figures (per-year charts, field-normalized
   * metrics, authorship table). Letters in a real journal are peer-reviewed, so
   * the default is ON. Turn it off for an "articles-only" view that drops letters
   * from the list + figures. Preprints are handled separately (their own section
   * / `peerReviewedOnly`); non-peer-reviewed items never count toward the figures.
   */
  countLetters: z.boolean().default(true),
  /**
   * How publication/preprint entries are ordered. "custom" keeps the built/
   * dragged order (newest-first by default); other values re-sort at render.
   */
  publicationOrder: z.enum(["custom", "citations", "year-desc", "year-asc"]).default("custom"),
  /**
   * "Selected publications": cap the Publications section to the top N entries
   * (after ordering + the peer-reviewed-only filter), for a grant biosketch /
   * 2-page CV. 0 or undefined = show all. Other sections are unaffected.
   */
  publicationsLimit: z.number().int().min(0).max(500).optional(),
  /**
   * Per-view item EXCLUSIONS: `sectionId → [itemId, …]` hidden from THIS view
   * only. A saved preset captures it with the rest of `display`, so different
   * presets (full CV vs. a short grant CV) can show different subsets of the SAME
   * curated data — no duplication, single source of truth.
   *
   * Distinct from curation: "not mine"/hidden (`included:false`) removes a work
   * EVERYWHERE and carries a disambiguation research signal; this is a purely
   * cosmetic per-view choice with no research meaning. It can only NARROW the
   * already-visible set (a hidden / "not mine" work can never be resurfaced).
   *
   * Deny-list semantics: a work absent from the list shows by default, so a
   * newly-synced publication appears automatically and the owner removes it if
   * unwanted. Absent section ⇒ all its visible items show (back-compat: old docs
   * carry no field).
   */
  excludedItems: z.record(z.string().max(200), z.array(z.string().max(200)).max(10_000)).optional(),
  /**
   * Pair keys the user dismissed as "not a duplicate" ("keep both"). The
   * detector never re-flags a dismissed pair, so the decision SURVIVES re-sync
   * (the verdict itself is recomputed every build; only this human choice is
   * persisted). Each key is the order-independent `"<anchorA>|<anchorB>"` of the
   * two items, anchored by normalized DOI/PMID (stable across id churn) else id —
   * see `duplicates.ts` `duplicatePairKey`. Bounded; back-compat (old docs omit
   * it). Travels with `display`, so a preset snapshots it like other view state.
   * `.catch(undefined)`: a corrupt / over-cap stored value degrades to "no
   * dismissals remembered" (badges re-appear) rather than failing the CV read.
   */
  dismissedDuplicates: z.array(z.string().max(2200)).max(20_000).optional().catch(undefined),
  /**
   * Item ids of review candidates the user triaged with "Keep hidden": an
   * ORCID-discovered work (`reviewFlag === "orcid-doi"`) or a name+org-matched
   * registry candidate (`"name-matched"`) they want OFF the CV WITHOUT recording
   * a "not mine" disambiguation claim (it may well be theirs — they just don't
   * want it shown, and don't want it flagged again). The review badge + the
   * CV-health checklist stop nagging about a dismissed id while it stays hidden.
   * Keyed by item id, which is stable across re-sync for both flavours
   * (orcid-doi items carry over whole; name-matched ids are content-derived), so
   * the decision SURVIVES re-sync. Bounded; back-compat (old docs omit it).
   * `.catch(undefined)`: a corrupt / over-cap value degrades to "nothing
   * dismissed" (badges re-appear) rather than failing the CV read.
   */
  dismissedReviewCandidates: z.array(z.string().max(1024)).max(20_000).optional().catch(undefined),
  /**
   * True once the user has manually reordered sections (drag or ↑/↓). Until
   * then the build applies the canonical default order (Positions → Education →
   * Publications → …); afterwards the user's arrangement is preserved on re-sync.
   */
  sectionsCustomized: z.boolean().default(false),
  /** Show the authorship-position summary table (counts of first/last/…). Default off. */
  showAuthorshipTable: z.boolean().default(false),
  /** Which authorship roles to include in that table (subset of AUTHORSHIP_ROLES). */
  authorshipRoles: z.array(z.string().max(64)).max(50).default([]),
  /** Accent colour (validated hex). */
  accentColor: z.string().regex(HEX_COLOR).default("#1f4fd8"),
  fontPairing: z.enum(FONT_PAIRINGS).default("serif"),
  density: z.enum(DENSITIES).default("comfortable"),
  /**
   * Per-field consent for what appears on the PUBLIC page (`/p/[slug]`). Default
   * ALL OFF (GDPR/APPI data-minimization): publishing shares the CV body, but
   * contact details are personal data and are shown publicly only when the owner
   * explicitly opts each one in. The rirekisho `owner.personal` fields (address,
   * date of birth, gender, nationality) are NEVER auto-published — they have no
   * flag and are always stripped from the public projection.
   */
  publicContact: z
    .object({
      email: z.boolean().default(false),
      phone: z.boolean().default(false),
      location: z.boolean().default(false),
    })
    // zod 4: `.prefault({})` applies the default to the INPUT before parsing, so
    // the nested `.default(false)`s still fill the three booleans — matching the
    // zod 3 `.default({})` behaviour (object `.default()` was retyped in zod 4).
    .prefault({}),
  /**
   * Show the small "Made with SigmaCV" attribution footer on the PUBLIC living
   * page (`/p/[slug]`) only — a referral backlink to the site root. Opt-OUT:
   * default ON. It never appears on exported PDF/DOCX/LaTeX/Markdown (a CV the
   * owner submits to a job/grant must stay unbranded); the public route is the
   * only renderer that requests it.
   */
  publicAttribution: z.boolean().default(true),
  /**
   * Show a "Co-authors on SigmaCV" block on the PUBLIC living page (`/p/[slug]`)
   * listing the account holder's co-authors who ALSO have their own published,
   * search-indexable SigmaCV CV (resolved server-side by ORCID, never by name).
   * Opt-IN: default OFF — the block touches third parties and sends traffic away,
   * so the owner enables it deliberately. Public page only (never in an export).
   */
  showCoauthorLinks: z.boolean().default(false),
  /**
   * Whether THIS CV may be linked TO from other users' co-author blocks / JSON-LD
   * `knows` graphs (i.e. listed as their on-SigmaCV co-author). Opt-OUT: default
   * ON — a link is only ever made to a published + search-indexable page (already
   * a public-discovery choice), but this gives the owner an explicit switch to NOT
   * be listed as a collaborator elsewhere. Read by `resolveCoauthorCvs`.
   */
  coauthorLinkable: z.boolean().default(true),
});
export type DisplayChoices = z.infer<typeof DisplayChoicesSchema>;

export const PROVENANCE_SOURCES = [
  "openalex",
  "orcid",
  "oep",
  "crossref",
  "datacite",
  "openaire",
  "dblp",
  "ukri",
  "nih",
  "nsf",
  "clinicaltrials",
  "ctis",
  "ictrp",
  "epo",
  "ror",
  // Provenance-only sources (enrich identity/affiliations, not CV items).
  "wikidata",
  "derived",
  "manual",
] as const;

export const ProvenanceSchema = z.object({
  generatedAt: z.string().max(64),
  lastSyncedAt: z.string().max(64).optional(),
  /** Data sources that contributed to this CV. Back-compat: old ["openalex"]. */
  sources: z.array(z.enum(PROVENANCE_SOURCES)),
});
export type Provenance = z.infer<typeof ProvenanceSchema>;

/**
 * A named display-preset: a saved "view" of the same canonical CV (e.g. a full
 * academic CV vs. a 2-page grant biosketch). Captures the display choices + a
 * snapshot of which sections were visible, so the user can switch between
 * layouts WITHOUT duplicating the underlying curated data (single source of
 * truth). Curation (included/notMine/order/content) is shared across presets.
 */
export const CvPresetSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(60),
  display: DisplayChoicesSchema,
  /** sectionId → visible, captured when the preset was saved. */
  sectionVisibility: z.record(z.string(), z.boolean()).default({}),
});
export type CvPreset = z.infer<typeof CvPresetSchema>;

export const CanonicalCvSchema = z.object({
  schemaVersion: z.literal(CANONICAL_SCHEMA_VERSION),
  id: z.string().max(128),
  owner: CvOwnerSchema,
  display: DisplayChoicesSchema,
  // Bounded — a CV has at most a few dozen section types; the cap blocks a
  // crafted document with thousands of sections from amplifying render cost.
  sections: z.array(CvSectionSchema).max(60),
  /** Saved named view-presets (optional; back-compat: old docs have none). */
  presets: z.array(CvPresetSchema).max(20).default([]),
  provenance: ProvenanceSchema,
});
export type CanonicalCv = z.infer<typeof CanonicalCvSchema>;

/**
 * Map an old v1 narrative-module key → the v2 prose section TYPE it becomes.
 * `personal-statement` and `additional` have no dedicated prose type:
 *  - `personal-statement` folds into `owner.summary` when that is empty, else a
 *    `statement` section;
 *  - `additional` always becomes a `statement` section.
 * (Handled specially in `migrateNarrativeToSections`, not via this map.)
 */
const NARRATIVE_KEY_TO_SECTION_TYPE: Record<string, CvSectionType> = {
  knowledge: "narrative-knowledge",
  individuals: "narrative-individuals",
  community: "narrative-community",
  society: "narrative-society",
};

/**
 * v1 → v2: convert the old top-level `narrative[]` modules into first-class
 * prose SECTIONS. Each module's `heading` → section.title, `body` → section.body,
 * `included` → section.visible; the four contribution modules map to their
 * `narrative-*` type, `additional` (and any unknown key) to a generic `statement`
 * section, and `personal-statement` folds into `owner.summary` when that is empty
 * (else a `statement` section). Converted sections are appended AFTER the existing
 * sections; `narrative` is then dropped. Robust: never throws on a malformed old
 * doc (a non-array narrative, a non-object module, missing fields all degrade to a
 * no-op skip).
 */
function migrateNarrativeToSections(doc: Record<string, unknown>): void {
  const narrative = doc.narrative;
  delete doc.narrative; // remove the v1 field whatever happens next
  if (!Array.isArray(narrative) || narrative.length === 0) return;

  const sections = Array.isArray(doc.sections) ? [...doc.sections] : [];
  // Highest existing order, so appended prose sections sit after everything.
  let nextOrder =
    sections.reduce((m: number, s) => {
      const o = (s as { order?: unknown })?.order;
      return typeof o === "number" && o > m ? o : m;
    }, -1) + 1;

  const owner = { ...((doc.owner ?? {}) as Record<string, unknown>) };
  const summaryEmpty = typeof owner.summary !== "string" || owner.summary.trim().length === 0;

  let statementCount = 0;
  const makeSection = (type: CvSectionType, title: string, body: string, visible: boolean) => {
    // A unique id; `statement` can recur, so disambiguate the duplicates.
    const id = type === "statement" ? `statement:${statementCount++}` : type;
    sections.push({ id, type, title, visible, order: nextOrder++, items: [], body });
  };

  for (const raw of narrative) {
    if (!raw || typeof raw !== "object") continue;
    const mod = raw as Record<string, unknown>;
    const key = typeof mod.key === "string" ? mod.key : "";
    const heading = typeof mod.heading === "string" ? mod.heading : "";
    const body = typeof mod.body === "string" ? mod.body : "";
    // `included` defaulted to true in v1; treat a missing/non-false value as visible.
    const visible = mod.included !== false;

    if (key === "personal-statement") {
      if (summaryEmpty && body.trim().length > 0) {
        owner.summary = body;
        doc.owner = owner;
      } else if (body.trim().length > 0) {
        // Summary already set — keep the prose as a generic statement instead.
        makeSection("statement", heading || "Statement", body, visible);
      }
      continue;
    }

    const mappedType = NARRATIVE_KEY_TO_SECTION_TYPE[key];
    if (mappedType) {
      makeSection(mappedType, heading, body, visible);
    } else {
      // `additional` and any unknown key → a generic statement section.
      makeSection("statement", heading || "Statement", body, visible);
    }
  }

  doc.sections = sections;
}

/**
 * Upgrade a stored document to the current schema version BEFORE validation.
 * Routing every read through it means a version bump never silently nulls every
 * stored CV (the failure mode if validation simply rejected an old shape). New
 * FIELDS don't need a bump (Zod `.optional()`/`.default()` + enum-extension stay
 * back-compatible); only breaking/structural changes do.
 *
 * v1 → v2: the dedicated `narrative[]` array is replaced by first-class prose
 * sections (see `migrateNarrativeToSections`).
 */
export function migrateCanonicalDocument(input: unknown): unknown {
  if (!input || typeof input !== "object") return input;
  const original = input as Record<string, unknown>;
  let version = typeof original.schemaVersion === "number" ? original.schemaVersion : 1;
  // Only upgrade KNOWN older versions; the current version (and any higher/unknown
  // one — left for validation to reject) is returned untouched, never copied.
  if (version >= CANONICAL_SCHEMA_VERSION) return original;
  // Migration mutates as it upgrades — work on a shallow copy so the caller's
  // object is never changed (immutability invariant; `owner` is likewise copied
  // inside migrateNarrativeToSections).
  const doc = { ...original };
  while (version < CANONICAL_SCHEMA_VERSION) {
    if (version < 2) migrateNarrativeToSections(doc);
    version++;
  }
  doc.schemaVersion = CANONICAL_SCHEMA_VERSION;
  return doc;
}

/**
 * Parse + validate an unknown value (e.g. a row from Postgres JSON) into a
 * CanonicalCv. Throws ZodError on invalid input — callers handle it.
 */
export function parseCanonicalCv(input: unknown): CanonicalCv {
  return CanonicalCvSchema.parse(migrateCanonicalDocument(input));
}

export function safeParseCanonicalCv(input: unknown) {
  return CanonicalCvSchema.safeParse(migrateCanonicalDocument(input));
}
