import type { CanonicalCv, CvItem, CvSection } from "@/lib/canonical/schema";
import {
  applyPass,
  mapWithinBudget,
  posKey,
  rotationQueue,
  type RotationTarget,
} from "@/lib/canonical/enrich";
import { fetchSelfArchivingPermission } from "@/lib/oaworks/client";
import { countableWorks } from "@/lib/render/countable";
import { answeredWithin } from "./freshness";

/**
 * The OWNER sync's self-archiving pass: for each countable journal article with
 * no open copy found and a DOI, the publisher's self-archiving policy as OA.Works
 * records it (`meta.selfArchiving`), for the worklist's rights line.
 *
 * Called from `syncCvForUser` ONLY — which serves the owner's manual sync
 * (`/api/cv/sync`), the first-visit build of `/cv`, and the scheduled re-sync of a
 * published CV's own document — and never from `buildCvFromOrcid`, which the
 * anonymous no-login preview shares: a visitor who pastes an iD triggers no
 * OA.Works call and gets no rights data (`tests/funders-not-public.test.ts` checks
 * both at the source).
 *
 * Polite by construction: sequential (one call at a time, no retry), at most
 * {@link SELF_ARCHIVING_MAX_LOOKUPS} per sync inside {@link SELF_ARCHIVING_BUDGET_MS}
 * of wall clock, never-checked works first, and a work answered within
 * {@link SELF_ARCHIVING_REFRESH_DAYS} days is not asked again — publisher policies
 * move slowly and every record is shown with its dates, so after the first sync a
 * re-sync (the cron's included) makes next to no calls. Fail-soft: a failed call keeps
 * the stored record and stamps the ATTEMPT only, so the work is retried on a later
 * sync BEHIND the works never examined — a DOI that times out on every call would
 * otherwise hold the head of the rotation and spend the whole budget, leaving the
 * rest of the CV unasked (seen in production on 2026-09-16); an answered "no
 * record" clears it. A work that stops being a
 * candidate (an open copy appeared, it was hidden or retracted) loses its record:
 * nothing is stored that the row would not print.
 */

export const SELF_ARCHIVING_MAX_LOOKUPS = 40;
const SELF_ARCHIVING_BUDGET_MS = 12_000;
export const SELF_ARCHIVING_REFRESH_DAYS = 7;

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

/** Drop the record + both sentinels from every item that is no longer a candidate. */
function withoutStaleRecords(sections: CvSection[], candidates: ReadonlySet<string>): CvSection[] {
  return sections.map((section, s) => ({
    ...section,
    items: section.items.map((item, i) =>
      candidates.has(posKey({ s, i })) ||
      (item.meta.selfArchiving === undefined &&
        item.meta.selfArchivingCheckedAt === undefined &&
        item.meta.selfArchivingTriedAt === undefined)
        ? item
        : {
            ...item,
            meta: {
              ...item.meta,
              selfArchiving: undefined,
              selfArchivingCheckedAt: undefined,
              selfArchivingTriedAt: undefined,
            },
          },
    ),
  }));
}

export async function enrichCvWithSelfArchiving(
  cv: CanonicalCv,
  mailto: string,
  now: string = new Date().toISOString(),
): Promise<CanonicalCv> {
  const countable = new Set(countableWorks(cv));
  const candidates: Array<RotationTarget & { doi: string; answeredAt?: string }> = [];
  cv.sections.forEach((section, s) => {
    section.items.forEach((item, i) => {
      if (!isCandidate(item, countable)) return;
      candidates.push({
        s,
        i,
        doi: item.csl!.DOI!,
        // The rotation reads the last ATTEMPT, which is never older than the last
        // answer: a work whose call failed stops counting as never examined and
        // queues behind those still waiting for their first lookup — and a work
        // answered long ago but failing ever since keeps moving back, instead of
        // holding the front of the answered queue on its stale answer date.
        checkedAt: item.meta.selfArchivingTriedAt ?? item.meta.selfArchivingCheckedAt,
        answeredAt: item.meta.selfArchivingCheckedAt,
      });
    });
  });
  // The refresh window keys on the ANSWER, so a failed work is due again on the
  // next sync — only its place in the queue changed.
  const due = candidates.filter(
    (t) => !answeredWithin(t.answeredAt, now, SELF_ARCHIVING_REFRESH_DAYS),
  );
  const targets = rotationQueue(due, SELF_ARCHIVING_MAX_LOOKUPS);

  // Each lookup gets at most what remains of the pass budget (the client also caps
  // it at its own limit), so a lookup started near the deadline ends with it. The
  // budget is not cut further per lookup: a slow record now costs its sync only,
  // not every sync, and a shorter cap would starve a publisher whose record takes
  // longer than it every time.
  const deadline = Date.now() + SELF_ARCHIVING_BUDGET_MS;
  const { examined, results } = await mapWithinBudget(
    "oaworks.permissions",
    targets,
    (t) => fetchSelfArchivingPermission(t.doi, mailto, Math.max(1, deadline - Date.now())),
    1,
    SELF_ARCHIVING_BUDGET_MS,
  );
  const hits = new Map<string, Partial<CvItem["meta"]>>();
  examined.forEach((target, idx) => {
    const lookup = results[idx];
    /* v8 ignore next -- mapWithinBudget returns one result per examined target */
    if (!lookup || lookup.status === "failed") return;
    hits.set(posKey(target), {
      selfArchiving:
        lookup.status === "found"
          ? { source: "oa.works", ...lookup.permission, retrievedAt: now }
          : undefined,
      selfArchivingCheckedAt: now,
    });
  });

  // Every examined work is stamped as TRIED; only an ANSWER also stamps the
  // checked date and writes — or clears — the record.
  const sections = applyPass(cv, examined, hits, { selfArchivingTriedAt: now });
  return {
    ...cv,
    sections: withoutStaleRecords(sections, new Set(candidates.map(posKey))),
  };
}
