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

export const CANONICAL_SCHEMA_VERSION = 1 as const;

export const SECTION_TYPES = [
  "publications",
  "preprints",
  "datasets",
  "positions",
  "education",
  "awards",
  "service",
  "peer-review",
  "editorial",
  "grants",
  "other",
] as const;
export const CvSectionTypeSchema = z.enum(SECTION_TYPES);
export type CvSectionType = z.infer<typeof CvSectionTypeSchema>;

/**
 * Why a user asserted a work "isn't mine". Optional structured signal captured
 * alongside the `notMine` flag — it sharpens the author-disambiguation-error
 * study (a same-name collision is a very different error from a duplicate).
 */
export const NOT_MINE_REASONS = [
  "different-person",
  "duplicate",
  "wrong-field",
  "other",
] as const;
export const NotMineReasonSchema = z.enum(NOT_MINE_REASONS);
export type NotMineReason = z.infer<typeof NotMineReasonSchema>;
export const NOT_MINE_REASON_LABELS: Record<NotMineReason, string> = {
  "different-person": "A different researcher (name or ID collision)",
  duplicate: "Duplicate of another listed work",
  "wrong-field": "Outside my field of research",
  other: "Other reason",
};

/** A single CV entry. For MVP these come from OpenAlex works. */
export const CvItemSchema = z.object({
  /** Stable id — e.g. the OpenAlex short id "W2741809807", or "position:…". */
  id: z.string(),
  /** Where the item came from. "manual" = user-entered; "orcid" = ORCID record. */
  source: z.enum(["openalex", "orcid", "oep", "datacite", "derived", "manual"]),
  /** Full source identifier (e.g. OpenAlex URL form, ORCID put-code, or "manual"). */
  sourceId: z.string(),
  /** CSL-JSON payload handed to citeproc. Absent for non-citation items. */
  csl: CslItemSchema.optional(),
  /** Plain display string for non-citation items (editorial roles, grants). */
  displayText: z.string().optional(),
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
  selfNameVariants: z.array(z.string()),
  /** Lightweight denormalized metadata for the curation UI and grouping. */
  meta: z.object({
    year: z.number().int().optional(),
    type: z.string().optional(),
    doi: z.string().optional(),
    citedByCount: z.number().int().optional(),
    /** Open-access status from OpenAlex ("gold"/"green"/"hybrid"/"bronze"/"diamond"). */
    oaStatus: z.string().optional(),
    /** The account holder's authorship role on this work ("first"/"last"/"corresponding"). */
    authorRole: z.string().optional(),
    /** Total number of authors on the work. */
    authorCount: z.number().int().optional(),
    /**
     * Whether this citation is a peer-reviewed output (computed at build from the
     * work type + venue). false for preprints, datasets, editorials, etc. Drives
     * the "peer-reviewed only" display filter. Undefined for non-citation items.
     */
    peerReviewed: z.boolean().optional(),
    /**
     * A computed disambiguation hint surfacing works that MIGHT be misattributed,
     * for proactive review (e.g. "orcid-conflict" = the matched OpenAlex author
     * record lists a different ORCID on this paper). Advisory only — never hides
     * the item; the user decides. Free-form so new heuristics need no schema bump.
     */
    reviewFlag: z.string().optional(),
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

export const CvSectionSchema = z.object({
  id: z.string(),
  type: CvSectionTypeSchema,
  /** User-editable section heading. */
  title: z.string(),
  /** Section show/hide toggle. */
  visible: z.boolean(),
  order: z.number().int(),
  items: z.array(CvItemSchema),
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
  top10pct_share: z.number().optional(), // 0..1
});
export type OwnerMetrics = z.infer<typeof OwnerMetricsSchema>;

/** One year's output + citation counts (from OpenAlex), for the mini charts. */
export const CountsByYearSchema = z.object({
  year: z.number().int(),
  works: z.number().int(),
  citations: z.number().int(),
});
export type CountsByYear = z.infer<typeof CountsByYearSchema>;

export const CvOwnerSchema = z.object({
  /** Bare ORCID iD, e.g. "0000-0002-7483-2489". */
  orcid: z.string(),
  /** All OpenAlex author ids for this iD (one iD can map to several). */
  openAlexAuthorIds: z.array(z.string()),
  /** Header display only — never used for matching/highlighting. */
  displayName: z.string(),
  metrics: OwnerMetricsSchema.optional(),
  /** Per-year works/citations (drives the optional charts). Default empty. */
  countsByYear: z.array(CountsByYearSchema).default([]),
});
export type CvOwner = z.infer<typeof CvOwnerSchema>;

/** Constrained customization options (kept tasteful + safe-to-inject). */
export const TEMPLATES = ["classic", "modern", "minimal", "compact"] as const;
export const FONT_PAIRINGS = ["serif", "sans", "palatino"] as const;
export const DENSITIES = ["comfortable", "compact"] as const;
/** How the account holder's name is emphasised in their own works. */
export const HIGHLIGHT_STYLES = [
  "accent",
  "bold",
  "underline",
  "accent-underline",
] as const;
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
  template: z.enum(TEMPLATES).default("classic"),
  /** Bundled CSL style key, e.g. "apa" (see src/lib/citeproc/assets/styles). */
  cslStyle: z.string().default("apa"),
  /**
   * A user-added CSL style (from the Zotero/CSL repo). When `cslStyle` matches
   * its `id`, this XML is used instead of a bundled style. Optional + back-compat.
   */
  customStyle: CustomStyleSchema.optional(),
  /** Bundled locale, e.g. "en-US". */
  locale: z.string().default("en-US"),
  highlightSelf: z.boolean().default(true),
  /** How the self-name is emphasised (colour / bold / underline). */
  highlightStyle: z.enum(HIGHLIGHT_STYLES).default("accent"),
  /** Master metrics toggle. Brief: metrics default to NONE. */
  showMetrics: z.boolean().default(false),
  /** Which metric keys to show (subset of METRIC_KEYS). Default none. */
  metrics: z.array(z.string()).default([]),
  /** Show the publications/citations-per-year mini charts (HTML/PDF). Default off. */
  showCharts: z.boolean().default(false),
  /** Show an "Open Access" badge on OA publications (HTML/PDF). Default on. */
  showOpenAccess: z.boolean().default(true),
  /** Show the account holder's authorship role (first/last/corresponding). Default off. */
  showAuthorRole: z.boolean().default(false),
  /** Show a data-provenance footer (sources, sync date, hidden/corrected counts). */
  showProvenance: z.boolean().default(true),
  /**
   * Render only peer-reviewed citations (drops preprints + non-peer-reviewed
   * works wherever they sit, e.g. a preprint mis-filed under Publications).
   * Non-citation entries (positions, grants, …) are unaffected. Default off.
   */
  peerReviewedOnly: z.boolean().default(false),
  /** Accent colour (validated hex). */
  accentColor: z.string().regex(HEX_COLOR).default("#1f4fd8"),
  fontPairing: z.enum(FONT_PAIRINGS).default("serif"),
  density: z.enum(DENSITIES).default("comfortable"),
});
export type DisplayChoices = z.infer<typeof DisplayChoicesSchema>;

export const PROVENANCE_SOURCES = [
  "openalex",
  "orcid",
  "oep",
  "crossref",
  "datacite",
  "ror",
  "derived",
  "manual",
] as const;

export const ProvenanceSchema = z.object({
  generatedAt: z.string(),
  lastSyncedAt: z.string().optional(),
  /** Data sources that contributed to this CV. Back-compat: old ["openalex"]. */
  sources: z.array(z.enum(PROVENANCE_SOURCES)),
});
export type Provenance = z.infer<typeof ProvenanceSchema>;

export const CanonicalCvSchema = z.object({
  schemaVersion: z.literal(CANONICAL_SCHEMA_VERSION),
  id: z.string(),
  owner: CvOwnerSchema,
  display: DisplayChoicesSchema,
  sections: z.array(CvSectionSchema),
  provenance: ProvenanceSchema,
});
export type CanonicalCv = z.infer<typeof CanonicalCvSchema>;

/**
 * Upgrade a stored document to the current schema version BEFORE validation.
 * Today schemaVersion === 1, so this is a pass-through — but it is the single
 * place a future v1→v2→… migration chain lives. Routing every read through it
 * means a version bump never silently nulls every stored CV (the failure mode
 * if validation simply rejected an old shape). New FIELDS don't need a bump
 * (Zod `.optional()`/`.default()` + enum-extension stay back-compatible); only
 * breaking/structural changes do.
 */
export function migrateCanonicalDocument(input: unknown): unknown {
  if (!input || typeof input !== "object") return input;
  const doc = input as Record<string, unknown>;
  let version = typeof doc.schemaVersion === "number" ? doc.schemaVersion : 1;
  // while (version < CANONICAL_SCHEMA_VERSION) { …migrate one step…; version++ }
  void version; // no migration steps yet (current version is 1)
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
