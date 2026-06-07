import { resilientFetch } from "@/lib/http";
import { logger } from "@/lib/log";
import { normalizeOrcid } from "@/lib/openalex/types";

/**
 * Wikidata — identity enrichment for the public CV page, matched by ORCID
 * (property P496). When the researcher has a Wikidata item we surface its URI
 * plus VIAF / ISNI cross-references as schema.org `sameAs` links, and any awards
 * (P166) the user may choose to add. Keyless (a descriptive User-Agent is
 * required by Wikidata policy). Fails soft → null when there's no item.
 */

const SPARQL = "https://query.wikidata.org/sparql";
const USER_AGENT =
  "SigmaCV/0.1 (https://github.com/BasileChretien/sigmacv) academic-CV identity enrichment";
const MAX_BYTES = 4_000_000;

export interface WikidataIdentity {
  /** Wikidata entity URI (e.g. "http://www.wikidata.org/entity/Q6832241"). */
  wikidataUri: string;
  /** Identity links (Wikidata, VIAF, ISNI) for the public page's schema.org sameAs. */
  sameAs: string[];
  /** Award / honour labels (the user opts in to showing them). */
  awards: string[];
}

function asRecord(v: unknown): Record<string, unknown> | undefined {
  return typeof v === "object" && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : undefined;
}
function bindingValue(binding: Record<string, unknown> | undefined, key: string): string | undefined {
  const v = asRecord(binding?.[key])?.value;
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

export async function fetchWikidataIdentity(
  orcid: string,
): Promise<WikidataIdentity | null> {
  const bare = normalizeOrcid(orcid);
  if (!bare) return null;

  const query = `SELECT DISTINCT ?person ?viaf ?isni ?award ?awardLabel WHERE {
  ?person wdt:P496 "${bare}" .
  OPTIONAL { ?person wdt:P166 ?award . }
  OPTIONAL { ?person wdt:P214 ?viaf . }
  OPTIONAL { ?person wdt:P213 ?isni . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}`;
  const url = new URL(SPARQL);
  url.searchParams.set("query", query);
  url.searchParams.set("format", "json");

  try {
    const res = await resilientFetch(url, {
      headers: {
        Accept: "application/sparql-results+json",
        "User-Agent": USER_AGENT,
      },
      next: { revalidate: 86_400 },
      timeoutMs: 12_000,
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (text.length > MAX_BYTES) return null;
    const data = JSON.parse(text) as { results?: { bindings?: unknown[] } };
    const bindings = Array.isArray(data.results?.bindings)
      ? data.results.bindings
      : [];
    if (bindings.length === 0) return null;

    let wikidataUri: string | undefined;
    let viaf: string | undefined;
    let isni: string | undefined;
    const awards = new Set<string>();
    for (const raw of bindings) {
      const b = asRecord(raw);
      wikidataUri ??= bindingValue(b, "person");
      viaf ??= bindingValue(b, "viaf");
      isni ??= bindingValue(b, "isni");
      const award = bindingValue(b, "awardLabel");
      // Skip the unresolved "Q…"-id label Wikidata returns when no English label.
      if (award && !/^Q\d+$/.test(award)) awards.add(award);
    }
    if (!wikidataUri) return null;

    const sameAs = [
      wikidataUri,
      viaf ? `https://viaf.org/viaf/${viaf}` : undefined,
      isni ? `https://isni.org/isni/${isni}` : undefined,
    ].filter((s): s is string => Boolean(s));

    return { wikidataUri, sameAs, awards: [...awards] };
  } catch (err) {
    logger.warn("wikidata.fetch_failed", { err });
    return null;
  }
}
