import { resilientFetch } from "@/lib/http";
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
}

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

export async function fetchDataciteOutputs(
  orcid: string,
): Promise<DataciteOutput[]> {
  const bare = normalizeOrcid(orcid);
  const url = new URL(DATACITE_API);
  url.searchParams.set(
    "query",
    `creators.nameIdentifiers.nameIdentifier:"https://orcid.org/${bare}"`,
  );
  url.searchParams.set("page[size]", "100");

  try {
    const res = await resilientFetch(url, {
      headers: { Accept: "application/vnd.api+json" },
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
      const title = nonEmpty(
        Array.isArray(attr?.titles) ? attr.titles[0]?.title : undefined,
      );
      if (!title) continue;
      seen.add(doi);
      const yearRaw = attr?.publicationYear;
      const year = Number.isFinite(Number(yearRaw)) ? Number(yearRaw) : undefined;
      out.push({
        doi,
        title,
        type,
        year,
        publisher: nonEmpty(attr?.publisher),
      });
    }
    return out;
  } catch (err) {
    console.warn("[datacite] fetch failed:", err);
    return [];
  }
}
