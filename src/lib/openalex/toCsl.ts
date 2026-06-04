import type { CslItem, CslName, CslDate } from "@/types/csl";
import { shortId, type OpenAlexWork } from "./types";

/**
 * Map an OpenAlex work type → CSL type. OpenAlex `type` (and the more granular
 * `type_crossref`) feed this; unknown values fall back to a journal article.
 */
const TYPE_MAP: Record<string, string> = {
  // OpenAlex `type`
  article: "article-journal",
  "book-chapter": "chapter",
  book: "book",
  dataset: "dataset",
  dissertation: "thesis",
  preprint: "article",
  "posted-content": "article",
  report: "report",
  "reference-entry": "entry",
  "peer-review": "review",
  paratext: "article",
  editorial: "article-journal",
  letter: "article-journal",
  review: "article-journal",
  // Crossref types (type_crossref)
  "journal-article": "article-journal",
  "proceedings-article": "paper-conference",
  "book-section": "chapter",
};

function mapType(work: OpenAlexWork): string {
  const crossref = work.type_crossref?.toLowerCase();
  const oa = work.type?.toLowerCase();
  return (
    (crossref && TYPE_MAP[crossref]) ||
    (oa && TYPE_MAP[oa]) ||
    "article-journal"
  );
}

/**
 * Han / Hiragana / Katakana / Hangul ranges:
 *   U+1100–11FF  Hangul Jamo          U+3040–30FF  Hiragana + Katakana
 *   U+3130–318F  Hangul Compat Jamo   U+3400–4DBF  CJK Ext-A
 *   U+4E00–9FFF  CJK Unified          U+AC00–D7AF  Hangul Syllables
 *   U+F900–FAFF  CJK Compat Ideographs
 * Names in these scripts are written family-name-first and must NOT be run
 * through the Western "Given Family" splitter (which would treat the last
 * token as the family name and let a CSL style abbreviate the rest).
 */
const CJK_RE =
  /[\u1100-\u11FF\u3040-\u30FF\u3130-\u318F\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF]/;

/** True when the text contains any CJK (Chinese/Japanese/Korean) character. */
export function hasCjk(text: string): boolean {
  return CJK_RE.test(text);
}

/**
 * Heuristic name splitter: OpenAlex gives a single `display_name` rather than
 * structured given/family parts. We treat the last whitespace-separated token
 * as the family name and the rest as given. Single-token names (often
 * organizations) become a `literal`. Documented limitation — refine later.
 *
 * CJK names are the exception: they're family-first and would be reordered or
 * abbreviated by the Western split, so we preserve them whole as a CSL
 * `literal` (citeproc renders a literal verbatim, in its original order).
 */
export function toCslName(raw: string | undefined | null): CslName {
  const name = (raw ?? "").trim();
  if (!name) return { literal: "" };

  // CJK (family-first): keep verbatim so the order and full name are preserved.
  if (CJK_RE.test(name)) return { literal: name };

  // Already in "Family, Given" form (common for non-ORCID OpenAlex authors).
  const comma = name.indexOf(",");
  if (comma > 0) {
    const family = name.slice(0, comma).trim();
    const given = name.slice(comma + 1).trim();
    return given ? { family, given } : { family };
  }

  const parts = name.split(/\s+/);
  if (parts.length === 1) return { literal: name };
  const family = parts[parts.length - 1]!;
  const given = parts.slice(0, -1).join(" ");
  return { family, given };
}

function toIssued(work: OpenAlexWork): CslDate | undefined {
  if (work.publication_date) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(work.publication_date);
    if (m) {
      return { "date-parts": [[Number(m[1]), Number(m[2]), Number(m[3])]] };
    }
  }
  if (typeof work.publication_year === "number") {
    return { "date-parts": [[work.publication_year]] };
  }
  return undefined;
}

/** "https://doi.org/10.1/abc" → "10.1/abc". */
function bareDoi(doi: string | undefined | null): string | undefined {
  if (!doi) return undefined;
  return doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
}

function pageRange(work: OpenAlexWork): string | undefined {
  const b = work.biblio;
  if (!b?.first_page) return undefined;
  return b.last_page ? `${b.first_page}-${b.last_page}` : b.first_page;
}

/**
 * Convert an OpenAlex work into a CSL-JSON item suitable for citeproc-js.
 * Pure and deterministic — the `id` is the stable OpenAlex short id.
 */
export function workToCsl(work: OpenAlexWork): CslItem {
  const id = shortId(work.id);
  const authors = (work.authorships ?? [])
    .map((a) => toCslName(a.author?.display_name ?? a.raw_author_name))
    .filter((n) => n.literal !== "" || n.family || n.given);

  const source = work.primary_location?.source ?? undefined;
  const doi = bareDoi(work.doi ?? work.ids?.doi);

  const item: CslItem = {
    id,
    type: mapType(work),
    title: work.title ?? work.display_name ?? "Untitled",
  };

  if (authors.length) item.author = authors;
  const issued = toIssued(work);
  if (issued) item.issued = issued;
  if (source?.display_name) item["container-title"] = source.display_name;
  if (work.biblio?.volume) item.volume = work.biblio.volume;
  if (work.biblio?.issue) item.issue = work.biblio.issue;
  const page = pageRange(work);
  if (page) item.page = page;
  if (doi) {
    item.DOI = doi;
    item.URL = `https://doi.org/${doi}`;
  } else if (work.id) {
    item.URL = work.id;
  }
  if (source?.issn_l) item.ISSN = source.issn_l;
  if (work.language) item.language = work.language;

  return item;
}
