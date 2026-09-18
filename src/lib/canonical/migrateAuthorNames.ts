import { cleanCslName, cleanPersonName } from "@/lib/text/personName";
import type { CslName } from "@/types/csl";

/**
 * Read-time repair of the author names a STORED CV holds, run on every read from
 * `migrateCanonicalDocument` (before validation), like `migrateSoftwareSection`.
 *
 * New syncs get clean names at the source (`openalex/authorNames.ts`, `toCslName`),
 * but a DOI-claimed work and an ORCID-discovered candidate are CARRIED across a
 * re-sync, never rebuilt (`isCarriableUserItem` in build.ts), so a name stored as
 * "Basile ChréTien" would stay that way for good; and a work that IS rebuilt keeps
 * its stored names until its next sync. So each CSL author / editor name is
 * cleaned (`cleanCslName`: casing, encoding, U+FFFD, spacing), and so are the
 * stored self-name variants the highlighter matches with.
 *
 * Deliberately NOT done here: collapsing an author list deposited twice. The
 * stored names are OpenAlex PROFILE names, not the printed byline, and profiles
 * get merged — on the stored lists of large collaborations, different people
 * share a stored name and a collapse would drop real co-authors. Only a sync,
 * which compares the printed bylines and their ORCID iDs, collapses a byline.
 * A name in the wrong script is likewise fixed by the sync (the byline is not
 * stored).
 *
 * Works on the RAW document, defensively; IDEMPOTENT and IDENTITY-PRESERVING — a
 * clean document comes back as the very same object.
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

function repairItem(item: unknown): unknown {
  if (!isRecord(item) || !isRecord(item.csl)) return item;
  const csl = item.csl;
  const author = Array.isArray(csl.author) ? cleanNames(csl.author) : csl.author;
  const editor = Array.isArray(csl.editor) ? cleanNames(csl.editor) : csl.editor;
  const variants = Array.isArray(item.selfNameVariants)
    ? cleanStrings(item.selfNameVariants)
    : item.selfNameVariants;
  if (author === csl.author && editor === csl.editor && variants === item.selfNameVariants) {
    return item;
  }
  const nextCsl: Rec = { ...csl };
  if (author !== csl.author) nextCsl.author = author;
  if (editor !== csl.editor) nextCsl.editor = editor;
  const next: Rec = { ...item, csl: nextCsl };
  if (variants !== item.selfNameVariants) next.selfNameVariants = variants;
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
