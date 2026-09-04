import { prisma } from "@/lib/db";
import { logger } from "@/lib/log";
import { bareDoiInput } from "@/lib/openalex/client";

/**
 * FORRT Replication Database (FReD, https://forrt.org/replication-hub/) adapter —
 * original ⇄ replication study pairs, keyed by DOI.
 *
 * FReD offers no live query API, so this reads the `ForrtReplication` reference
 * table, bulk-imported from the FReD OSF CSV export by `npm run forrt:import`
 * (`scripts/forrt-import.ts`). DORMANT by default: with an empty table this is a
 * no-op. Both DOIs are identifier data (not a name match), so a hit is
 * IDENTIFIER-MATCHED — auto-included, never a review candidate. Fails soft
 * (returns empty maps) so a FORRT hiccup never breaks a sync.
 *
 * One lookup covers both directions for a set of the owner's own publication
 * DOIs: works that HAVE BEEN replicated (`replicatedBy`, keyed by the original's
 * DOI) and works that ARE replications the owner authored (`replicationOf`,
 * keyed by the replication's own DOI) — a single publication can appear in
 * either map, never both (FReD's `originalDoi` and `replicationDoi` name two
 * different studies).
 */

export interface ForrtReplicationHit {
  /** DOI of the replication study itself; undefined when FReD didn't record one. */
  doi?: string;
  /** FReD's own outcome label (e.g. "success"/"failure"/"mixed"/"informative
   *  failure") — kept verbatim; a renderer localizes only the generic buckets. */
  outcome?: string;
  /** Free-text citation for the replication study, when FReD supplied one. */
  ref?: string;
  /** FReD/OSF source link for this replication row. */
  url?: string;
}

export interface ForrtReplicationOfHit {
  /** DOI of the original (replicated) study. */
  doi: string;
  /** Free-text citation for the original study, when FReD supplied one. */
  ref?: string;
}

export interface ForrtLookupResult {
  /** Bare original-work DOI -> the replication(s) FReD recorded of it. */
  replicatedBy: Map<string, ForrtReplicationHit[]>;
  /** Bare replication-work DOI -> the original study it replicates. First match
   *  wins per DOI (a replication study replicates exactly one original). */
  replicationOf: Map<string, ForrtReplicationOfHit>;
}

const EMPTY: ForrtLookupResult = { replicatedBy: new Map(), replicationOf: new Map() };

/**
 * Look up FORRT replication data for a set of the owner's own publication DOIs
 * (in either role — original or replication). Fail-soft: DB errors and an empty
 * `dois` list both return the empty result rather than throwing.
 */
export async function fetchReplicationsForDois(
  dois: readonly (string | undefined)[],
): Promise<ForrtLookupResult> {
  const bare = [
    ...new Set(
      dois.map((d) => (d ? bareDoiInput(d) : null)).filter((d): d is string => Boolean(d)),
    ),
  ];
  if (bare.length === 0) return EMPTY;

  try {
    const rows = await prisma.forrtReplication.findMany({
      where: { OR: [{ originalDoi: { in: bare } }, { replicationDoi: { in: bare } }] },
    });
    if (rows.length === 0) return EMPTY;

    const bareSet = new Set(bare);
    const replicatedBy = new Map<string, ForrtReplicationHit[]>();
    const replicationOf = new Map<string, ForrtReplicationOfHit>();
    for (const r of rows) {
      if (bareSet.has(r.originalDoi)) {
        const list = replicatedBy.get(r.originalDoi) ?? [];
        list.push({
          doi: r.replicationDoi ?? undefined,
          outcome: r.outcome ?? undefined,
          ref: r.replicationRef ?? undefined,
          url: r.sourceUrl ?? undefined,
        });
        replicatedBy.set(r.originalDoi, list);
      }
      if (
        r.replicationDoi &&
        bareSet.has(r.replicationDoi) &&
        !replicationOf.has(r.replicationDoi)
      ) {
        replicationOf.set(r.replicationDoi, {
          doi: r.originalDoi,
          ref: r.originalRef ?? undefined,
        });
      }
    }
    return { replicatedBy, replicationOf };
  } catch (err) {
    // Same fail-soft contract as OEP's identifier-matched lookup: [] here is
    // ambiguous with "genuinely no replications", so log at error level.
    logger.error("forrt.lookup_failed", { err });
    return EMPTY;
  }
}
