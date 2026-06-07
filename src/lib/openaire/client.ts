import { resilientFetch } from "@/lib/http";
import { logger } from "@/lib/log";
import { normalizeOrcid } from "@/lib/openalex/types";
import { getOpenaireAccessToken } from "./auth";

/**
 * OpenAIRE Graph API — the researcher's datasets & software, matched by ORCID.
 *
 * `researchProducts?authorOrcid=…` returns a person's outputs (identifier-matched,
 * so reliable to auto-include). The product objects carry NO inline project /
 * funding links, so OpenAIRE is used for DATASETS + SOFTWARE (supplementing
 * DataCite), NOT grants — grants come from ORCID funding + Crossref + the
 * national funder APIs. Fails soft → []. Uses a cached access token for higher
 * rate limits when configured, else anonymous.
 */

const GRAPH_API = "https://api.openaire.eu/graph/v1/researchProducts";
const USER_AGENT = "SigmaCV (+https://github.com/BasileChretien/sigmacv)";
const MAX_BYTES = 4_000_000;

/** A dataset / software output from OpenAIRE. */
export interface OpenaireOutput {
  /** Stable OpenAIRE id. */
  openaireId: string;
  title: string;
  type: "dataset" | "software";
  /** DOI when one of the product's PIDs is a DOI. */
  doi?: string;
  year?: number;
  publisher?: string;
}

function asRecord(v: unknown): Record<string, unknown> | undefined {
  return typeof v === "object" && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : undefined;
}

/** First DOI from a product's `pids: [{ scheme, value }]`. */
function doiFromPids(pids: unknown): string | undefined {
  if (!Array.isArray(pids)) return undefined;
  for (const p of pids) {
    const rec = asRecord(p);
    if (rec?.scheme === "doi" && typeof rec.value === "string") return rec.value;
  }
  return undefined;
}

function mapProduct(raw: unknown, type: "dataset" | "software"): OpenaireOutput | null {
  const p = asRecord(raw);
  const openaireId = typeof p?.id === "string" ? p.id : undefined;
  const title = typeof p?.mainTitle === "string" ? p.mainTitle : undefined;
  if (!p || !openaireId || !title) return null;
  const date = typeof p.publicationDate === "string" ? p.publicationDate : undefined;
  const year = date ? Number(date.slice(0, 4)) : undefined;
  return {
    openaireId,
    title,
    type,
    doi: doiFromPids(p.pids),
    year: Number.isFinite(year) ? year : undefined,
    publisher: typeof p.publisher === "string" ? p.publisher : undefined,
  };
}

async function fetchOutputsOfType(
  orcid: string,
  type: "dataset" | "software",
  token: string | null,
): Promise<OpenaireOutput[]> {
  const url = new URL(GRAPH_API);
  url.searchParams.set("authorOrcid", orcid);
  url.searchParams.set("type", type);
  url.searchParams.set("pageSize", "100");
  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": USER_AGENT,
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await resilientFetch(url, {
    headers,
    next: { revalidate: 86_400 },
    timeoutMs: 12_000,
  });
  if (!res.ok) return [];
  const body = await res.text();
  /* v8 ignore next -- defensive cap on a pathological response */
  if (body.length > MAX_BYTES) return [];
  const data = JSON.parse(body) as { results?: unknown };
  const results = Array.isArray(data.results) ? data.results : [];
  const out: OpenaireOutput[] = [];
  for (const item of results) {
    const mapped = mapProduct(item, type);
    if (mapped) out.push(mapped);
  }
  return out;
}

/**
 * The researcher's datasets & software from OpenAIRE, matched by author ORCID.
 * De-duplicated by OpenAIRE id. Fails soft → [].
 */
export async function fetchOpenaireOutputs(
  orcid: string,
): Promise<OpenaireOutput[]> {
  const bare = normalizeOrcid(orcid);
  if (!bare) return [];
  try {
    const token = await getOpenaireAccessToken();
    const [datasets, software] = await Promise.all([
      fetchOutputsOfType(bare, "dataset", token),
      fetchOutputsOfType(bare, "software", token),
    ]);
    const seen = new Set<string>();
    const out: OpenaireOutput[] = [];
    for (const o of [...datasets, ...software]) {
      if (seen.has(o.openaireId)) continue;
      seen.add(o.openaireId);
      out.push(o);
    }
    return out;
  } catch (err) {
    logger.warn("openaire.outputs_fetch_failed", { err });
    return [];
  }
}
