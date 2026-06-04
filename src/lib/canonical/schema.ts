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
  "conference",
  "awards",
  "talks",
  "teaching",
  "supervision",
  "service",
  "peer-review",
  "editorial",
  "grants",
  "skills",
  "other",
] as const;
export const CvSectionTypeSchema = z.enum(SECTION_TYPES);
export type CvSectionType = z.infer<typeof CvSectionTypeSchema>;

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
  awards: 7,
  talks: 8,
  teaching: 9,
  supervision: 10,
  editorial: 11,
  "peer-review": 12,
  service: 13,
  skills: 14,
  other: 15,
};

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
  middle: "Middle author",
  "second-last": "Second-to-last author",
  last: "Last author",
  corresponding: "Corresponding author",
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
    /** The account holder's 1-based position among the authors (authorship table). */
    authorPosition: z.number().int().optional(),
    /** Whether the account holder is a corresponding author on this work. */
    isCorresponding: z.boolean().optional(),
    /**
     * Which identifier matched the account holder on this work: "orcid" (strong),
     * "openalex-id", or "both". Recorded so the disambiguation-error study can
     * stratify "not mine" assertions by how the (possibly wrong) match was made.
     */
    matchBasis: z.enum(["orcid", "openalex-id", "both"]).optional(),
    /**
     * Whether this citation is a peer-reviewed output (computed at build from the
     * work type + venue). false for preprints, datasets, editorials, etc. Drives
     * the "peer-reviewed only" display filter. Undefined for non-citation items.
     */
    peerReviewed: z.boolean().optional(),
    /** True when this item's metadata was gap-filled from Crossref (source display). */
    enriched: z.boolean().optional(),
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
  fwci_n: z.number().int().optional(), // works the FWCI mean was computed over
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
  orcid: z.string(),
  /** All OpenAlex author ids for this iD (one iD can map to several). */
  openAlexAuthorIds: z.array(z.string()),
  /** Header display only — never used for matching/highlighting. */
  displayName: z.string(),
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
    // embedded scripts — the client already downscales to JPEG, so a non-raster
    // type only arrives via a crafted request.
    .regex(
      /^data:image\/(jpeg|png|webp|gif);base64,/i,
      "photo must be a JPEG, PNG, WebP, or GIF data URL",
    )
    .optional(),
  contact: CvContactSchema.optional(),
  links: z.array(CvLinkSchema).max(20).default([]),
  personal: CvPersonalSchema.optional(),
  metrics: OwnerMetricsSchema.optional(),
  /** Per-year works/citations (drives the optional charts). Default empty. */
  countsByYear: z.array(CountsByYearSchema).default([]),
});
export type CvOwner = z.infer<typeof CvOwnerSchema>;

/** Constrained customization options (kept tasteful + safe-to-inject). */
export const TEMPLATES = [
  "classic",
  "modern",
  "minimal",
  "compact",
  "sidebar",
  "editorial",
  "ats",
  "rirekisho",
  // Bolder, design-forward additions.
  "aurora",
  "slate",
  "timeline",
] as const;
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
   * How publication/preprint entries are ordered. "custom" keeps the built/
   * dragged order (newest-first by default); other values re-sort at render.
   */
  publicationOrder: z
    .enum(["custom", "citations", "year-desc", "year-asc"])
    .default("custom"),
  /**
   * "Selected publications": cap the Publications section to the top N entries
   * (after ordering + the peer-reviewed-only filter), for a grant biosketch /
   * 2-page CV. 0 or undefined = show all. Other sections are unaffected.
   */
  publicationsLimit: z.number().int().min(0).max(500).optional(),
  /**
   * True once the user has manually reordered sections (drag or ↑/↓). Until
   * then the build applies the canonical default order (Positions → Education →
   * Publications → …); afterwards the user's arrangement is preserved on re-sync.
   */
  sectionsCustomized: z.boolean().default(false),
  /** Show the authorship-position summary table (counts of first/last/…). Default off. */
  showAuthorshipTable: z.boolean().default(false),
  /** Which authorship roles to include in that table (subset of AUTHORSHIP_ROLES). */
  authorshipRoles: z.array(z.string()).default([]),
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
  id: z.string(),
  owner: CvOwnerSchema,
  display: DisplayChoicesSchema,
  sections: z.array(CvSectionSchema),
  /** Saved named view-presets (optional; back-compat: old docs have none). */
  presets: z.array(CvPresetSchema).max(20).default([]),
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
