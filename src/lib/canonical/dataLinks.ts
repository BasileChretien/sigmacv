import { normDoi } from "@/lib/canonical/duplicates";
import type { CanonicalCv, CvItem, DataLink, DataLinkKind } from "@/lib/canonical/schema";
import type { DataciteOutput } from "@/lib/datacite/client";

/**
 * Open data / code links attached to a publication (`meta.dataLinks`) — pure
 * helpers shared by every source that produces them (Europe PMC data links,
 * Crossref relations, DataCite related identifiers) and by the renderers.
 *
 * A link is `{ id, scheme, url, title?, kind }`: `scheme` is the identifier
 * scheme the source reported (an accession scheme such as "geo"/"pdb", "doi", or
 * a code host such as "github"), `id` the identifier within that scheme, `url`
 * the resolvable landing page. `kind` is INFERRED here from the scheme, the URL
 * and the DOI prefix — a display classification, never a research signal.
 *
 * figshare is excluded project-wide (see `isFigshareDoi` in build.ts): its
 * records are overwhelmingly publisher supplements, so no figshare DOI or URL
 * ever becomes a data link.
 */

/** Hard cap on links per work (schema `meta.dataLinks.max(20)`). */
export const MAX_DATA_LINKS = 20;

/** A data link as a source reports it, before the kind is inferred. */
export interface RawDataLink {
  id: string;
  scheme: string;
  url?: string;
  title?: string;
  /** Source-side grouping (e.g. a Europe PMC category name) — a kind hint only. */
  category?: string;
}

// ── Kind inference ───────────────────────────────────────────────────────────

/** Identifier schemes that are code hosts / software archives. */
const SOFTWARE_SCHEMES = new Set([
  "swh",
  "software heritage",
  "softwareheritage",
  "github",
  "gitlab",
  "codeberg",
  "bitbucket",
  "cran",
  "pypi",
  "bioconductor",
  "bio.tools",
  "biotools",
]);

/** Code-host / software-archive URLs. */
const SOFTWARE_URL_RE =
  /^https?:\/\/(?:www\.)?(?:github\.com|gitlab\.com|codeberg\.org|bitbucket\.org|(?:archive\.)?softwareheritage\.org|cran\.r-project\.org|pypi\.org|bioconductor\.org)\//i;

/** Accession-number schemes of the major life-science data archives (lower-cased). */
const DATASET_SCHEMES = new Set([
  "geo",
  "gds",
  "gse",
  "sra",
  "ena",
  "embl",
  "genbank",
  "ddbj",
  "refseq",
  "insdc",
  "pdb",
  "wwpdb",
  "emdb",
  "uniprot",
  "arrayexpress",
  "biostudies",
  "pride",
  "dbgap",
  "clinvar",
  "biosample",
  "bioproject",
  "ega",
  "chembl",
  "metabolights",
  "ensembl",
  "interpro",
  "pfam",
  "omim",
  "biomodels",
  "intact",
  "hpa",
  "gwas",
  "dbsnp",
  "gtex",
  "ebi",
  "ncbi",
  "dryad",
  "zenodo",
  "osf",
  "dataverse",
  "pangaea",
  "mendeley",
  "gigadb",
  "gbif",
  "dataset",
]);

/**
 * DOI prefixes of general-purpose data repositories. Zenodo also mints SOFTWARE
 * DOIs, but the prefix alone can't tell — a Zenodo DOI is classed "dataset"
 * unless the URL/scheme says otherwise (the brief's rule). figshare (10.6084) is
 * deliberately absent: it is excluded outright.
 */
const DATA_REPOSITORY_DOI_PREFIXES = [
  "10.5281/", // Zenodo
  "10.5061/", // Dryad
  "10.17605/", // OSF
  "10.7910/", // Harvard Dataverse
  "10.17632/", // Mendeley Data
  "10.1594/", // PANGAEA
  "10.5524/", // GigaDB
  "10.15468/", // GBIF
  "10.5256/", // EMBL-EBI BioStudies / Europe PMC data
  "10.6019/", // PRIDE
  "10.2210/", // wwPDB
  "10.25919/", // CSIRO Data Access Portal
  "10.34894/", // DataverseNL
  "10.18150/", // RepOD
  "10.24432/", // UCI ML Repository
  "10.3886/", // ICPSR
  "10.5255/", // UK Data Service
  "10.4121/", // 4TU.ResearchData
  "10.5878/", // Swedish National Data Service
  "10.17026/", // DANS
  "10.6073/", // EDI
  "10.5066/", // USGS
  "10.5067/", // NASA EOSDIS
  "10.7937/", // TCIA
  "10.11588/", // heiDATA
];

/** Repository URL hosts (dataset side) — Zenodo/OSF/Dryad/Dataverse/… landing pages. */
const DATASET_URL_RE =
  /^https?:\/\/(?:[a-z0-9-]+\.)?(?:zenodo\.org|datadryad\.org|osf\.io|dataverse\.harvard\.edu|dataverse\.org|data\.mendeley\.com|pangaea\.de|gigadb\.org|gbif\.org|ebi\.ac\.uk|ncbi\.nlm\.nih\.gov|rcsb\.org|uniprot\.org|europepmc\.org)\//i;

/** figshare, anywhere (DOI namespace or URL) — excluded project-wide. */
const FIGSHARE_RE = /figshare/i;

/** True when the DOI's prefix belongs to a known general-purpose data repository. */
export function isDataRepositoryDoi(doi: string | undefined | null): boolean {
  const bare = normDoi(doi ?? undefined);
  if (!bare || FIGSHARE_RE.test(bare)) return false;
  return DATA_REPOSITORY_DOI_PREFIXES.some((p) => bare.startsWith(p));
}

/** True when the URL points at a known data repository or code host. */
export function isRepositoryUrl(url: string | undefined | null): boolean {
  const u = (url ?? "").trim();
  if (!u || FIGSHARE_RE.test(u)) return false;
  return SOFTWARE_URL_RE.test(u) || DATASET_URL_RE.test(u);
}

/**
 * Classify a link: code hosts / software archives → "software"; life-science
 * accession schemes and general-purpose data-repository DOIs → "dataset";
 * anything else → "other". `category` (a source grouping label) is a tiebreaker
 * only when the scheme/URL say nothing.
 */
export function inferDataLinkKind(link: {
  scheme: string;
  url?: string;
  id?: string;
  category?: string;
}): DataLinkKind {
  const scheme = link.scheme.trim().toLowerCase();
  const url = link.url ?? "";
  if (SOFTWARE_SCHEMES.has(scheme) || SOFTWARE_URL_RE.test(url)) return "software";
  if (DATASET_SCHEMES.has(scheme)) return "dataset";
  if (scheme === "doi" && isDataRepositoryDoi(link.id ?? "")) return "dataset";
  if (DATASET_URL_RE.test(url)) return "dataset";
  const cat = (link.category ?? "").toLowerCase();
  if (/software|code/.test(cat)) return "software";
  if (/data|sequence|structure|protein|gene|sample|omics/.test(cat)) return "dataset";
  return "other";
}

// ── Construction + normalisation ─────────────────────────────────────────────

/** Canonical https://doi.org/<bare> URL for a DOI, or undefined when it isn't one. */
function doiUrl(doi: string): string | undefined {
  const bare = normDoi(doi);
  return bare && /^10\.\d{4,9}\/\S+$/.test(bare) ? `https://doi.org/${bare}` : undefined;
}

/**
 * Normalise a raw link into a {@link DataLink}, or null when it can't be
 * represented (no id, no resolvable http(s) URL, or figshare). A `doi` scheme
 * gets the canonical doi.org URL (whatever URL the source gave), so the same
 * DOI from two sources dedupes.
 */
export function toDataLink(raw: RawDataLink): DataLink | null {
  const scheme = raw.scheme.trim().toLowerCase();
  let id = raw.id.trim();
  if (!scheme || !id) return null;
  let url = raw.url?.trim();
  if (scheme === "doi") {
    const bare = normDoi(id);
    if (!bare) return null;
    id = bare;
    url = doiUrl(bare);
  }
  if (!url || !/^https?:\/\//i.test(url)) return null;
  if (FIGSHARE_RE.test(id) || FIGSHARE_RE.test(url)) return null;
  const title = raw.title?.trim();
  const link: DataLink = {
    id: id.slice(0, 500),
    scheme: scheme.slice(0, 100),
    url: url.slice(0, 2048),
    kind: inferDataLinkKind({ scheme, url, id, category: raw.category }),
  };
  return title ? { ...link, title: title.slice(0, 500) } : link;
}

/** Dedupe key: the DOI (scheme+id) when it is one, else the normalised URL. */
function linkKey(link: DataLink): string {
  if (link.scheme === "doi") return `doi:${link.id}`;
  return link.url
    .replace(/^http:/i, "https:")
    .replace(/\/+$/, "")
    .toLowerCase();
}

/**
 * Merge link lists in order, dropping duplicates (same DOI, or same URL) and
 * capping at {@link MAX_DATA_LINKS}. Earlier lists win on a clash, so callers pass
 * the more descriptive source first (a titled DataCite record before a bare
 * Crossref relation). A later duplicate still contributes its title when the
 * kept one has none.
 */
export function mergeDataLinks(...lists: readonly (readonly DataLink[])[]): DataLink[] {
  const byKey = new Map<string, DataLink>();
  for (const list of lists) {
    for (const link of list) {
      const key = linkKey(link);
      const kept = byKey.get(key);
      if (!kept) {
        if (byKey.size >= MAX_DATA_LINKS) continue;
        byKey.set(key, link);
      } else if (!kept.title && link.title) {
        byKey.set(key, { ...kept, title: link.title });
      }
    }
  }
  return [...byKey.values()];
}

/** The item with `links` merged onto its existing data links (immutable). Returns
 *  the same item when nothing new was added. */
export function withDataLinks(item: CvItem, links: readonly DataLink[]): CvItem {
  if (links.length === 0) return item;
  const existing = item.meta.dataLinks ?? [];
  const merged = mergeDataLinks(existing, links);
  if (merged.length === existing.length && merged.every((l, i) => l === existing[i])) return item;
  return { ...item, meta: { ...item.meta, dataLinks: merged } };
}

// ── DataCite: attach the owner's deposits to the papers they supplement ──────

/** DataCite `resourceTypeGeneral` → link kind. */
function dataciteKind(type: string): DataLinkKind {
  if (/^(software|computationalnotebook|workflow)$/i.test(type)) return "software";
  if (/^(dataset|collection|physicalobject)$/i.test(type)) return "dataset";
  return "other";
}

/**
 * Attach the owner's DataCite deposits to the publications they declare a
 * relation to (`IsSupplementTo` / `IsReferencedBy` / `IsCitedBy` / `IsSourceOf`,
 * carried as `linkedDois` by the DataCite client). A paper then "knows" its
 * dataset even when the paper's own metadata is silent — the relation is
 * asserted on the DEPOSIT side, by the owner (ORCID-matched), so it is reliable.
 * Matched strictly by DOI against the paper's `csl.DOI`. Pure + immutable; returns
 * the same CV when nothing attaches.
 */
export function attachDataciteLinks(
  cv: CanonicalCv,
  outputs: readonly DataciteOutput[],
): CanonicalCv {
  const byPaperDoi = new Map<string, DataLink[]>();
  for (const o of outputs) {
    if (!o.linkedDois?.length) continue;
    const link = toDataLink({ id: o.doi, scheme: "doi", title: o.title });
    if (!link) continue;
    const typed: DataLink = { ...link, kind: dataciteKind(o.type) };
    for (const paperDoi of o.linkedDois) {
      const key = normDoi(paperDoi);
      if (!key || key === link.id) continue;
      byPaperDoi.set(key, [...(byPaperDoi.get(key) ?? []), typed]);
    }
  }
  if (byPaperDoi.size === 0) return cv;

  let changed = false;
  const sections = cv.sections.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      const key = normDoi(item.csl?.DOI);
      const links = key ? byPaperDoi.get(key) : undefined;
      if (!links) return item;
      const next = withDataLinks(item, links);
      if (next !== item) changed = true;
      return next;
    }),
  }));
  return changed ? { ...cv, sections } : cv;
}
