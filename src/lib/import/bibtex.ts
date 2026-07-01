import { parse as parseBibtexRaw } from "astrocite-bibtex";
import { CslItemSchema, type CslItem } from "@/types/csl";
import { addClaimedWork, cvHasWork } from "@/lib/canonical/curate";
import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";

/**
 * Import a user-uploaded BibTeX (`.bib`) library into a canonical CV.
 *
 * The on-ramp for researchers who already keep a clean bibliography (Zotero /
 * Mendeley / JabRef exports): bring the whole list in, then get the funder
 * templates, styling, and living page on top. Parsing is delegated to
 * `astrocite-bibtex` (BibTeX → CSL-JSON); we normalize its loose output into the
 * strict `CslItemSchema` and wrap each entry as a **user-asserted** CvItem — the
 * same "claimed" ownership semantics as a DOI claim (the user is importing THEIR
 * OWN publications). Ownership is asserted, never name-matched: we don't resolve
 * the entries against OpenAlex, so no author name is highlighted (identifier-only
 * highlighting invariant preserved).
 *
 * Pure of the database: the route loads the CV, calls this, and persists.
 */
export interface BibtexImportOutcome {
  cv: CanonicalCv;
  /** Entries the parser produced. */
  parsed: number;
  /** New works appended. */
  added: number;
  /** Skipped because the work is already in the CV (matched by DOI or id). */
  duplicates: number;
  /** Dropped: an unparseable chunk, or an entry with no usable title. */
  skipped: number;
}

// CSL string fields we accept into the strict schema (a whitelist — CslItemSchema
// is `.strict()`, so any un-listed key from the parser would fail validation).
const CSL_STRING_FIELDS = [
  "title",
  "container-title",
  "collection-title",
  "publisher",
  "publisher-place",
  "volume",
  "issue",
  "page",
  "number",
  "DOI",
  "URL",
  "ISBN",
  "abstract",
  "language",
] as const;

const CSL_NAME_FIELDS = [
  "family",
  "given",
  "literal",
  "suffix",
  "dropping-particle",
  "non-dropping-particle",
] as const;

// Container names that indicate a preprint (routes to Preprints, not Publications).
const PREPRINT_VENUE_RE =
  /\b(arxiv|biorxiv|medrxiv|chemrxiv|techrxiv|psyarxiv|ssrn|preprint|research\s*square|osf|zenodo)\b/i;

/** Strip a DOI down to its bare, lowercased form (no scheme/host). */
function bareDoi(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const d = value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, "");
  return d || undefined;
}

/** astrocite emits `{ "date-parts": [["2023", "", ""]] }` — string year with empty
 *  month/day slots. Clean to a numeric year (dropping empty/invalid parts). */
function normalizeIssued(raw: unknown): CslItem["issued"] | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const dp = (raw as { "date-parts"?: unknown })["date-parts"];
  if (!Array.isArray(dp) || !Array.isArray(dp[0])) return undefined;
  const parts = dp[0]
    .map((p) => (typeof p === "number" ? p : parseInt(String(p), 10)))
    .filter((n): n is number => Number.isFinite(n) && n > 0);
  return parts.length ? { "date-parts": [parts] } : undefined;
}

/** Map a parser name list to CSL name objects (keeping only known name keys). */
function toNames(raw: unknown): CslItem["author"] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const names: Record<string, string>[] = [];
  for (const n of raw) {
    if (!n || typeof n !== "object") continue;
    const o = n as Record<string, unknown>;
    const name: Record<string, string> = {};
    for (const k of CSL_NAME_FIELDS) {
      const v = o[k];
      if (typeof v === "string" && v.trim()) name[k] = v.trim();
    }
    if (Object.keys(name).length) names.push(name);
  }
  return names.length ? names : undefined;
}

/** Normalize the parser's loose CSL into our strict CslItem, or null when it has
 *  no usable title. `id` is assigned by the caller (stable + unique). */
function toCslItem(raw: Record<string, unknown>, id: string): CslItem | null {
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!title) return null; // a citation with no title is unusable in a CV

  const out: Record<string, unknown> = { id, title };

  // astrocite maps @article → "article"; a journal article is "article-journal"
  // in CSL. Keep any other type as-is; default unknown/empty to a journal article.
  const rawType = typeof raw.type === "string" && raw.type ? raw.type : "article";
  out.type = rawType === "article" ? "article-journal" : rawType;

  for (const f of CSL_STRING_FIELDS) {
    if (f === "title") continue;
    const v = raw[f];
    if (typeof v === "string" && v.trim()) out[f] = v.trim();
  }

  // astrocite emits ISSN as a plain string (never an array), so only strings are
  // handled — an array branch here would be dead code.
  const issn = raw.ISSN;
  if (typeof issn === "string" && issn.trim()) out.ISSN = issn.trim();

  const author = toNames(raw.author);
  if (author) out.author = author;
  const editor = toNames(raw.editor);
  if (editor) out.editor = editor;

  const issued = normalizeIssued(raw.issued);
  if (issued) out.issued = issued;

  const parsed = CslItemSchema.safeParse(out);
  return parsed.success ? parsed.data : null;
}

/** The first (year) date-part as a number, or undefined. */
function firstYear(issued: CslItem["issued"]): number | undefined {
  const y = issued?.["date-parts"]?.[0]?.[0];
  return typeof y === "number" ? y : undefined;
}

/** Wrap a normalized CSL item as a user-asserted ("claimed") CvItem. */
function toCvItem(csl: CslItem): CvItem {
  const doi = bareDoi(csl.DOI);
  return {
    id: csl.id,
    source: "bibtex",
    sourceId: doi ? `https://doi.org/${doi}` : `bibtex:${csl.id}`,
    csl,
    included: true,
    notMine: false,
    order: 0,
    // The user uploaded their OWN bibliography → ownership is asserted (like a DOI
    // claim). We never resolve authorship by identifier here, so no name is bolded
    // (selfNameVariants stays empty) — never a name-string match.
    authoredBySelf: true,
    selfNameVariants: [],
    meta: {
      year: firstYear(csl.issued),
      type: csl.type,
      doi,
      claimed: true,
      matchBasis: "claimed",
    },
  };
}

/** Whether an entry belongs in Preprints (by its container/venue name). */
function isPreprintCsl(csl: CslItem): boolean {
  return PREPRINT_VENUE_RE.test(csl["container-title"] ?? "");
}

/**
 * Split a `.bib` string into top-level `@type{…}` blocks by brace matching, so a
 * single malformed entry doesn't sink the whole file. Used only as a fallback
 * when the fast whole-file parse throws.
 */
function splitBibtexEntries(content: string): string[] {
  const entries: string[] = [];
  const re = /@\w+\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content))) {
    const start = m.index;
    let i = start + m[0].length - 1; // index of the opening '{'
    let depth = 0;
    for (; i < content.length; i++) {
      const c = content[i];
      if (c === "{") depth++;
      else if (c === "}" && --depth === 0) {
        i++;
        break;
      }
    }
    entries.push(content.slice(start, i));
    re.lastIndex = i;
  }
  return entries;
}

/** Parse a `.bib` string to raw CSL objects, resilient to a single bad entry. */
function parseEntries(content: string): { items: unknown[]; skipped: number } {
  // Fast path: the whole file at once (resolves @string macros correctly).
  try {
    return { items: parseBibtexRaw(content), skipped: 0 };
  } catch {
    // A single malformed entry fails the grammar for the whole input. Fall back to
    // per-entry parsing so the rest still imports (loses @string macro resolution,
    // which exported .bib files rarely use).
  }
  const items: unknown[] = [];
  let skipped = 0;
  for (const chunk of splitBibtexEntries(content)) {
    try {
      items.push(...parseBibtexRaw(chunk));
    } catch {
      skipped++;
    }
  }
  return { items, skipped };
}

/** A stable, unique id for an entry — from its DOI when present, else its cite key. */
function uniqueId(rec: Record<string, unknown>, seen: Set<string>): string {
  const doi = bareDoi(rec.DOI);
  const key = typeof rec.id === "string" && rec.id.trim() ? rec.id.trim() : "entry";
  const base = doi ? `bibtex:doi:${doi}` : `bibtex:key:${key}`;
  let id = base;
  let n = 2;
  while (seen.has(id)) id = `${base}-${n++}`;
  seen.add(id);
  return id;
}

/**
 * Parse `content` and merge every new work into `cv` (deduping by DOI/id against
 * what's already there, appending to Publications or Preprints). Immutable —
 * returns a new CV plus a summary of what happened.
 */
export function importBibtexIntoCv(cv: CanonicalCv, content: string): BibtexImportOutcome {
  const { items: raw, skipped: parseSkipped } = parseEntries(content);
  const seenIds = new Set<string>();
  let working = cv;
  let added = 0;
  let duplicates = 0;
  let unusable = 0;

  for (const entry of raw) {
    /* v8 ignore next 4 -- defensive: astrocite always yields objects, never null/primitives */
    if (!entry || typeof entry !== "object") {
      unusable++;
      continue;
    }
    const rec = entry as Record<string, unknown>;
    const csl = toCslItem(rec, uniqueId(rec, seenIds));
    if (!csl) {
      unusable++;
      continue;
    }
    if (cvHasWork(working, { id: csl.id, doi: bareDoi(csl.DOI) })) {
      duplicates++;
      continue;
    }
    working = addClaimedWork(working, toCvItem(csl), isPreprintCsl(csl));
    added++;
  }

  return {
    cv: working,
    parsed: raw.length,
    added,
    duplicates,
    skipped: parseSkipped + unusable,
  };
}
