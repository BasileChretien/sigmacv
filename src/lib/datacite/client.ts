import { resilientFetch } from "@/lib/http";
import { logger } from "@/lib/log";
import { normalizeOrcid } from "@/lib/openalex/types";

/**
 * DataCite REST API — datasets, software and other non-article research outputs
 * registered against the user's ORCID. Free, no auth (3000 req / 5 min). These
 * are outputs OpenAlex's article-centric works pull tends to miss; surfacing
 * them rewards non-article contributions (responsible-assessment aligned).
 * Fails soft → [].
 */

const DATACITE_API = "https://api.datacite.org/dois";

export interface DataciteOutput {
  doi: string;
  title: string;
  type: string; // resourceTypeGeneral, e.g. "Dataset" | "Software"
  year?: number;
  publisher?: string;
  /**
   * Sibling DOIs that identify the SAME deposit under another DOI — Zenodo mints a
   * concept DOI plus a per-version DOI. Bare + lower-cased. Lets the build
   * reconcile (and drop) the OpenAlex-indexed copy whichever sibling it carries.
   * Omitted when there are none.
   */
  relatedDois?: string[];
}

// DataCite relationType values that mark the same deposit under another DOI
// (concept↔version, identical). Citation/supplement relations (Cites,
// IsSupplementTo, References, …) are deliberately EXCLUDED — they point at
// genuinely different works and must not be deduped against. Compared lower-cased.
const VERSION_RELATIONS = new Set([
  "isversionof",
  "hasversion",
  "isnewversionof",
  "ispreviousversionof",
  "isidenticalto",
  "isvariantformof",
]);

// Output kinds we surface (exclude article-like types already in Publications).
const INCLUDE_TYPES = new Set([
  "Dataset",
  "Software",
  "Workflow",
  "Model",
  "Collection",
  "ComputationalNotebook",
  "PhysicalObject",
]);

/* eslint-disable @typescript-eslint/no-explicit-any */
function nonEmpty(s: unknown): string | undefined {
  return typeof s === "string" && s.trim() ? s.trim() : undefined;
}

/** Publisher name, tolerating both the legacy string form and the DataCite
 *  Fabrica v2 object form (`{ name, publisherIdentifier, ... }`). */
function publisherName(v: unknown): string | undefined {
  if (typeof v === "string") return nonEmpty(v);
  if (typeof v === "object" && v !== null) return nonEmpty((v as Record<string, unknown>).name);
  return undefined;
}

/** "https://doi.org/10.5281/Zenodo.1" → "10.5281/zenodo.1" (bare, lower-cased). */
function bareDoiLower(s: unknown): string | undefined {
  const raw = nonEmpty(s);
  return raw ? raw.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").toLowerCase() : undefined;
}

/** Sibling DOIs (concept↔version / identical) of a DataCite record, deduped. */
function relatedDoisOf(attr: any): string[] {
  const rels = Array.isArray(attr?.relatedIdentifiers) ? attr.relatedIdentifiers : [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const r of rels) {
    if (nonEmpty(r?.relatedIdentifierType)?.toLowerCase() !== "doi") continue;
    if (!VERSION_RELATIONS.has(nonEmpty(r?.relationType)?.toLowerCase() ?? "")) continue;
    const doi = bareDoiLower(r?.relatedIdentifier);
    if (doi && !seen.has(doi)) {
      seen.add(doi);
      out.push(doi);
    }
  }
  return out;
}

export async function fetchDataciteOutputs(orcid: string): Promise<DataciteOutput[]> {
  const bare = normalizeOrcid(orcid);
  const url = new URL(DATACITE_API);
  url.searchParams.set(
    "query",
    `creators.nameIdentifiers.nameIdentifier:"https://orcid.org/${bare}"`,
  );
  url.searchParams.set("page[size]", "100");

  try {
    const res = await resilientFetch(url, {
      headers: {
        Accept: "application/vnd.api+json",
        // Polite-pool identification (shared convention across all clients).
        "User-Agent": "SigmaCV (+https://github.com/BasileChretien/sigmacv)",
      },
      next: { revalidate: 3600 },
      timeoutMs: 12_000,
    });
    if (!res.ok) throw new Error(`DataCite request failed (${res.status})`);
    const data = (await res.json()) as any;
    const out: DataciteOutput[] = [];
    const seen = new Set<string>();
    for (const rec of Array.isArray(data?.data) ? data.data : []) {
      const attr = rec?.attributes ?? {};
      const type = nonEmpty(attr?.types?.resourceTypeGeneral);
      const doi = nonEmpty(attr?.doi)?.toLowerCase();
      if (!type || !doi || !INCLUDE_TYPES.has(type) || seen.has(doi)) continue;
      const title = nonEmpty(Array.isArray(attr?.titles) ? attr.titles[0]?.title : undefined);
      if (!title) continue;
      seen.add(doi);
      const yearRaw = attr?.publicationYear;
      const year = Number.isFinite(Number(yearRaw)) ? Number(yearRaw) : undefined;
      const relatedDois = relatedDoisOf(attr);
      out.push({
        doi,
        title,
        type,
        year,
        publisher: publisherName(attr?.publisher),
        ...(relatedDois.length ? { relatedDois } : {}),
      });
    }
    return out;
  } catch (err) {
    logger.warn("datacite.fetch_failed", { err });
    return [];
  }
}
