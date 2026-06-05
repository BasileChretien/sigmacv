import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";
import { visibleItems, visibleSections } from "@/lib/canonical/curate";
import type { CslItem, CslName } from "@/types/csl";
import { cvSlug } from "./slug";
import type { Renderer, RenderInput, RenderResult } from "./types";

/**
 * BibTeX export of the curated publications — importable into Zotero, Mendeley,
 * JabRef, BibDesk, etc. Built straight from the canonical CSL items (the same
 * data citeproc renders), so it always matches what's on the CV. Includes every
 * shown, owned reference (has CSL, included, not "not mine") across all sections
 * (publications, preprints, datasets…). UTF-8 is preserved; Zotero reads it.
 */

const TYPE_MAP: Record<string, string> = {
  "article-journal": "article",
  article: "article",
  "paper-conference": "inproceedings",
  book: "book",
  chapter: "incollection",
  thesis: "phdthesis",
  report: "techreport",
  dataset: "misc",
  software: "misc",
  webpage: "misc",
  "posted-content": "misc",
  preprint: "misc",
};

function bibType(csl: CslItem): string {
  return TYPE_MAP[(csl.type ?? "").toLowerCase()] ?? "misc";
}

/** Escape BibTeX/LaTeX special characters in a text field (UTF-8 preserved). */
function esc(s: string): string {
  return s.replace(/([&%$#_{}~^\\])/g, "\\$1");
}

function yearOf(csl: CslItem): string {
  const y = csl.issued?.["date-parts"]?.[0]?.[0];
  return y != null ? String(y) : "";
}

function nameToBib(n: CslName): string {
  if (n.literal) return `{${esc(n.literal)}}`;
  const family = esc(n.family ?? "");
  const given = esc(n.given ?? "");
  if (family && given) return `${family}, ${given}`;
  return family || given;
}

function authorsOf(csl: CslItem): string {
  return (csl.author ?? []).map(nameToBib).filter(Boolean).join(" and ");
}

function pagesOf(csl: CslItem): string {
  return (csl.page ?? "").replace(/\s*[–-]\s*/g, "--");
}

const STOP_WORDS = new Set(["the", "a", "an", "of", "on", "in", "and", "for", "to"]);

function titleWord(title: string): string {
  const words = title.toLowerCase().match(/[a-z0-9]+/g);
  if (!words) return "";
  return words.find((w) => !STOP_WORDS.has(w)) ?? words[0]!;
}

function citeKey(csl: CslItem): string {
  const first = csl.author?.[0];
  const fam = (first?.family ?? first?.literal ?? "anon")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
  return `${fam || "anon"}${yearOf(csl)}${titleWord(csl.title ?? "")}`;
}

/** A `name = {value}` line, or null when the value is empty (field omitted). */
function field(name: string, value: string, raw = false): string | null {
  if (!value) return null;
  return `  ${name} = {${raw ? value : esc(value)}}`;
}

/** A `name = {value}` line for URL/DOI fields: kept literal for clean import, but
 *  with braces + backslash stripped so a crafted value can't break out of the
 *  {…} and inject BibTeX/LaTeX. */
function urlField(name: string, value: string): string | null {
  if (!value) return null;
  const safe = value.replace(/[{}\\]/g, "");
  if (!safe) return null;
  return `  ${name} = {${safe}}`;
}
function cslToBibtex(csl: CslItem, key: string): string {
  const type = bibType(csl);
  const container = csl["container-title"] ?? "";
  const containerField =
    type === "inproceedings" || type === "incollection" ? "booktitle" : "journal";

  const lines: (string | null)[] = [
    field("author", authorsOf(csl), true), // already escaped per-name
    csl.title ? `  title = {{${esc(csl.title)}}}` : null, // double braces protect case
    field("year", yearOf(csl)),
    field(containerField, container),
    field("volume", csl.volume ?? ""),
    field("number", csl.issue ?? ""),
    field("pages", pagesOf(csl), true),
    field("publisher", csl.publisher ?? ""),
    urlField("doi", csl.DOI ?? ""), // sanitised so a crafted value can't break the braces
    urlField("url", csl.URL ?? ""),
  ];
  const body = lines.filter((l): l is string => l !== null).join(",\n");
  return `@${type}{${key},\n${body}\n}`;
}

/** Convert a list of CSL items to a BibTeX document (pure; cite keys made
 *  unique with a, b, … suffixes on collision). Exposed for direct testing. */
export function cslItemsToBibtex(items: CslItem[]): string {
  const usedKeys = new Map<string, number>();
  const entries = items.map((csl) => {
    const base = citeKey(csl);
    const n = usedKeys.get(base) ?? 0;
    usedKeys.set(base, n + 1);
    const key = n === 0 ? base : `${base}${String.fromCharCode(97 + n)}`; // a, b…
    return cslToBibtex(csl, key);
  });
  return entries.length ? `${entries.join("\n\n")}\n` : "";
}

export function renderCvBibtex(cv: CanonicalCv): string {
  // Every shown, owned reference with CSL data (canonical item ids are already
  // unique; colliding cite keys are suffixed by cslItemsToBibtex).
  const csls = visibleSections(cv)
    .flatMap((s) => visibleItems(s))
    .filter((i): i is CvItem & { csl: CslItem } => Boolean(i.csl) && !i.notMine)
    .map((i) => i.csl);
  return cslItemsToBibtex(csls);
}

export const bibtexRenderer: Renderer = {
  format: "bibtex",
  async render({ cv }: RenderInput): Promise<RenderResult> {
    return {
      format: "bibtex",
      mimeType: "application/x-bibtex; charset=utf-8",
      filename: `${cvSlug(cv.owner.displayName)}-publications.bib`,
      text: renderCvBibtex(cv),
    };
  },
};
