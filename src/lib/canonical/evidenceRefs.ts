import { visibleItems, visibleSections } from "./curate";
import { narrativeEvidenceSectionTypes } from "./narrativeEvidence";
import {
  isProseSectionType,
  itemDisplayText,
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
 * actually on the rendered CV — in a visible section, not hidden, not "not mine",
 * not excluded from the current view. Otherwise it is UNRESOLVED: the evidence
 * was removed, so the claim must not link to it. Exports drop an unresolved
 * token silently (never show it raw); the editor + CV-health panel surface it.
 */

/** Max reference tokens honoured per body (the rest resolve as unresolved). */
export const EVIDENCE_REF_MAX = 50;
/** Max characters of a title-based reference label (then "…"). */
const EVIDENCE_LABEL_MAX = 60;

// `[[<id>]]` — an id is any run without brackets / newlines (item ids are
// `W…`, `position:orcid:…`, `dataset:datacite:10-…`, … — never brackets).
// Bounded to the schema's id cap so a pathological body can't back-track.
const TOKEN_RE = /\[\[([^[\]\n]{1,1024})\]\]/g;

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
    const id = m[1]!.trim();
    if (!id) continue; // `[[  ]]` is not a reference — leave it in the text run
    const at = m.index!;
    if (at > last) out.push({ kind: "text", text: body.slice(last, at) });
    out.push({ kind: "ref", id });
    last = at + m[0].length;
  }
  if (last < body.length) out.push({ kind: "text", text: body.slice(last) });
  return out;
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
  | { kind: "ref"; id: string; resolved: true; item: CvItem; section: CvSection; label: string }
  | { kind: "ref"; id: string; resolved: false };

export interface EvidenceResolveOptions {
  /**
   * The ids a renderer actually lists (after its own selection — per-view
   * exclusions, the "Selected publications" cap, peer-reviewed-only …). When
   * given, a reference also has to be in this set to resolve, so an export never
   * links to an anchor it did not emit.
   */
  listedIds?: ReadonlySet<string>;
}

/** id → (item, section) for every entry currently ON the CV. */
function evidenceIndex(
  cv: CanonicalCv,
  opts?: EvidenceResolveOptions,
): Map<string, { item: CvItem; section: CvSection }> {
  const index = new Map<string, { item: CvItem; section: CvSection }>();
  for (const section of visibleSections(cv)) {
    if (isProseSectionType(section.type)) continue;
    const excluded = new Set(cv.display.excludedItems?.[section.id] ?? []);
    for (const item of visibleItems(section)) {
      if (excluded.has(item.id)) continue;
      if (opts?.listedIds && !opts.listedIds.has(item.id)) continue;
      index.set(item.id, { item, section });
    }
  }
  return index;
}

/**
 * A resolver bound to one CV — build it once per render and call it per prose
 * section, so the id index is computed once rather than per body.
 */
export function evidenceResolver(
  cv: CanonicalCv,
  opts?: EvidenceResolveOptions,
): (body: string) => ResolvedEvidenceSegment[] {
  const index = evidenceIndex(cv, opts);
  return (body) => {
    let seen = 0;
    const segments = parseEvidenceRefs(body).map((seg): ResolvedEvidenceSegment => {
      if (seg.kind === "text") return seg;
      seen += 1;
      const hit = seen <= EVIDENCE_REF_MAX ? index.get(seg.id) : undefined;
      return hit
        ? { kind: "ref", id: seg.id, resolved: true, ...hit, label: evidenceRefLabel(hit.item) }
        : { kind: "ref", id: seg.id, resolved: false };
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
}

/**
 * The entries the editor's "Insert evidence" picker offers for a prose section:
 * the entries of the sections that support a narrative module (publications /
 * datasets for "contributions to knowledge", supervision / teaching for
 * "individuals", …), or EVERY listed entry for a free statement. Only what is
 * actually on the CV (visible + not hidden), so a picked reference always resolves.
 */
export function evidenceCandidates(cv: CanonicalCv, type: CvSectionType): EvidenceCandidate[] {
  const relevant = narrativeEvidenceSectionTypes(type);
  const out: EvidenceCandidate[] = [];
  for (const { item, section } of evidenceIndex(cv).values()) {
    if (relevant && !relevant.includes(section.type)) continue;
    const raw = item.displayTextOverride ?? item.csl?.title ?? item.displayText ?? item.id;
    out.push({
      id: item.id,
      label: evidenceRefLabel(item),
      title: stripInlineMarkup(raw).trim() || item.id,
      sectionType: section.type,
      sectionTitle: section.title,
    });
  }
  return out;
}
