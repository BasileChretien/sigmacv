import { prisma } from "@/lib/db";
import { logger } from "@/lib/log";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { workFunderIds } from "@/lib/funders/join";
import { bareRorId } from "@/lib/ror/id";
import { openAlexError, openAlexResponse } from "./client";

/**
 * The OpenAlex funder crosswalk — `GET /funders/F…?select=id,display_name,ids`
 * — and the sync-time writer that keeps one `Funder` row per funder printed
 * on the owner's works. The row carries the ids OpenAlex records for the
 * funder (`ids.crossref` is the bare FundRef id, canonicalised here to the
 * `10.13039/…` DOI; `ids.ror` and `ids.wikidata` are URLs, stored bare), which
 * is what lets the owner's ORCID / Crossref grants (FundRef / ROR ids) be
 * compared with a work's OpenAlex funder ids without ever string-equalling
 * the two namespaces (`funders/join.ts`).
 *
 * Reference data about funders, not about a person: fetched through the
 * polite pool, bounded per sync, refreshed every 90 days, and fail-soft — a
 * hiccup here never fails or delays the document.
 */

const FUNDER_SELECT = "id,display_name,ids";
/** A short OpenAlex funder id — the only thing that may reach the URL. */
const FUNDER_ID = /^F\d+$/;
const FUNDREF_DOI = /^10\.13039\/\d+$/;

/** A row younger than this is not re-fetched. */
export const FUNDER_FRESHNESS_MS = 90 * 24 * 3600 * 1000;
/** Fetches per sync (stalest first) — ~0 once warm. */
export const FUNDER_FETCH_BOUND = 25;
/**
 * Wall-clock budget per sync. The writer runs on the interactive path (the
 * `/cv` auto-sync, the manual sync route, the hourly resync) and a single
 * fetch can take tens of seconds under the shared client's retries, so the
 * count bound alone is not a time bound: no new fetch starts past this, and
 * the rest is the next sync's work.
 */
export const FUNDER_BUDGET_MS = 10_000;

export interface RecordWorkFundersOptions {
  /** Wall-clock budget; no new fetch is started past it (default 10 s). */
  budgetMs?: number;
  /** Clock, for tests. */
  clock?: () => number;
}

export interface RecordWorkFundersSummary {
  /** Funders fetched (a 404 counts; a thrown fetch does not). */
  fetched: number;
  /** True when the budget ran out before every stale funder was attempted. */
  stoppedForBudget: boolean;
}

export interface FetchedFunder {
  openalexId: string;
  name: string;
  fundrefDoi?: string;
  rorId?: string;
  wikidataId?: string;
}

interface RawFunder {
  id?: string | null;
  display_name?: string | null;
  ids?: {
    crossref?: string | number | null;
    ror?: string | null;
    wikidata?: string | null;
  } | null;
}

/** `ids.crossref` is the bare FundRef id (digits); accept the DOI form too. */
function fundrefDoiOf(crossref: string | number | null | undefined): string | undefined {
  if (crossref === null || crossref === undefined) return undefined;
  const value = String(crossref).trim();
  if (/^\d+$/.test(value)) return `10.13039/${value}`;
  return FUNDREF_DOI.test(value) ? value : undefined;
}

function wikidataIdOf(url: string | null | undefined): string | undefined {
  const m = url ? /Q\d+$/.exec(url.trim()) : null;
  return m ? m[0] : undefined;
}

function rorIdOf(url: string | null | undefined): string | undefined {
  return url ? (bareRorId(url.trim()) ?? undefined) : undefined;
}

/**
 * The funder OpenAlex records for a short id, reduced to its name and
 * canonical ids; null when the id is not funder-shaped (no request is made),
 * when OpenAlex has no entity for it (404) or the entity carries no id. Any
 * other failure throws — the writer's fail-soft path owns it.
 */
export async function fetchFunder(openalexId: string): Promise<FetchedFunder | null> {
  if (!FUNDER_ID.test(openalexId)) return null;
  const path = `/funders/${openalexId}`;
  const res = await openAlexResponse(path, { select: FUNDER_SELECT });
  if (res.status === 404) return null;
  if (!res.ok) throw openAlexError(res, path);
  const raw = (await res.json()) as RawFunder;
  if (!raw.id) return null;
  const fundrefDoi = fundrefDoiOf(raw.ids?.crossref);
  const rorId = rorIdOf(raw.ids?.ror);
  const wikidataId = wikidataIdOf(raw.ids?.wikidata);
  return {
    openalexId,
    name: (raw.display_name ?? "").trim(),
    ...(fundrefDoi ? { fundrefDoi } : {}),
    ...(rorId ? { rorId } : {}),
    ...(wikidataId ? { wikidataId } : {}),
  };
}

function compareCodeUnits(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Keep the crosswalk warm for the funders printed on the owner's included
 * works: the ids with no `Funder` row, or a row older than the freshness
 * window, are fetched — never more than {@link FUNDER_FETCH_BOUND} per sync,
 * stalest first (missing rows, then oldest, ties by id), inside a wall-clock
 * budget checked before every fetch — and upserted. A funder OpenAlex no
 * longer has is skipped. Fail-soft at every level: a failed query, fetch or
 * write is logged and the sync goes on. Never throws.
 */
export async function recordWorkFunders(
  cv: CanonicalCv,
  now: Date,
  opts: RecordWorkFundersOptions = {},
): Promise<RecordWorkFundersSummary> {
  const budgetMs = opts.budgetMs ?? FUNDER_BUDGET_MS;
  const clock = opts.clock ?? Date.now;
  const startedAt = clock();
  const summary: RecordWorkFundersSummary = { fetched: 0, stoppedForBudget: false };
  const ids = workFunderIds(cv);
  if (ids.length === 0) return summary;
  try {
    const rows = await prisma.funder.findMany({
      where: { openalexId: { in: ids } },
      select: { openalexId: true, fetchedAt: true },
    });
    const fetchedAt = new Map(rows.map((r) => [r.openalexId, r.fetchedAt.getTime()]));
    const age = (id: string) => fetchedAt.get(id) ?? Number.NEGATIVE_INFINITY;
    const cutoff = now.getTime() - FUNDER_FRESHNESS_MS;
    const stale = ids
      .filter((id) => age(id) < cutoff)
      .sort((a, b) => age(a) - age(b) || compareCodeUnits(a, b))
      .slice(0, FUNDER_FETCH_BOUND);
    for (const [i, openalexId] of stale.entries()) {
      if (clock() - startedAt > budgetMs) {
        summary.stoppedForBudget = true;
        // Steady state on a cold table: the remainder is the next sync's work.
        logger.info("funder.record_budget", { budgetMs, remaining: stale.length - i });
        break;
      }
      try {
        const funder = await fetchFunder(openalexId);
        summary.fetched += 1;
        if (!funder) continue;
        const data = {
          name: funder.name,
          fundrefDoi: funder.fundrefDoi ?? null,
          rorId: funder.rorId ?? null,
          wikidataId: funder.wikidataId ?? null,
          fetchedAt: now,
        };
        await prisma.funder.upsert({
          where: { openalexId },
          create: { openalexId, ...data },
          update: data,
        });
      } catch (err) {
        logger.warn("funder.record_failed", { openalexId, err });
      }
    }
  } catch (err) {
    logger.warn("funder.record_failed", { err });
  }
  return summary;
}
