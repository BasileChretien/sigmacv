import type { CanonicalCv, CvItem, Provenance } from "@/lib/canonical/schema";
import {
  fetchCrossrefGapFields,
  type CrossrefGapFields,
} from "@/lib/crossref/client";
import { resolveInstitution } from "@/lib/ror/client";
import type { ResolvedAffiliation } from "@/lib/openalex/resolveAuthor";
import type { OrcidPosition } from "@/lib/orcid/client";
import type { CslItem } from "@/types/csl";

/**
 * Optional, network-backed enrichment of the canonical CV.
 *
 * Kept OUT of `buildCanonicalCv` (which stays pure + synchronous): the build
 * assembles the document from already-fetched data, and these passes layer
 * external lookups on top. Both are bounded, concurrency-limited and fail-soft,
 * and both are IMMUTABLE (return new objects).
 *
 *  - Crossref: fills bibliographic gaps (journal, volume/issue, pages) on works
 *    that have a DOI but incomplete OpenAlex metadata. POST-build.
 *  - ROR: canonicalizes free-text institution names. PRE-build (so the same
 *    institution from ORCID and OpenAlex de-duplicates and renders consistently).
 */

const CROSSREF_MAX_ENRICH = 50;
const CONCURRENCY = 5;

/** Run an async mapper over items with a fixed concurrency cap (order preserved). */
async function mapBounded<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i] as T, i);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

function withSource(prov: Provenance, source: "crossref" | "ror"): Provenance {
  if (prov.sources.includes(source)) return prov;
  return { ...prov, sources: [...prov.sources, source] };
}

// ─── Crossref bibliographic gap-fill ─────────────────────────────────────────

/**
 * Merge Crossref gap fields into a CSL item, filling ONLY fields the base lacks.
 * OpenAlex remains authoritative — we never overwrite a value it already set.
 */
export function mergeCslGaps(base: CslItem, supp: CrossrefGapFields): CslItem {
  const out: CslItem = { ...base };
  const empty = (v: unknown) =>
    v === undefined || v === null || (typeof v === "string" && v.trim() === "");
  if (empty(out["container-title"]) && supp["container-title"]) {
    out["container-title"] = supp["container-title"];
  }
  if (empty(out.volume) && supp.volume) out.volume = supp.volume;
  if (empty(out.issue) && supp.issue) out.issue = supp.issue;
  if (empty(out.page) && supp.page) out.page = supp.page;
  if (empty(out.publisher) && supp.publisher) out.publisher = supp.publisher;
  if ((out.ISSN === undefined || out.ISSN === "") && supp.ISSN) out.ISSN = supp.ISSN;
  return out;
}

/** A published item is worth enriching when it has a DOI but no journal name. */
function needsCrossref(item: CvItem): boolean {
  const csl = item.csl;
  return Boolean(csl?.DOI) && !csl?.["container-title"];
}

/**
 * Fill bibliographic gaps from Crossref for works that have a DOI but no journal
 * title. Bounded to {@link CROSSREF_MAX_ENRICH} lookups per call. Returns a new
 * CV (and the original, untouched, if nothing needed or could be enriched).
 */
export async function enrichCvWithCrossref(
  cv: CanonicalCv,
  mailto: string,
): Promise<CanonicalCv> {
  // Collect (sectionIndex, itemIndex, doi) for every gap-having item, capped.
  const targets: Array<{ s: number; i: number; doi: string }> = [];
  cv.sections.forEach((section, s) => {
    section.items.forEach((item, i) => {
      if (targets.length >= CROSSREF_MAX_ENRICH) return;
      if (needsCrossref(item) && item.csl?.DOI) {
        targets.push({ s, i, doi: item.csl.DOI });
      }
    });
  });
  if (targets.length === 0) return cv;

  const fetched = await mapBounded(targets, CONCURRENCY, (t) =>
    fetchCrossrefGapFields(t.doi, mailto),
  );

  // Index successful gap-fills by "section:item" for an immutable rebuild.
  const fills = new Map<string, CrossrefGapFields>();
  targets.forEach((t, idx) => {
    const supp = fetched[idx];
    if (supp) fills.set(`${t.s}:${t.i}`, supp);
  });
  if (fills.size === 0) return cv;

  const sections = cv.sections.map((section, s) => ({
    ...section,
    items: section.items.map((item, i) => {
      const supp = fills.get(`${s}:${i}`);
      return supp && item.csl
        ? {
            ...item,
            csl: mergeCslGaps(item.csl, supp),
            meta: { ...item.meta, enriched: true },
          }
        : item;
    }),
  }));

  return {
    ...cv,
    sections,
    provenance: withSource(cv.provenance, "crossref"),
  };
}

// ─── ROR institution-name canonicalization ───────────────────────────────────

export interface InstitutionBundle {
  employments: OrcidPosition[];
  education: OrcidPosition[];
  distinctions: OrcidPosition[];
  service: OrcidPosition[];
  invitedPositions: OrcidPosition[];
  affiliations: ResolvedAffiliation[];
}

/**
 * Canonicalize every institution name across the ORCID + OpenAlex inputs via
 * ROR, BEFORE the canonical CV is built. Each distinct name is resolved once
 * (the ROR client also caches per process). Returns canonicalized copies plus
 * whether any name was actually changed (drives the "ror" provenance flag).
 */
export async function canonicalizeInstitutions(
  input: InstitutionBundle,
): Promise<{ result: InstitutionBundle; used: boolean }> {
  const names = new Set<string>();
  const add = (n: string | undefined) => {
    const t = (n ?? "").trim();
    if (t) names.add(t);
  };
  for (const p of input.employments) add(p.organization);
  for (const p of input.education) add(p.organization);
  for (const p of input.distinctions) add(p.organization);
  for (const p of input.service) add(p.organization);
  for (const p of input.invitedPositions) add(p.organization);
  for (const a of input.affiliations) add(a.institution);

  if (names.size === 0) return { result: input, used: false };

  const unique = [...names];
  const resolved = await mapBounded(unique, CONCURRENCY, (name) =>
    resolveInstitution(name),
  );

  // name → { canonical name?, rorId } for every CONFIDENT ROR match. The name is
  // only recorded when ROR returned a DIFFERENT string (so identical names are
  // left untouched), but the rorId is captured on ANY confident match so it can
  // be persisted even when the name didn't change.
  const matched = new Map<string, { name?: string; rorId?: string }>();
  unique.forEach((name, idx) => {
    const org = resolved[idx];
    if (!org) return;
    matched.set(name, {
      name: org.name && org.name !== name ? org.name : undefined,
      rorId: org.id || undefined,
    });
  });
  if (matched.size === 0) return { result: input, used: false };
  // A name CHANGE drives the "ror" provenance flag (used). A pure id annotation
  // (name unchanged) is additive metadata and not a visible source contribution.
  const used = [...matched.values()].some((m) => m.name !== undefined);

  const mapPos = (p: OrcidPosition): OrcidPosition => {
    const m = matched.get(p.organization.trim());
    if (!m) return p;
    return {
      ...p,
      organization: m.name ?? p.organization,
      rorId: m.rorId ?? p.rorId,
    };
  };
  const mapAff = (a: ResolvedAffiliation): ResolvedAffiliation => {
    const m = matched.get(a.institution.trim());
    if (!m) return a;
    return {
      ...a,
      institution: m.name ?? a.institution,
      rorId: m.rorId ?? a.rorId,
    };
  };

  return {
    used,
    result: {
      employments: input.employments.map(mapPos),
      education: input.education.map(mapPos),
      distinctions: input.distinctions.map(mapPos),
      service: input.service.map(mapPos),
      invitedPositions: input.invitedPositions.map(mapPos),
      affiliations: input.affiliations.map(mapAff),
    },
  };
}

/** Stamp "ror" onto a freshly-built CV's provenance (used after canonicalization). */
export function withRorProvenance(cv: CanonicalCv): CanonicalCv {
  return { ...cv, provenance: withSource(cv.provenance, "ror") };
}
