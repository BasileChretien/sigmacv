import { XMLParser } from "fast-xml-parser";
import { resilientFetch } from "@/lib/http";
import { logger } from "@/lib/log";
import { normalizeOrcid } from "@/lib/openalex/types";

/**
 * DBLP — the researcher's CONFERENCE papers (computer science), matched by ORCID.
 *
 * Two steps: resolve ORCID → DBLP PID via the SPARQL endpoint (the ORCID anchor),
 * then read the person's bibliography XML and keep only `<inproceedings>`
 * (conference/workshop papers — the gap OpenAlex tends to miss for CS). Keyless,
 * fails soft → []. Returns [] when the ORCID isn't linked to a DBLP profile.
 */

const SPARQL = "https://sparql.dblp.org/sparql";
const USER_AGENT = "SigmaCV (+https://github.com/BasileChretien/sigmacv)";
const MAX_BYTES = 8_000_000;

export interface DblpConferencePaper {
  /** Stable DBLP record key (e.g. "conf/jcdl/MichelsFLSS17"). */
  key: string;
  title: string;
  /** Conference name (the `<booktitle>`). */
  venue?: string;
  year?: number;
  doi?: string;
}

function asRecord(v: unknown): Record<string, unknown> | undefined {
  return typeof v === "object" && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : undefined;
}
function toArray<T>(v: T | T[] | undefined): T[] {
  return Array.isArray(v) ? v : v === undefined ? [] : [v];
}

/** Resolve an ORCID to its DBLP PID via SPARQL, or null. */
async function resolvePid(orcid: string): Promise<string | null> {
  const query = `SELECT ?author WHERE { ?author <https://dblp.org/rdf/schema#orcid> <https://orcid.org/${orcid}> . }`;
  const url = new URL(SPARQL);
  url.searchParams.set("query", query);
  url.searchParams.set("format", "json");
  const res = await resilientFetch(url, {
    headers: { Accept: "application/sparql-results+json", "User-Agent": USER_AGENT },
    next: { revalidate: 86_400 },
    timeoutMs: 12_000,
  });
  if (!res.ok) return null;
  const data = JSON.parse(await res.text()) as {
    results?: { bindings?: unknown[] };
  };
  const first = asRecord(data.results?.bindings?.[0]);
  const value = asRecord(first?.author)?.value;
  if (typeof value !== "string") return null;
  const m = /\/pid\/(.+)$/.exec(value);
  return m ? (m[1] as string) : null;
}

/** DOI from a DBLP `<ee>` value (string or array of links). */
function doiFromEe(ee: unknown): string | undefined {
  for (const raw of toArray(ee)) {
    const url = typeof raw === "string" ? raw : asRecord(raw)?.["#text"];
    if (typeof url === "string") {
      const m = /doi\.org\/(10\.\S+)$/i.exec(url);
      if (m) return m[1];
    }
  }
  return undefined;
}

function parseConferencePapers(xml: string): DblpConferencePaper[] {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const doc = parser.parse(xml) as Record<string, unknown>;
  const person = asRecord(doc.dblpperson);
  const records = toArray(person?.r as unknown);
  const out: DblpConferencePaper[] = [];
  for (const raw of records) {
    const r = asRecord(raw);
    const inproc = asRecord(r?.inproceedings); // keep ONLY conference papers
    if (!inproc) continue;
    const title = typeof inproc.title === "string" ? inproc.title.replace(/\.$/, "") : undefined;
    const key = typeof inproc["@_key"] === "string" ? inproc["@_key"] : undefined;
    if (!title || !key) continue;
    const yearNum = Number(inproc.year);
    out.push({
      key,
      title,
      venue: typeof inproc.booktitle === "string" ? inproc.booktitle : undefined,
      year: Number.isFinite(yearNum) && yearNum > 0 ? yearNum : undefined,
      doi: doiFromEe(inproc.ee),
    });
  }
  return out;
}

export async function fetchDblpConferencePapers(
  orcid: string,
): Promise<DblpConferencePaper[]> {
  const bare = normalizeOrcid(orcid);
  if (!bare) return [];
  try {
    const pid = await resolvePid(bare);
    if (!pid) return [];
    const res = await resilientFetch(`https://dblp.org/pid/${pid}.xml`, {
      headers: { Accept: "application/xml", "User-Agent": USER_AGENT },
      next: { revalidate: 86_400 },
      timeoutMs: 12_000,
    });
    if (!res.ok) return [];
    const xml = await res.text();
    if (xml.length > MAX_BYTES) return [];
    return parseConferencePapers(xml);
  } catch (err) {
    logger.warn("dblp.fetch_failed", { err });
    return [];
  }
}
