import type { CanonicalCv, CvItem, CvSection } from "@/lib/canonical/schema";
import {
  applyPass,
  mapWithinBudget,
  posKey,
  rotationQueue,
  type RotationTarget,
} from "@/lib/canonical/enrich";
import { countableWorks } from "@/lib/render/countable";
import { lookupEuropePmcCopy } from "@/lib/repositoryCopies/europepmc";
import { lookupHalCopy } from "@/lib/repositoryCopies/hal";
import { lookupOpenaireCopy } from "@/lib/repositoryCopies/openaire";
import { FAILED, type CopyLookup, type RepositoryCopy } from "@/lib/repositoryCopies/shared";
import { lookupZenodoCopy, ZENODO_MIN_INTERVAL_MS } from "@/lib/repositoryCopies/zenodo";
import { AT_PUBLISHER } from "./depositNow";
import { answeredWithin } from "./freshness";

/**
 * The OWNER sync's repository-copies pass: for each countable journal article
 * with a DOI in either worklist list — closed, or open at the publisher only —
 * the closed ones first, whether a copy already sits in a repository OpenAlex
 * does not know about (`meta.repositoryCopies`): HAL, Europe PMC, an
 * OpenAIRE-harvested repository, Zenodo (`COPY_LOOKUPS`, the order that found
 * the most on a real CV — 2026-09-16: 17 of 51 in HAL, one in Europe PMC, none
 * the other two knew; see `repositoryCopies/shared.ts`).
 *
 * Two phases inside one budget. Phase 1 asks the FIRST source (HAL: fast, and
 * where nearly every copy was) for EVERY work due, up to the cap, within its
 * own share of the budget ({@link FIRST_PHASE_SHARE}) so a hanging HAL cannot
 * starve the others. Phase 2 asks the other sources, in order, for the works
 * phase 1 did not settle with a file, until the budget runs out. Before this
 * split, one sync asked all four sources of one work before the next work and
 * reached 7 of 52 in 12 s (2026-09-16 on the live CV) — the slow sources
 * starved the one that finds. Known cost: a work phase 2 did not reach is
 * asked HAL again next sync (cheap; a per-source stamp would spare it).
 *
 * Called from `syncCvForUser` ONLY, like the OA.Works pass beside it, never from
 * `buildCvFromOrcid` (the anonymous preview shares that function). Polite by
 * construction: one call at a time, each source once per work, no retry, at
 * most {@link REPOSITORY_COPIES_MAX_WORKS} works per sync inside
 * {@link REPOSITORY_COPIES_BUDGET_MS} of wall clock, never-checked works first,
 * Zenodo calls spaced by {@link ZENODO_MIN_INTERVAL_MS} (its guest limit), and
 * a work answered within {@link REPOSITORY_COPIES_REFRESH_DAYS} days is not
 * asked again. The search of a work stops at the first copy WITH A FILE: the
 * fact the worklist acts on (the paper is open in a repository).
 *
 * What is stored is settled SOURCE BY SOURCE: a source that answered this sync
 * (copies, or none) replaces what it said before; a source that failed, or was
 * not reached before the budget ran out, keeps its stored copies. A work is
 * ANSWERED — stamped, and not asked again within the window — when a file was
 * found or every source answered; otherwise only the ATTEMPT is stamped, so the
 * work returns behind the works never examined (the OA.Works pass's lesson),
 * with the notices found so far already in the worklist. A source that throws
 * is a failure of that source, never of the sync. A work that stops being a
 * candidate loses its copies.
 */

export const REPOSITORY_COPIES_MAX_WORKS = 20;
const REPOSITORY_COPIES_BUDGET_MS = 12_000;
/** Phase 1 may spend this share of the budget; the rest is phase 2's at least. */
const FIRST_PHASE_SHARE = 2 / 3;
export const REPOSITORY_COPIES_REFRESH_DAYS = 7;
/** Across the sources, per work (the schema enforces the same). */
const MAX_COPIES = 8;

type Source = RepositoryCopy["source"];
type Lookup = (doi: string, mailto?: string, timeoutMs?: number) => Promise<CopyLookup>;
type StoredCopy = NonNullable<CvItem["meta"]["repositoryCopies"]>[number];

/**
 * The sources in the order asked. The FIRST is asked for every work due before
 * any other source is asked at all (phase 1); exported so a test can see the order.
 */
export const COPY_LOOKUPS: ReadonlyArray<readonly [Source, Lookup]> = [
  ["hal", lookupHalCopy],
  ["europepmc", lookupEuropePmcCopy],
  ["openaire", lookupOpenaireCopy],
  ["zenodo", lookupZenodoCopy],
];

export interface RepositoryCopiesOptions {
  /** Injected by tests: the sources, the clock and the Zenodo spacing. */
  lookups?: typeof COPY_LOOKUPS;
  now?: string;
  zenodoIntervalMs?: number;
}

/** A countable journal article with a DOI, closed or open at the publisher only. */
function isCandidate(item: CvItem, countable: ReadonlySet<CvItem>): boolean {
  return (
    countable.has(item) &&
    (item.meta.oaIsOpen === false ||
      (item.meta.oaIsOpen === true && AT_PUBLISHER.has(item.meta.oaStatus ?? ""))) &&
    item.csl?.type === "article-journal" &&
    typeof item.csl.DOI === "string" &&
    item.csl.DOI.trim() !== ""
  );
}

/** Drop the copies + both sentinels from every item that is no longer a candidate. */
function withoutStaleCopies(sections: CvSection[], candidates: ReadonlySet<string>): CvSection[] {
  return sections.map((section, s) => ({
    ...section,
    items: section.items.map((item, i) =>
      candidates.has(posKey({ s, i })) ||
      (item.meta.repositoryCopies === undefined &&
        item.meta.repositoryCopiesCheckedAt === undefined &&
        item.meta.repositoryCopiesTriedAt === undefined)
        ? item
        : {
            ...item,
            meta: {
              ...item.meta,
              repositoryCopies: undefined,
              repositoryCopiesCheckedAt: undefined,
              repositoryCopiesTriedAt: undefined,
            },
          },
    ),
  }));
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** What one source said about one work this sync. */
interface Outcome {
  /** `skipped`: not asked — the budget was out, or a file was already found. */
  status: "found" | "none" | "failed" | "skipped";
  copies: RepositoryCopy[];
}
type Outcomes = ReadonlyMap<Source, Outcome>;

const SKIPPED: Outcome = { status: "skipped", copies: [] };
const hasFile = (o: Outcome) => o.copies.some((c) => c.hasFile);
const answered = (o: Outcome) => o.status === "found" || o.status === "none";

/** One source, one work — within the budget; a client that throws has failed. */
async function ask(
  lookup: Lookup,
  doi: string,
  mailto: string,
  remainingMs: () => number,
): Promise<Outcome> {
  if (remainingMs() <= 0) return SKIPPED;
  let result: CopyLookup;
  try {
    result = await lookup(doi, mailto, Math.max(1, remainingMs()));
  } catch {
    result = FAILED;
  }
  return result.status === "found"
    ? { status: "found", copies: result.copies }
    : { status: result.status, copies: [] };
}

/** Phase 2 for one work: the remaining sources in order, until a file or the budget's end. */
async function askRest(
  doi: string,
  mailto: string,
  rest: ReadonlyArray<readonly [Source, Lookup]>,
  remainingMs: () => number,
  pace: { lastZenodo: number; zenodoIntervalMs: number },
): Promise<Outcomes> {
  const outcomes = new Map<Source, Outcome>();
  let settled = false;
  for (const [source, lookup] of rest) {
    if (settled) {
      outcomes.set(source, SKIPPED);
      continue;
    }
    if (source === "zenodo" && remainingMs() > 0) {
      const wait = pace.lastZenodo + pace.zenodoIntervalMs - Date.now();
      if (wait > 0) await sleep(Math.min(wait, remainingMs()));
      pace.lastZenodo = Date.now();
    }
    const outcome = await ask(lookup, doi, mailto, remainingMs);
    outcomes.set(source, outcome);
    if (hasFile(outcome)) settled = true;
  }
  return outcomes;
}

/**
 * The copies to store for one work, source by source: this sync's answer where
 * there is one, the stored copies of that source otherwise — this sync's first,
 * so the cap never drops a new copy for a kept one. Answered = a file was
 * found, or every source answered.
 */
function settle(
  order: readonly Source[],
  outcomes: Outcomes,
  stored: readonly StoredCopy[] | undefined,
  now: string,
): { copies: StoredCopy[]; answered: boolean } {
  const fresh: StoredCopy[] = [];
  const kept: StoredCopy[] = [];
  let every = true;
  let file = false;
  for (const source of order) {
    const outcome = outcomes.get(source);
    if (outcome !== undefined && answered(outcome)) {
      fresh.push(...outcome.copies.map((c) => ({ ...c, retrievedAt: now })));
      if (hasFile(outcome)) file = true;
    } else {
      every = false;
      kept.push(...(stored ?? []).filter((c) => c.source === source));
    }
  }
  return { copies: [...fresh, ...kept].slice(0, MAX_COPIES), answered: file || every };
}

export async function enrichCvWithRepositoryCopies(
  cv: CanonicalCv,
  mailto: string,
  options: RepositoryCopiesOptions = {},
): Promise<CanonicalCv> {
  const now = options.now ?? new Date().toISOString();
  const lookups = options.lookups ?? COPY_LOOKUPS;
  const pace = {
    lastZenodo: 0,
    zenodoIntervalMs: options.zenodoIntervalMs ?? ZENODO_MIN_INTERVAL_MS,
  };
  const countable = new Set(countableWorks(cv));
  type Candidate = RotationTarget & { doi: string; answeredAt?: string; open: boolean };
  const candidates: Candidate[] = [];
  cv.sections.forEach((section, s) => {
    section.items.forEach((item, i) => {
      if (!isCandidate(item, countable)) return;
      candidates.push({
        s,
        i,
        doi: item.csl!.DOI!,
        open: item.meta.oaIsOpen === true,
        // The rotation reads the last ATTEMPT; the refresh window keys on the ANSWER.
        checkedAt: item.meta.repositoryCopiesTriedAt ?? item.meta.repositoryCopiesCheckedAt,
        answeredAt: item.meta.repositoryCopiesCheckedAt,
      });
    });
  });
  // The closed works first: the first list is the one a deposit is asked for.
  const due = [...candidates.filter((c) => !c.open), ...candidates.filter((c) => c.open)].filter(
    (t) => !answeredWithin(t.answeredAt, now, REPOSITORY_COPIES_REFRESH_DAYS),
  );
  const [first, ...rest] = lookups;
  /* v8 ignore next -- COPY_LOOKUPS is never empty; an injected empty list asks nothing */
  const targets = first ? rotationQueue(due, REPOSITORY_COPIES_MAX_WORKS) : [];
  const order = lookups.map(([source]) => source);

  const started = Date.now();
  const deadline = started + REPOSITORY_COPIES_BUDGET_MS;
  const remainingMs = () => deadline - Date.now();
  const firstBudgetMs = Math.round(REPOSITORY_COPIES_BUDGET_MS * FIRST_PHASE_SHARE);
  const firstDeadline = started + firstBudgetMs;
  const firstRemainingMs = () => firstDeadline - Date.now();
  // Phase 1: the first source, every work due, within its share.
  const phase1 = await mapWithinBudget(
    "repositories.copies.first",
    targets,
    (t) => ask(first![1], t.doi, mailto, firstRemainingMs),
    1,
    firstBudgetMs,
  );
  // Phase 2: the other sources, for the works phase 1 did not settle, while the budget lasts.
  const pending = phase1.examined.filter((_, idx) => {
    const outcome = phase1.results[idx];
    /* v8 ignore next -- mapWithinBudget returns one result per examined target */
    return outcome === undefined || !hasFile(outcome);
  });
  const phase2 =
    pending.length > 0 && remainingMs() > 0
      ? await mapWithinBudget(
          "repositories.copies.rest",
          pending,
          (t) => askRest(t.doi, mailto, rest, remainingMs, pace),
          1,
          remainingMs(),
        )
      : { examined: [] as typeof pending, results: [] as Outcomes[] };
  const restBy = new Map(phase2.examined.map((t, idx) => [posKey(t), phase2.results[idx]]));

  const hits = new Map<string, Partial<CvItem["meta"]>>();
  phase1.examined.forEach((target, idx) => {
    const outcomes = new Map<Source, Outcome>(restBy.get(posKey(target)) ?? []);
    const firstOutcome = phase1.results[idx];
    /* v8 ignore next -- mapWithinBudget returns one result per examined target */
    if (!firstOutcome) return;
    outcomes.set(first![0], firstOutcome);
    const stored = cv.sections[target.s]?.items[target.i]?.meta.repositoryCopies;
    const result = settle(order, outcomes, stored, now);
    hits.set(posKey(target), {
      repositoryCopies: result.copies.length ? result.copies : undefined,
      ...(result.answered ? { repositoryCopiesCheckedAt: now } : {}),
    });
  });

  const sections = applyPass(cv, phase1.examined, hits, { repositoryCopiesTriedAt: now });
  return {
    ...cv,
    sections: withoutStaleCopies(sections, new Set(candidates.map(posKey))),
  };
}
