import { orderedSections, visibleItems } from "./curate";
import { narrativeEvidenceSectionTypes } from "./narrativeEvidence";
import {
  isProseSectionType,
  itemDisplayText,
  itemEntryUrl,
  type CanonicalCv,
  type CvItem,
  type CvSection,
  type CvSectionType,
} from "./schema";
import { stripInlineMarkup } from "@/lib/text/markup";

/**
 * Evidence references inside a prose section body — what makes a narrative CV
 * VERIFIABLE. A funder-style narrative ("I established a new signal-detection
 * method …") is unverifiable prose on its own; R4RI / SNSF / NWO reviewers ask
 * for the evidence behind each claim. A body may therefore reference any entry
 * of the CV by writing its item id in a token:
 *
 *     … a method now used by three national centres [[W2741809807]].
 *
 * The body STAYS plain text with the tokens in it — the canonical object remains
 * the single source of truth and holds no HTML. Every renderer resolves the
 * tokens through THIS module (one parser, one resolver) so the same reference
 * renders as an anchor in HTML/PDF, a bookmark link in DOCX, a labelled
 * `\cvevidence…` macro in LaTeX and `[label](#item-…)` in Markdown.
 *
 * Resolution respects curation: a reference resolves ONLY to an entry that is
 * on the researcher's RECORD — included, not "not mine", not excluded from the
 * current view. Otherwise it is UNRESOLVED: the evidence was removed, so the
 * claim must not link to it. Exports drop an unresolved token silently (never
 * show it raw); the editor + CV-health panel surface it.
 *
 * Whether the entry's SECTION is on the page is a separate question. A narrative
 * layout such as the FRQ CV descriptif hides every list and keeps only the prose,
 * yet its whole point is to cite one's own works from that prose. So a resolved
 * reference is either LISTED (its entry is printed by this render, so the
 * reference links to the entry on the page) or not (the entry is on the record
 * but not on the page, so the reference prints the entry's short label and, when
 * the entry has one, links to its DOI or landing page instead). Both are
 * checkable by a reviewer; only an entry the researcher removed is not.
 */

/** Max reference tokens honoured per body (the rest resolve as unresolved). */
export const EVIDENCE_REF_MAX = 50;
/** Max characters of a title-based reference label (then "…"). */
const EVIDENCE_LABEL_MAX = 60;

// `[[<id>]]` or `[[<id> | <label>]]` — an id is any run without brackets, pipes or
// newlines (item ids are `W…`, `position:orcid:…`, `dataset:datacite:10-…`, … —
// never brackets or pipes). The optional label after the pipe is for the person
// writing: it makes the marker readable in the text box ("Chrétien 2022" rather
// than an opaque id). Only the id is authoritative; every export prints the
// entry's own short reference, never the label. Bounded to the schema's id cap so
// a pathological body can't back-track.
const TOKEN_RE = /\[\[([^[\]\n]{1,1024})\]\]/g;
/** Max characters of the readable label a token may carry. */
export const EVIDENCE_TOKEN_LABEL_MAX = 60;

export type EvidenceSegment = { kind: "text"; text: string } | { kind: "ref"; id: string };

/**
 * Split a body into text runs and reference tokens. Purely syntactic (no CV
 * needed). A token with a blank id (`[[ ]]`) is ordinary text; a nested / unclosed
 * bracket run (`[[[W1]]]`, `[[W1`) yields the innermost well-formed token and
 * leaves the stray brackets as text.
 */
export function parseEvidenceRefs(body: string): EvidenceSegment[] {
  const out: EvidenceSegment[] = [];
  let last = 0;
  for (const m of body.matchAll(TOKEN_RE)) {
    // The id is what comes before the first pipe; a readable label may follow it.
    const id = m[1]!.split("|")[0]!.trim();
    if (!id) continue; // `[[  ]]` / `[[ | label ]]` is not a reference — leave it in the text run
    const at = m.index!;
    if (at > last) out.push({ kind: "text", text: body.slice(last, at) });
    out.push({ kind: "ref", id });
    last = at + m[0].length;
  }
  if (last < body.length) out.push({ kind: "text", text: body.slice(last) });
  return out;
}

/**
 * The token the editor inserts for an entry: `[[<id> | <label>]]`, the label being
 * the entry's short reference ("Chrétien et al. 2022") so the marker reads in the
 * text box. The label is cleaned of the characters that would break the token
 * (brackets, pipes, line breaks) and capped; an empty label yields the bare `[[id]]`.
 */
export function evidenceToken(id: string, label?: string): string {
  const clean = (label ?? "")
    .replace(/[[\]|\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, EVIDENCE_TOKEN_LABEL_MAX)
    .trim();
  return clean ? `[[${id} | ${clean}]]` : `[[${id}]]`;
}

/** The distinct referenced ids of a body, in order of first appearance, capped. */
export function evidenceRefIds(body: string): string[] {
  const ids: string[] = [];
  for (const seg of parseEvidenceRefs(body)) {
    if (seg.kind !== "ref" || ids.includes(seg.id)) continue;
    if (ids.length >= EVIDENCE_REF_MAX) break;
    ids.push(seg.id);
  }
  return ids;
}

export type ResolvedEvidenceSegment =
  | { kind: "text"; text: string }
  | {
      kind: "ref";
      id: string;
      resolved: true;
      item: CvItem;
      section: CvSection;
      label: string;
      /** The entry is printed by this render (see `EvidenceResolveOptions.listedIds`),
       *  so the reference can link to it on the page. */
      listed: boolean;
      /** The entry's own link (DOI or landing page) for a reference whose entry is
       *  not on the page; undefined when the entry carries none. Unvalidated —
       *  renderers pass it through `safeHref`. */
      url?: string;
    }
  | { kind: "ref"; id: string; resolved: false };

export interface EvidenceResolveOptions {
  /**
   * The ids a renderer actually lists (after its own selection — per-view
   * exclusions, the "Selected publications" cap, peer-reviewed-only …). A
   * resolved reference is `listed` only when its id is in this set, so an export
   * never links to an anchor it did not emit; a reference to an entry on the
   * record but off the page still resolves, and prints the label instead.
   * Omitted (the editor): every resolved reference counts as listed.
   */
  listedIds?: ReadonlySet<string>;
}

/**
 * id → (item, section) for every entry on the researcher's RECORD: the included,
 * not-"not mine", not view-excluded items of every list section, whether or not
 * that section is shown by the current layout (a hidden section is off the page,
 * not off the record — see the module note).
 */
function evidenceIndex(cv: CanonicalCv): Map<string, { item: CvItem; section: CvSection }> {
  const index = new Map<string, { item: CvItem; section: CvSection }>();
  for (const section of orderedSections(cv)) {
    if (isProseSectionType(section.type)) continue;
    const excluded = new Set(cv.display.excludedItems?.[section.id] ?? []);
    for (const item of visibleItems(section)) {
      if (excluded.has(item.id)) continue;
      index.set(item.id, { item, section });
    }
  }
  return index;
}

/**
 * The link a reference prints when its entry is not on the page: the entry's own
 * link (ORCID's URL for the record, or the owner's edit of it), else its DOI.
 * A bare DOI ("10.…") becomes a doi.org URL; a DOI already stored as a URL is
 * kept. Unvalidated here — the renderers pass it through `safeHref`.
 */
export function evidenceUrl(item: CvItem): string | undefined {
  const own = itemEntryUrl(item)?.trim();
  if (own) return own;
  const doi = item.meta.doi?.trim().replace(/^doi:\s*/i, "");
  if (!doi) return undefined;
  return /^https?:\/\//i.test(doi) ? doi : `https://doi.org/${doi}`;
}

/**
 * A resolver bound to one CV — build it once per render and call it per prose
 * section, so the id index is computed once rather than per body.
 */
export function evidenceResolver(
  cv: CanonicalCv,
  opts?: EvidenceResolveOptions,
): (body: string) => ResolvedEvidenceSegment[] {
  const index = evidenceIndex(cv);
  const listedIds = opts?.listedIds;
  return (body) => {
    let seen = 0;
    const segments = parseEvidenceRefs(body).map((seg): ResolvedEvidenceSegment => {
      if (seg.kind === "text") return seg;
      seen += 1;
      const hit = seen <= EVIDENCE_REF_MAX ? index.get(seg.id) : undefined;
      if (!hit) return { kind: "ref", id: seg.id, resolved: false };
      return {
        kind: "ref",
        id: seg.id,
        resolved: true,
        ...hit,
        label: evidenceRefLabel(hit.item),
        listed: !listedIds || listedIds.has(seg.id),
        url: evidenceUrl(hit.item),
      };
    });
    return compactUnresolved(segments);
  };
}

/** Resolve one body against the CV (see {@link evidenceResolver}). */
export function resolveEvidenceRefs(
  cv: CanonicalCv,
  body: string,
  opts?: EvidenceResolveOptions,
): ResolvedEvidenceSegment[] {
  return evidenceResolver(cv, opts)(body);
}

/**
 * When an unresolved token is dropped, "claim [[gone]]." would leave "claim ."
 * — so the space that introduced the token is dropped too when what follows is
 * punctuation or more whitespace. Text-only adjustment; the token itself stays
 * in the segment list (renderers and the health count still see it).
 */
function compactUnresolved(segments: ResolvedEvidenceSegment[]): ResolvedEvidenceSegment[] {
  return segments.map((seg, i) => {
    if (seg.kind !== "text" || !seg.text.endsWith(" ")) return seg;
    const next = segments[i + 1];
    if (!next || next.kind !== "ref" || next.resolved) return seg;
    const after = segments[i + 2];
    const followedByBreak = !after || (after.kind === "text" && /^[\s.,;:!?)\]]/.test(after.text));
    return followedByBreak ? { kind: "text", text: seg.text.replace(/ +$/, "") } : seg;
  });
}

function truncate(s: string): string {
  return s.length > EVIDENCE_LABEL_MAX ? `${s.slice(0, EVIDENCE_LABEL_MAX - 1).trimEnd()}…` : s;
}

/**
 * The short label a resolved reference renders as: "Smith et al. 2021" for a
 * citation entry (first author + year; the corrected year when the owner set one),
 * else the entry's title / display line truncated to ~60 chars, else the id.
 */
export function evidenceRefLabel(item: CvItem): string {
  const csl = item.csl;
  if (csl) {
    const first = csl.author?.[0];
    const family = (first?.family ?? first?.literal ?? "").trim();
    const rawYear =
      item.meta.yearOverride ?? item.meta.year ?? csl.issued?.["date-parts"]?.[0]?.[0];
    const year = rawYear == null ? "" : String(rawYear);
    if (family) {
      const etAl = (csl.author?.length ?? 0) > 1 ? " et al." : "";
      return year ? `${family}${etAl} ${year}` : `${family}${etAl}`;
    }
    const title = csl.title ? stripInlineMarkup(csl.title).trim() : "";
    if (title) return truncate(title);
  }
  const text = itemDisplayText(item)?.trim();
  return text ? truncate(text) : item.id;
}

export interface EvidenceRefCounts {
  /** Distinct entries the body links to (resolved). */
  linked: number;
  /** Reference tokens that no longer point to an entry on the CV. */
  unresolved: number;
}

/** Linked / unresolved counts for a body — the editor summary + CV health. */
export function evidenceRefCounts(cv: CanonicalCv, body: string): EvidenceRefCounts {
  const linked = new Set<string>();
  let unresolved = 0;
  for (const seg of resolveEvidenceRefs(cv, body)) {
    if (seg.kind !== "ref") continue;
    if (seg.resolved) linked.add(seg.id);
    else unresolved += 1;
  }
  return { linked: linked.size, unresolved };
}

export interface EvidenceCandidate {
  id: string;
  /** The label the reference will render as. */
  label: string;
  /** The entry's title / display line (search + display). */
  title: string;
  sectionType: CvSectionType;
  sectionTitle: string;
  /** From a section that supports this module (publications for "knowledge", …);
   *  those come first, the rest of the record after them. */
  relevant: boolean;
}

/**
 * The entries the editor's "Cite one of my entries" picker offers for a prose
 * section: every entry on the record (see `evidenceIndex` — a section the layout
 * hides is still there to cite), the ones from the sections that support this
 * module first (publications / datasets for "contributions to knowledge",
 * supervision / teaching for "individuals", …), then everything else. A free
 * statement has no preferred sections: everything is relevant. A picked reference
 * always resolves.
 */
export function evidenceCandidates(cv: CanonicalCv, type: CvSectionType): EvidenceCandidate[] {
  const preferred = narrativeEvidenceSectionTypes(type);
  const first: EvidenceCandidate[] = [];
  const rest: EvidenceCandidate[] = [];
  for (const { item, section } of evidenceIndex(cv).values()) {
    const relevant = !preferred || preferred.includes(section.type);
    const raw = item.displayTextOverride ?? item.csl?.title ?? item.displayText ?? item.id;
    (relevant ? first : rest).push({
      id: item.id,
      label: evidenceRefLabel(item),
      title: stripInlineMarkup(raw).trim() || item.id,
      sectionType: section.type,
      sectionTitle: section.title,
      relevant,
    });
  }
  return [...first, ...rest];
}
