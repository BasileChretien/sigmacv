import { Prisma } from "@/generated/prisma/client";
import { countListedCvsByRor } from "@/lib/cv/listed";
import { purgeInstitutionPages } from "@/lib/cv/publicPageCache";
import { prisma } from "@/lib/db";
import { isRorId } from "@/lib/institutions/institutions";
import {
  COUNTED_WORK_TYPES,
  computeInstitutionAggregates,
  countedYears,
  foldedInstitutionIds,
  parseInstitutionAggregates,
  type CountedGroup,
  type InstitutionGroupCounts,
} from "@/lib/institutions/snapshot";
import { logger } from "@/lib/log";
import { fetchInstitutionByRor, groupWorks, type GroupWorksQuery } from "./institutions";

/**
 * The OpenAlex organisation snapshot job, piggy-backed on the internal resync
 * tick (`/api/internal/resync`, after the CV resync and the DOI-withdrawal
 * drain). The ONLY code path that asks OpenAlex about an institution; the
 * `/i/[ror]` page renders the row this writes and never calls out.
 *
 * Per run: the OpenAlex columns of every `Institution` row whose ROR is no
 * longer an opted-in set are cleared (the trusted ROR name stays — it is still
 * the OAI set name), then the stalest rows among the current sets (`nextRefreshAt`
 * null or due, nulls first) are refreshed, at most `maxRows`, each costing
 * 12 polite-pool calls (one entity lookup + 11 grouped requests) paced
 * `paceMs` apart, inside a wall-clock budget. A
 * success schedules the next refresh a week out; a failure records the reason
 * and backs off one day. Fail-soft throughout: a row's failure never stops the
 * next row, and nothing here throws into the cron route.
 *
 * "Opted-in set" is the same consent gate as the OAI `ror:<id>` sets and the
 * institution page's count (`countListedCvsByRor`: published + indexable +
 * listed under the affiliation) — no snapshot is ever fetched for a ROR nobody
 * chose to be listed under (the "Live proxying" veto's second half).
 */

/** A successful snapshot is refreshed weekly. */
export const INSTITUTION_REFRESH_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
/** A failed row is retried after a day. */
export const INSTITUTION_REFRESH_BACKOFF_MS = 24 * 60 * 60 * 1000;

const DEFAULT_MAX_ROWS = 20;
const DEFAULT_PACE_MS = 200;
const DEFAULT_BUDGET_MS = 60_000;
/** `openalexLastError` is a diagnostic column, not a log: bounded. */
const MAX_ERROR_LENGTH = 500;

export interface RefreshInstitutionProfilesOptions {
  /** Rows refreshed per run (default 20). */
  maxRows?: number;
  /** Pause between OpenAlex calls (default 200 ms). */
  paceMs?: number;
  /** Wall-clock budget; no new row is started past it (default 60 s). */
  budgetMs?: number;
  /** Clock, for tests. */
  clock?: () => number;
}

export interface RefreshInstitutionProfilesSummary {
  /** Rows picked for this run. */
  candidates: number;
  refreshed: number;
  failed: number;
  /** Rows whose OpenAlex columns were cleared because their ROR left the sets. */
  cleared: number;
  /** Opted-in sets with no `Institution` row at all — skipped, never created
   *  (a row needs a trusted ROR name, which only a sync writes). */
  missingRows: number;
  /** The first {@link MAX_REPORTED_MISSING} of those ROR ids. */
  missingRowIds: string[];
  /** True when the budget ran out before every candidate was attempted. */
  stoppedForBudget: boolean;
}

/** Bound on the missing-row ids carried in the summary and the log line. */
const MAX_REPORTED_MISSING = 20;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function errorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return message.slice(0, MAX_ERROR_LENGTH);
}

/** The grouped counts for one institution: 1 + years + 3 calls, paced —
 *  about 2.2 s of pacing plus latency per row at the default 200 ms. */
async function collectGroups(
  lineageIds: string[],
  years: number[],
  paceMs: number,
): Promise<InstitutionGroupCounts> {
  const typeFilter = `type:${COUNTED_WORK_TYPES.join("|")}`;
  // Hyphen range verified live on 2026-09-09: HTTP 200, same count as the pipe-joined years.
  const windowFilter = `publication_year:${years[0]}-${years[years.length - 1]}`;
  const call = async (groupBy: GroupWorksQuery["groupBy"], filters: string[]) => {
    if (paceMs > 0) await sleep(paceMs);
    return groupWorks({ lineageIds, filters, groupBy });
  };
  const grouped = async (
    groupBy: GroupWorksQuery["groupBy"],
    filters: string[],
  ): Promise<CountedGroup[]> => (await call(groupBy, filters)).groups;
  const byYear = await grouped("publication_year", [typeFilter, windowFilter]);
  const oaByYear: InstitutionGroupCounts["oaByYear"] = [];
  for (const year of years) {
    const groups = await grouped("open_access.oa_status", [typeFilter, `publication_year:${year}`]);
    oaByYear.push({ year, groups });
  }
  const countries = await grouped("authorships.countries", [typeFilter, windowFilter]);
  const coAffiliations = await grouped("authorships.institutions.lineage", [
    typeFilter,
    windowFilter,
  ]);
  // The field mix keeps its request's own total: the stated denominator.
  const domains = await call("primary_topic.domain.id", [typeFilter, windowFilter]);
  return { byYear, oaByYear, countries, coAffiliations, domains };
}

/** Fetch, aggregate and store one institution's snapshot; throws on failure. */
async function refreshOne(rorId: string, now: Date, paceMs: number): Promise<void> {
  const entity = await fetchInstitutionByRor(rorId);
  if (!entity) throw new Error("no OpenAlex institution for this ROR id");
  const groups = await collectGroups(foldedInstitutionIds(entity), countedYears(now), paceMs);
  const aggregates = computeInstitutionAggregates(entity, groups, { fetchedAt: now, now });
  // The page parses the stored row back and reads "not fetched yet" for a row
  // that fails the schema — silently, for a week. Refuse to store one: a key
  // shape OpenAlex changes becomes a recorded failure with a one-day backoff,
  // and the previous snapshot stays on the row.
  if (!parseInstitutionAggregates(aggregates)) {
    throw new Error("aggregates failed the stored schema; previous snapshot kept");
  }
  // The outgoing reading becomes the previous one: the page prints what the
  // last full year stood at one reading earlier (the stability signal). Read
  // and write are two statements: within a tick nothing else touches the row
  // (the clear and the due list are disjoint and sequential), and a second
  // success inside the week merely makes the previous reading a day old. A
  // row with aggregates but no fetch time (hand-edited) carries nothing.
  const outgoing = await prisma.institution.findUnique({
    where: { rorId },
    select: { openalexAggregates: true, openalexFetchedAt: true },
  });
  const previous = outgoing?.openalexFetchedAt ? (outgoing.openalexAggregates ?? null) : null;
  await prisma.institution.update({
    where: { rorId },
    data: {
      openalexId: aggregates.countedEntity.openalexId,
      openalexAggregates: aggregates as unknown as Prisma.InputJsonValue,
      openalexFetchedAt: now,
      openalexLastError: null,
      openalexNextRefreshAt: new Date(now.getTime() + INSTITUTION_REFRESH_INTERVAL_MS),
      openalexPreviousAggregates:
        previous === null ? Prisma.DbNull : (previous as Prisma.InputJsonValue),
      openalexPreviousFetchedAt: previous === null ? null : (outgoing?.openalexFetchedAt ?? null),
    },
  });
  purgeInstitutionPages([rorId]);
}

/** Record a row's failure and back it off; logs (never throws) if even that fails. */
async function recordFailure(rorId: string, now: Date, err: unknown): Promise<void> {
  logger.warn("institution.openalex_refresh_failed", { rorId, err });
  try {
    await prisma.institution.update({
      where: { rorId },
      data: {
        openalexLastError: errorMessage(err),
        openalexNextRefreshAt: new Date(now.getTime() + INSTITUTION_REFRESH_BACKOFF_MS),
      },
    });
  } catch (recordErr) {
    logger.error("institution.openalex_refresh_record_failed", { rorId, err: recordErr });
  }
}

/** The ROR ids currently opted into the listing — the only ones ever snapshotted. */
async function optedInRorIds(): Promise<string[]> {
  return [...(await countListedCvsByRor()).keys()].filter(isRorId);
}

/** Clear the OpenAlex columns of rows whose ROR is no longer a set. */
async function clearLeftSets(sets: string[]): Promise<number> {
  const { count } = await prisma.institution.updateMany({
    where: { rorId: { notIn: sets }, openalexNextRefreshAt: { not: null } },
    data: {
      openalexId: null,
      openalexAggregates: Prisma.DbNull,
      openalexFetchedAt: null,
      openalexLastError: null,
      openalexNextRefreshAt: null,
      openalexPreviousAggregates: Prisma.DbNull,
      openalexPreviousFetchedAt: null,
    },
  });
  return count;
}

/** The stalest due rows among the sets, never-fetched first. */
async function dueRows(sets: string[], now: Date, maxRows: number): Promise<string[]> {
  const rows = await prisma.institution.findMany({
    where: {
      rorId: { in: sets },
      OR: [{ openalexNextRefreshAt: null }, { openalexNextRefreshAt: { lte: now } }],
    },
    orderBy: { openalexNextRefreshAt: { sort: "asc", nulls: "first" } },
    take: maxRows,
    select: { rorId: true },
  });
  return rows.map((r) => r.rorId);
}

/**
 * The opted-in sets with no `Institution` row. Such a set is skipped by design
 * — a row is only ever written by a sync that recorded the trusted ROR name,
 * so the job updates and never upserts — but silently: this makes the gap
 * visible in the summary and, once per tick, in the log.
 */
async function missingRows(sets: string[]): Promise<string[]> {
  const rows = await prisma.institution.findMany({
    where: { rorId: { in: sets } },
    select: { rorId: true },
  });
  const present = new Set(rows.map((r) => r.rorId));
  return sets.filter((rorId) => !present.has(rorId));
}

/** Run one bounded refresh pass (see the module doc). Never throws. */
export async function refreshInstitutionProfiles(
  opts: RefreshInstitutionProfilesOptions = {},
): Promise<RefreshInstitutionProfilesSummary> {
  const maxRows = opts.maxRows ?? DEFAULT_MAX_ROWS;
  const paceMs = opts.paceMs ?? DEFAULT_PACE_MS;
  const budgetMs = opts.budgetMs ?? DEFAULT_BUDGET_MS;
  const clock = opts.clock ?? Date.now;
  const startedAt = clock();
  const now = new Date(startedAt);
  const summary: RefreshInstitutionProfilesSummary = {
    candidates: 0,
    refreshed: 0,
    failed: 0,
    cleared: 0,
    missingRows: 0,
    missingRowIds: [],
    stoppedForBudget: false,
  };
  try {
    const sets = await optedInRorIds();
    summary.cleared = await clearLeftSets(sets);
    const rorIds = await dueRows(sets, now, maxRows);
    summary.candidates = rorIds.length;
    const missing = await missingRows(sets);
    summary.missingRows = missing.length;
    summary.missingRowIds = missing.slice(0, MAX_REPORTED_MISSING);
    if (missing.length > 0) {
      logger.warn("institution.openalex_refresh_missing_rows", {
        missingRows: summary.missingRows,
        missingRowIds: summary.missingRowIds,
      });
    }
    for (const [i, rorId] of rorIds.entries()) {
      if (clock() - startedAt > budgetMs) {
        summary.stoppedForBudget = true;
        // Steady state once more than a handful of institutions are due per
        // tick — the remainder is simply next tick's work, so not a warning.
        logger.info("institution.openalex_refresh_budget", {
          budgetMs,
          remaining: rorIds.length - i,
        });
        break;
      }
      try {
        await refreshOne(rorId, now, paceMs);
        summary.refreshed += 1;
      } catch (err) {
        summary.failed += 1;
        await recordFailure(rorId, now, err);
      }
    }
  } catch (err) {
    logger.error("institution.openalex_refresh_job_failed", { err, ...summary });
  }
  if (summary.candidates > 0) logger.info("institution.openalex_refreshed", { ...summary });
  return summary;
}
