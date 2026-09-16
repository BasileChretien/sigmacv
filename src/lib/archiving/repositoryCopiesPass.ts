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
import type { CopyLookup, RepositoryCopy } from "@/lib/repositoryCopies/shared";
import { lookupZenodoCopy, ZENODO_MIN_INTERVAL_MS } from "@/lib/repositoryCopies/zenodo";
import { answeredWithin } from "./freshness";

/**
 * The OWNER sync's repository-copies pass: for each countable journal article
 * with no open copy found and a DOI, whether a copy already sits in a repository
 * OpenAlex does not know about (`meta.repositoryCopies`) — HAL, Europe PMC, an
 * OpenAIRE-harvested repository, Zenodo, asked in that order, the order that
 * found the most on a real CV (2026-09-16: 17 of 51 in HAL, one in Europe PMC,
 * none the other two knew — see `repositoryCopies/shared.ts`).
 *
 * Called from `syncCvForUser` ONLY, like the OA.Works pass beside it, never from
 * `buildCvFromOrcid` (the anonymous preview shares that function). Polite by
 * construction: one work at a time, each source once, no retry, at most
 * {@link REPOSITORY_COPIES_MAX_WORKS} works per sync inside
 * {@link REPOSITORY_COPIES_BUDGET_MS} of wall clock, never-checked works first,
 * Zenodo calls spaced by {@link ZENODO_MIN_INTERVAL_MS} (its guest limit), and a
 * work answered within {@link REPOSITORY_COPIES_REFRESH_DAYS} days is not asked
 * again. A source stops the search once a copy WITH A FILE is found: the fact
 * the worklist acts on (the paper is open in a repository). Fail-soft: a source
 * that fails on a work without any copy found leaves the stored copies and
 * stamps the ATTEMPT only, so the work is retried behind the works never
 * examined (the OA.Works pass's lesson); copies found before a later source
 * failed are an answer. A work that stops being a candidate loses its copies.
 */

export const REPOSITORY_COPIES_MAX_WORKS = 20;
const REPOSITORY_COPIES_BUDGET_MS = 12_000;
export const REPOSITORY_COPIES_REFRESH_DAYS = 7;
/** Across the sources, per work (the schema enforces the same). */
const MAX_COPIES = 8;

type Lookup = (doi: string, mailto?: string, timeoutMs?: number) => Promise<CopyLookup>;

/** The sources in the order asked; exported so a test can see the order. */
export const COPY_LOOKUPS: ReadonlyArray<readonly [RepositoryCopy["source"], Lookup]> = [
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

/** A countable journal article with no open copy found and a DOI. */
function isCandidate(item: CvItem, countable: ReadonlySet<CvItem>): boolean {
  return (
    countable.has(item) &&
    item.meta.oaIsOpen === false &&
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

/**
 * The copies one work has, asking each source in turn until one holds a file.
 * `answered` is false when a source failed and nothing was found: the work is
 * then retried later; with copies in hand, a later failure is not worth a retry.
 */
async function lookupCopies(
  doi: string,
  mailto: string,
  lookups: typeof COPY_LOOKUPS,
  remainingMs: () => number,
  pace: { lastZenodo: number; zenodoIntervalMs: number },
): Promise<{ copies: RepositoryCopy[]; answered: boolean }> {
  const copies: RepositoryCopy[] = [];
  let failed = false;
  for (const [source, lookup] of lookups) {
    if (remainingMs() <= 0) {
      failed = true;
      break;
    }
    if (source === "zenodo") {
      const wait = pace.lastZenodo + pace.zenodoIntervalMs - Date.now();
      if (wait > 0) await sleep(Math.min(wait, remainingMs()));
      pace.lastZenodo = Date.now();
    }
    const result = await lookup(doi, mailto, Math.max(1, remainingMs()));
    if (result.status === "failed") {
      failed = true;
      continue;
    }
    if (result.status === "found") {
      copies.push(...result.copies);
      if (result.copies.some((c) => c.hasFile)) break;
    }
  }
  return { copies: copies.slice(0, MAX_COPIES), answered: copies.length > 0 || !failed };
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
  const candidates: Array<RotationTarget & { doi: string; answeredAt?: string }> = [];
  cv.sections.forEach((section, s) => {
    section.items.forEach((item, i) => {
      if (!isCandidate(item, countable)) return;
      candidates.push({
        s,
        i,
        doi: item.csl!.DOI!,
        // The rotation reads the last ATTEMPT; the refresh window keys on the ANSWER.
        checkedAt: item.meta.repositoryCopiesTriedAt ?? item.meta.repositoryCopiesCheckedAt,
        answeredAt: item.meta.repositoryCopiesCheckedAt,
      });
    });
  });
  const due = candidates.filter(
    (t) => !answeredWithin(t.answeredAt, now, REPOSITORY_COPIES_REFRESH_DAYS),
  );
  const targets = rotationQueue(due, REPOSITORY_COPIES_MAX_WORKS);

  const deadline = Date.now() + REPOSITORY_COPIES_BUDGET_MS;
  const remainingMs = () => deadline - Date.now();
  const { examined, results } = await mapWithinBudget(
    "repositories.copies",
    targets,
    (t) => lookupCopies(t.doi, mailto, lookups, remainingMs, pace),
    1,
    REPOSITORY_COPIES_BUDGET_MS,
  );
  const hits = new Map<string, Partial<CvItem["meta"]>>();
  examined.forEach((target, idx) => {
    const lookup = results[idx];
    /* v8 ignore next -- mapWithinBudget returns one result per examined target */
    if (!lookup || !lookup.answered) return;
    hits.set(posKey(target), {
      repositoryCopies: lookup.copies.length
        ? lookup.copies.map((c) => ({ ...c, retrievedAt: now }))
        : undefined,
      repositoryCopiesCheckedAt: now,
    });
  });

  const sections = applyPass(cv, examined, hits, { repositoryCopiesTriedAt: now });
  return {
    ...cv,
    sections: withoutStaleCopies(sections, new Set(candidates.map(posKey))),
  };
}
