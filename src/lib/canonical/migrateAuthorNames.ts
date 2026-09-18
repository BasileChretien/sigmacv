import { repeatedRunTwins } from "@/lib/text/authorRuns";
import { cleanCslName, cleanPersonName, personNameKey } from "@/lib/text/personName";
import type { CslName } from "@/types/csl";

/**
 * Read-time repair of the author names a STORED CV holds, run on every read from
 * `migrateCanonicalDocument` (before validation), like `migrateSoftwareSection`.
 *
 * New syncs get clean names at the source (`openalex/authorNames.ts`, `toCslName`),
 * but a DOI-claimed work and an ORCID-discovered candidate are CARRIED across a
 * re-sync, never rebuilt (`isCarriableUserItem` in build.ts), so a name stored as
 * "Basile ChréTien" would stay that way for good; and a work that IS rebuilt keeps
 * its stored names until its next sync. So, on every item:
 *  - each CSL author / editor name is cleaned (`cleanCslName`: casing, encoding,
 *    U+FFFD, spacing), and so are the stored self-name variants the highlighter
 *    matches with;
 *  - an author list deposited twice is collapsed (`text/authorRuns.ts`), with
 *    `meta.authorPosition` moved to the owner's new place (onto the kept twin when
 *    the owner sat in the dropped copy) and `meta.authorCount` reduced by what went.
 *
 * What CANNOT be fixed here is a name in the wrong script: the printed byline is
 * not stored, so that heals on the work's next sync. Works on the RAW document,
 * defensively; IDEMPOTENT and IDENTITY-PRESERVING — a clean document comes back
 * as the very same object.
 */

type Rec = Record<string, unknown>;

function isRecord(v: unknown): v is Rec {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** The list with every name object cleaned; the very same array when none changed. */
function cleanNames(list: unknown[]): unknown[] {
  let changed = false;
  const out = list.map((n) => {
    if (!isRecord(n)) return n;
    const cleaned = cleanCslName(n as CslName);
    if (cleaned !== n) changed = true;
    return cleaned;
  });
  return changed ? out : list;
}

function cleanStrings(list: unknown[]): unknown[] {
  let changed = false;
  const out = list.map((s) => {
    if (typeof s !== "string") return s;
    const cleaned = cleanPersonName(s);
    if (cleaned !== s) changed = true;
    return cleaned;
  });
  return changed ? out : list;
}

const KEY_PARTS = ["given", "dropping-particle", "non-dropping-particle", "family", "suffix"];

function nameText(n: unknown): string {
  if (!isRecord(n)) return "";
  if (typeof n.literal === "string" && n.literal.trim()) return n.literal;
  return KEY_PARTS.map((p) => (typeof n[p] === "string" ? n[p] : "")).join(" ");
}

/**
 * Whether some name is stored twice, verbatim. The copies of a deposited-twice
 * byline come out of the same pipeline, so a run always holds such a pair; a list
 * without one (nearly every list) skips the folded keys, which matters because
 * this runs on every read of every CV.
 */
function hasVerbatimRepeat(names: readonly unknown[]): boolean {
  const seen = new Set<string>();
  for (const n of names) {
    const text = nameText(n);
    if (!text.trim()) continue;
    if (seen.has(text)) return true;
    seen.add(text);
  }
  return false;
}

function repeatedNames(names: readonly unknown[]): Map<number, number> {
  return hasVerbatimRepeat(names)
    ? repeatedRunTwins(names.map((n) => personNameKey(nameText(n))))
    : new Map<number, number>();
}

/** `meta` with the owner's position and the author count moved in step with the
 *  dropped names; the very same object when neither is recorded. */
function shiftMeta(meta: Rec, twins: ReadonlyMap<number, number>): Rec {
  const next: Rec = { ...meta };
  let changed = false;
  const position = meta.authorPosition;
  if (typeof position === "number" && Number.isInteger(position) && position >= 1) {
    const index = twins.get(position - 1) ?? position - 1;
    const droppedBefore = [...twins.keys()].filter((d) => d < index).length;
    next.authorPosition = index - droppedBefore + 1;
    changed = next.authorPosition !== position;
  }
  if (typeof meta.authorCount === "number") {
    next.authorCount = Math.max(0, meta.authorCount - twins.size);
    changed = true;
  }
  return changed ? next : meta;
}

function repairItem(item: unknown): unknown {
  if (!isRecord(item) || !isRecord(item.csl)) return item;
  const csl = item.csl;
  const author = Array.isArray(csl.author) ? cleanNames(csl.author) : csl.author;
  const editor = Array.isArray(csl.editor) ? cleanNames(csl.editor) : csl.editor;
  const variants = Array.isArray(item.selfNameVariants)
    ? cleanStrings(item.selfNameVariants)
    : item.selfNameVariants;
  const twins = Array.isArray(author) ? repeatedNames(author) : new Map<number, number>();
  if (
    author === csl.author &&
    editor === csl.editor &&
    variants === item.selfNameVariants &&
    twins.size === 0
  ) {
    return item;
  }
  const deduped =
    Array.isArray(author) && twins.size ? author.filter((_, i) => !twins.has(i)) : author;
  const nextCsl: Rec = { ...csl };
  if (deduped !== csl.author) nextCsl.author = deduped;
  if (editor !== csl.editor) nextCsl.editor = editor;
  const next: Rec = { ...item, csl: nextCsl };
  if (variants !== item.selfNameVariants) next.selfNameVariants = variants;
  if (twins.size && isRecord(item.meta)) next.meta = shiftMeta(item.meta, twins);
  return next;
}

/** The document with every stored author name repaired (see module doc). */
export function migrateAuthorNames(input: unknown): unknown {
  if (!isRecord(input) || !Array.isArray(input.sections)) return input;
  let changed = false;
  const sections = input.sections.map((section) => {
    if (!isRecord(section) || !Array.isArray(section.items)) return section;
    const items = section.items.map(repairItem);
    if (items.every((it, i) => it === (section.items as unknown[])[i])) return section;
    changed = true;
    return { ...section, items };
  });
  return changed ? { ...input, sections } : input;
}
