import type { CslItem, CslName } from "@/types/csl";
import { stripInlineMarkup } from "@/lib/text/markup";

/**
 * RIS export of CSL items — the format EndNote / RefWorks / Mendeley / Zotero all
 * import. Built straight from the canonical CSL items (the same data citeproc and
 * the BibTeX export use), so it always matches the CV. Pure.
 *
 * RIS is a line-oriented `XX  - value` format (two-letter tag, two spaces, hyphen,
 * space), each record opened by `TY` and closed by `ER`, CRLF-delimited per the
 * de-facto spec. Field values are flattened to one physical line.
 */

const RIS_TYPE: Record<string, string> = {
  "article-journal": "JOUR",
  article: "JOUR",
  "paper-conference": "CPAPER",
  book: "BOOK",
  chapter: "CHAP",
  thesis: "THES",
  report: "RPRT",
  dataset: "DATA",
  software: "COMP",
  webpage: "ELEC",
  "posted-content": "GEN",
  preprint: "GEN",
};

function risType(csl: CslItem): string {
  return RIS_TYPE[(csl.type ?? "").toLowerCase()] ?? "GEN";
}

function nameToRis(n: CslName): string {
  if (n.literal) return n.literal;
  const family = n.family ?? "";
  const given = n.given ?? "";
  if (family && given) return `${family}, ${given}`;
  return family || given;
}

function yearOf(csl: CslItem): string {
  const y = csl.issued?.["date-parts"]?.[0]?.[0];
  return y != null ? String(y) : "";
}

/** Flatten a field value to a single physical line (RIS is line-oriented, so an
 *  embedded CR/LF would corrupt the record) and drop any inline markup. */
function clean(v: string): string {
  return stripInlineMarkup(v)
    .replace(/[\r\n]+/g, " ")
    .trim();
}

/** A `TAG  - value` line, or null when the value is empty (tag omitted). */
function line(tag: string, value: string): string | null {
  const v = clean(value);
  return v ? `${tag}  - ${v}` : null;
}

/** Convert one CSL item to a RIS record. Pure. */
export function cslToRis(csl: CslItem): string {
  const lines: (string | null)[] = [`TY  - ${risType(csl)}`];
  for (const a of csl.author ?? []) {
    const au = nameToRis(a);
    if (au) lines.push(`AU  - ${clean(au)}`);
  }
  lines.push(line("TI", csl.title ?? ""));
  lines.push(line("T2", csl["container-title"] ?? ""));
  lines.push(line("PY", yearOf(csl)));
  lines.push(line("VL", csl.volume ?? ""));
  lines.push(line("IS", csl.issue ?? ""));
  // Pages: split a "start-end" range into SP/EP; a single page goes to SP.
  const page = csl.page ?? "";
  const mp = /^\s*([^\s–-]+)\s*[–-]\s*([^\s–-]+)\s*$/.exec(page);
  if (mp) {
    lines.push(`SP  - ${clean(mp[1]!)}`);
    lines.push(`EP  - ${clean(mp[2]!)}`);
  } else if (page.trim()) {
    lines.push(line("SP", page));
  }
  lines.push(line("DO", csl.DOI ?? ""));
  lines.push(line("UR", csl.URL ?? ""));
  const issn = Array.isArray(csl.ISSN) ? csl.ISSN[0] : csl.ISSN;
  lines.push(line("SN", issn ?? ""));
  lines.push(line("AB", csl.abstract ?? ""));
  lines.push(line("LA", csl.language ?? ""));
  lines.push("ER  - ");
  return lines.filter((l): l is string => l !== null).join("\r\n") + "\r\n";
}

/** Convert a list of CSL items to a RIS document (records separated by a blank
 *  line). Pure; exposed for direct testing. */
export function cslItemsToRis(items: CslItem[]): string {
  return items.map(cslToRis).join("\r\n");
}
