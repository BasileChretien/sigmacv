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
  /**
   * DOIs of the PUBLICATIONS this deposit declares itself attached to
   * (`IsSupplementTo` / `IsReferencedBy` / `IsCitedBy` / `IsSourceOf`). Bare +
   * lower-cased. When one matches a publication on the CV, the deposit is attached
   * to that paper as an open-data/code link (`meta.dataLinks`) — the paper "knows"
   * its dataset even when the paper's own metadata is silent. Omitted when none.
   */
  linkedDois?: string[];
  /**
   * The deposit's creators (in order) — name plus the bare ORCID when registered.
   * Used to show the authors on the entry and to highlight the account holder's
   * own name. Omitted when DataCite lists none.
   */
  creators?: { name: string; orcid?: string }[];
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

// Journal-minted "supplementary material" is part of a publication already listed
// under Publications, NOT a standalone dataset/software output. Springer/BMC mint a
// figshare DOI for each "Additional file N of <article>" (and Nature/Springer for
// "Supplementary information/tables/…"), plus a figshare COLLECTION that bundles them
// under the article's own title. We drop these so the Datasets & Software section
// isn't padded with paper appendices. Any REAL data inside a collection is its own
// DataCite record and is surfaced separately, so nothing genuine is lost.
const ADDITIONAL_FILE_RE = /^\s*additional file\s+\d+\s+of\b/i;
const SUPPLEMENT_TITLE_RE =
  /^\s*supplement(?:ary|al)\s+(?:information|materials?|methods?|notes?|figures?|tables?|appendix|files?)\b/i;

/** figshare record? (publisher name or the 10.6084/…figshare… DOI namespace). */
function isFigshare(publisher: string | undefined, doi: string): boolean {
  return /figshare/i.test(publisher ?? "") || doi.includes("figshare");
}

/**
 * Journal-minted supplementary material masquerading as a dataset/collection — an
 * "Additional file N of …" / "Supplementary …" doc, or the figshare Collection that
 * groups a paper's supplements. Not a standalone research output → dropped.
 */
function isJournalSupplement(
  title: string,
  type: string,
  doi: string,
  publisher?: string,
): boolean {
  if (ADDITIONAL_FILE_RE.test(title) || SUPPLEMENT_TITLE_RE.test(title)) return true;
  // A figshare Collection is the article's supplement container (title = the paper).
  if (type === "Collection" && isFigshare(publisher, doi)) return true;
  return false;
}

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

/** The deposit's creators (name + bare ORCID when present), in order, capped. */
function creatorsOf(attr: any): { name: string; orcid?: string }[] {
  const cs = Array.isArray(attr?.creators) ? attr.creators : [];
  const out: { name: string; orcid?: string }[] = [];
  for (const c of cs.slice(0, 50)) {
    const name =
      nonEmpty(c?.name) ??
      [nonEmpty(c?.givenName), nonEmpty(c?.familyName)].filter(Boolean).join(" ");
    if (!name) continue;
    const ids = Array.isArray(c?.nameIdentifiers) ? c.nameIdentifiers : [];
    let orcid: string | undefined;
    for (const n of ids) {
      const scheme = nonEmpty(n?.nameIdentifierScheme)?.toLowerCase();
      const raw = nonEmpty(n?.nameIdentifier);
      if (raw && (scheme === "orcid" || /orcid\.org/i.test(raw))) {
        orcid = normalizeOrcid(raw);
        break;
      }
    }
    out.push(orcid ? { name, orcid } : { name });
  }
  return out;
}

/** Related DOIs of a DataCite record whose relationType is in `kinds`, deduped. */
function relatedDoisOfKind(attr: any, kinds: Set<string>): string[] {
  const rels = Array.isArray(attr?.relatedIdentifiers) ? attr.relatedIdentifiers : [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const r of rels) {
    if (nonEmpty(r?.relatedIdentifierType)?.toLowerCase() !== "doi") continue;
    if (!kinds.has(nonEmpty(r?.relationType)?.toLowerCase() ?? "")) continue;
    const doi = bareDoiLower(r?.relatedIdentifier);
    if (doi && !seen.has(doi)) {
      seen.add(doi);
      out.push(doi);
    }
  }
  return out;
}

/** Sibling DOIs (concept↔version / identical) of a DataCite record, deduped. */
function relatedDoisOf(attr: any): string[] {
  return relatedDoisOfKind(attr, VERSION_RELATIONS);
}

// DataCite relationType values by which a deposit declares the PUBLICATION it
// supports (the deposit is the supplement / the cited or referenced object / the
// source of the paper). These DOIs point at a different work on purpose: they are
// how a paper on the CV gets its open-data/code link. Compared lower-cased.
const PUBLICATION_LINK_RELATIONS = new Set([
  "issupplementto",
  "isreferencedby",
  "iscitedby",
  "issourceof",
]);

/** DOIs of the publications this deposit declares itself attached to, deduped. */
function linkedDoisOf(attr: any): string[] {
  return relatedDoisOfKind(attr, PUBLICATION_LINK_RELATIONS);
}

export async function fetchDataciteOutputs(orcid: string): Promise<DataciteOutput[]> {
  const bare = normalizeOrcid(orcid);
  const url = new URL(DATACITE_API);
  // Match BOTH the URL form ("https://orcid.org/X") and the BARE form ("X") of the
  // ORCID nameIdentifier. The indexed value is matched verbatim, and depositors
  // register either — Zenodo, passing through a bare `.zenodo.json` orcid, stores
  // the bare form (scheme "ORCID"), so querying only the URL form silently misses
  // every such record. The bare ORCID is globally unique, so OR-ing both is safe.
  const field = "creators.nameIdentifiers.nameIdentifier";
  url.searchParams.set("query", `(${field}:"https://orcid.org/${bare}" OR ${field}:"${bare}")`);
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
      const publisher = publisherName(attr?.publisher);
      // Skip journal-minted supplementary material — it belongs to a publication,
      // not the Datasets & Software section.
      if (isJournalSupplement(title, type, doi, publisher)) continue;
      seen.add(doi);
      const yearRaw = attr?.publicationYear;
      const year = Number.isFinite(Number(yearRaw)) ? Number(yearRaw) : undefined;
      const relatedDois = relatedDoisOf(attr);
      const linkedDois = linkedDoisOf(attr);
      const creators = creatorsOf(attr);
      out.push({
        doi,
        title,
        type,
        year,
        publisher,
        ...(relatedDois.length ? { relatedDois } : {}),
        ...(linkedDois.length ? { linkedDois } : {}),
        ...(creators.length ? { creators } : {}),
      });
    }
    return out;
  } catch (err) {
    logger.warn("datacite.fetch_failed", { err });
    return [];
  }
}
