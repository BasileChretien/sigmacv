import { cache } from "react";
import type { Metadata } from "next";
import {
  normalizeAuthorQuery,
  searchAuthorsByName,
  type AuthorSearchHit,
} from "@/lib/openalex/authorSearch";
import { enforceSearchRateLimit } from "./searchRateLimit";

export type SearchLookup =
  | { kind: "idle" }
  | { kind: "invalid"; raw: string }
  | { kind: "rate-limited"; retryAfterSec: number }
  | { kind: "ok"; query: string; hits: AuthorSearchHit[] };

/**
 * Resolve the lookup for the current request (deduplicated between
 * generateMetadata and the page by React's `cache`). No query = the bare,
 * indexable page; the rate limit is only spent when a query is actually run.
 */
export const loadSearch = cache(async (rawQuery: string | undefined): Promise<SearchLookup> => {
  if (rawQuery === undefined || rawQuery === "") return { kind: "idle" };
  const query = normalizeAuthorQuery(rawQuery);
  if (!query) return { kind: "invalid", raw: rawQuery };
  const rl = await enforceSearchRateLimit();
  if (!rl.ok) return { kind: "rate-limited", retryAfterSec: rl.retryAfterSec };
  return { kind: "ok", query, hits: await searchAuthorsByName(query) };
});

/** First `q` of the page's search params, as a string. */
export function queryParam(sp: Record<string, string | string[] | undefined>): string | undefined {
  const v = sp.q;
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Only the bare search page is indexable. A result page is a list of people
 * assembled for one visitor's query: never a crawlable index of researchers.
 */
export function searchRobots(lookup: SearchLookup): Metadata["robots"] | undefined {
  return lookup.kind === "idle" ? undefined : { index: false, follow: false };
}
