import type { CanonicalCv } from "@/lib/canonical/schema";
import { bareDoiInput, fetchWorkByDoi } from "@/lib/openalex/client";
import { fetchOrcidWorkDois, type OrcidWorksPayload } from "@/lib/orcid/client";
import type { OpenAlexWork } from "@/lib/openalex/types";
import { logger } from "@/lib/log";

/**
 * Discover works the user lists in their ORCID record that OpenAlex did NOT
 * attribute to their author profile — the "my paper is missing" gap. We diff the
 * ORCID DOIs against the works already in the CV and fetch each genuinely-missing
 * DOI back through OpenAlex (`fetchWorkByDoi`), so the metadata stays
 * source-driven and un-paddable. The caller (build) turns these into hidden
 * review candidates; only the user's later "Show" confirms ownership.
 *
 * Two things keep this cheap and safe:
 *  - the diff EXCLUDES every DOI already present in the previous CV, so a
 *    steady-state re-sync (incl. the daily living-page cron) discovers nothing
 *    new and issues zero extra OpenAlex calls; previously-found candidates are
 *    persisted + carried over by the build, not re-fetched here.
 *  - lookups are capped at {@link MAX_ORCID_DISCOVERY_LOOKUPS} so a profile with
 *    a huge ORCID/OpenAlex divergence can't fan out unbounded API calls.
 *
 * Fails soft: both underlying clients return [] / null on error, so a hiccup
 * yields fewer (or no) candidates rather than breaking the sync.
 */

/** Max ORCID-only DOIs resolved per sync (bounds OpenAlex fan-out). */
export const MAX_ORCID_DISCOVERY_LOOKUPS = 50;

/** Bare, lower-cased DOI for an OpenAlex work, or undefined. */
function workDoi(work: OpenAlexWork): string | undefined {
  return bareDoiInput(work.doi ?? work.ids?.doi ?? "") ?? undefined;
}

/** Every bare DOI already represented in the CV (any section). */
function cvDois(previous: CanonicalCv | null | undefined): Set<string> {
  const out = new Set<string>();
  for (const s of previous?.sections ?? []) {
    for (const it of s.items) {
      const bare = bareDoiInput(it.csl?.DOI ?? it.meta.doi ?? "");
      if (bare) out.add(bare);
    }
  }
  return out;
}

export interface DiscoverOrcidOnlyWorksOpts {
  orcid: string;
  /** Works already fetched from OpenAlex by author id this sync. */
  openAlexWorks: OpenAlexWork[];
  /** Previous canonical CV, so already-known DOIs are not re-discovered. */
  previous?: CanonicalCv | null;
  /** Raw ORCID `/works` payload already fetched this sync (shared with the work
   *  TYPES + PATENTS consumers). When omitted, `/works` is fetched standalone. */
  orcidWorks?: OrcidWorksPayload;
}

export async function discoverOrcidOnlyWorks(
  opts: DiscoverOrcidOnlyWorksOpts,
): Promise<OpenAlexWork[]> {
  const { orcid, openAlexWorks, previous, orcidWorks } = opts;

  const orcidDois = await fetchOrcidWorkDois(orcid, orcidWorks);
  if (orcidDois.length === 0) return [];

  // "Already have" = works pulled by author id this sync + everything in the CV.
  const have = cvDois(previous);
  for (const w of openAlexWorks) {
    const bare = workDoi(w);
    if (bare) have.add(bare);
  }

  // Missing ORCID DOIs (normalized + de-duplicated).
  const allMissing: string[] = [];
  const seen = new Set<string>();
  for (const raw of orcidDois) {
    const bare = bareDoiInput(raw);
    if (!bare || have.has(bare) || seen.has(bare)) continue;
    seen.add(bare);
    allMissing.push(bare);
  }
  if (allMissing.length === 0) return [];

  // Bound the OpenAlex fan-out; never silently truncate.
  const missing = allMissing.slice(0, MAX_ORCID_DISCOVERY_LOOKUPS);
  if (allMissing.length > missing.length) {
    logger.warn("orcid.discovery_truncated", {
      total: allMissing.length,
      cap: MAX_ORCID_DISCOVERY_LOOKUPS,
    });
  }

  const fetched = await Promise.all(missing.map((doi) => fetchWorkByDoi(doi)));

  // Keep only resolved works, de-duplicated by their resolved bare DOI (two ORCID
  // DOIs can resolve to the same OpenAlex work).
  const out: OpenAlexWork[] = [];
  const keptDois = new Set<string>();
  for (const w of fetched) {
    if (!w) continue;
    const bare = workDoi(w);
    // A resolved work could turn out to already be in the CV (different DOI form
    // pointing at the same record) — drop it so we never duplicate.
    if (bare && (have.has(bare) || keptDois.has(bare))) continue;
    if (bare) keptDois.add(bare);
    out.push(w);
  }
  return out;
}
