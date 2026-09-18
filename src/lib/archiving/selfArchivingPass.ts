import type { CanonicalCv, CvItem, CvSection } from "@/lib/canonical/schema";
import {
  applyPass,
  mapWithinBudget,
  posKey,
  rotationQueue,
  type RotationTarget,
} from "@/lib/canonical/enrich";
import { fetchSelfArchivingPermission } from "@/lib/oaworks/client";
import {
  fetchJournalPolicy,
  issnList,
  permissionFor,
  type JournalPolicy,
  type JournalPolicyLookup,
} from "@/lib/openPolicyFinder/client";
import { countableWorks } from "@/lib/render/countable";
import { embargoRunFor } from "./depositNow";
import { answeredWithin } from "./freshness";
import type { RouteJudge } from "./policyRoutes";
import { placeFitsLocations, type PlaceKind } from "./repositoryDirectory";

/**
 * The OWNER sync's publisher-policy pass: for each countable journal article
 * with no open copy found and a DOI, the publisher's self-archiving policy
 * (`meta.selfArchiving`), for the worklist's rights line — from Jisc Open Policy
 * Finder by the journal's ISSN when a key is configured and the journal has a
 * record there (maintained, and dated in months rather than years), else from
 * OA.Works by the article's DOI. The record names its source, and every line
 * built from it credits that source. An Open Policy Finder record keeps every
 * route of the journal's policy SigmaCV may name, with a default
 * (`permissionFor`); the worklist row picks the one for its destination.
 *
 * Called from `syncCvForUser` ONLY — which serves the owner's manual sync
 * (`/api/cv/sync`), the first-visit build of `/cv`, and the scheduled re-sync of a
 * published CV's own document — and never from `buildCvFromOrcid`, which the
 * anonymous no-login preview shares: a visitor who pastes an iD triggers no
 * policy call and gets no rights data (`tests/funders-not-public.test.ts` checks
 * both at the source).
 *
 * Polite by construction, and within what Jisc was told (lookups by ISSN, a
 * journal asked at most once a week): a few calls in flight
 * ({@link SELF_ARCHIVING_CONCURRENCY}), no retry. A journal is asked by the ISSN
 * most of the owner's articles in it share, so its print and electronic ISSNs
 * are one call. What Open Policy Finder answered for a journal within
 * {@link SELF_ARCHIVING_REFRESH_DAYS} days — the routes stored with a record, or
 * "none", stamped apart (`selfArchivingOpfAt`) — is reused for an article newly
 * due, instead of asking again; when a journal is asked, every one of the
 * owner's articles in it takes the answer, so the journal falls due again as
 * one. A key that is not accepted (401/403) stops the calls for the rest of the
 * sync. Every work due is asked inside {@link SELF_ARCHIVING_BUDGET_MS} (a CV is
 * answered in one sync), never-checked works first; a work answered within the
 * refresh window is not asked again.
 *
 * Fail-soft: a failed call keeps the stored record and stamps the ATTEMPT only,
 * so the work is retried on a later sync BEHIND the works never examined (a DOI
 * that times out on every call would otherwise hold the head of the rotation —
 * production, 2026-09-16); an answered "no record" clears it. When Open Policy
 * Finder fails or does not accept the key, a work whose stored record came from
 * it keeps that record; any other asks OA.Works. An Open Policy Finder record
 * is dropped when Open Policy Finder answers that it has none for the journal,
 * or when it can no longer be asked (no key configured, no readable ISSN) —
 * replaced by OA.Works' answer, or by nothing. A work that stops being a
 * candidate loses its record: nothing is stored that the row would not print.
 */

export const SELF_ARCHIVING_MAX_LOOKUPS = 400;
const SELF_ARCHIVING_BUDGET_MS = 15_000;
const SELF_ARCHIVING_CONCURRENCY = 3;
export const SELF_ARCHIVING_REFRESH_DAYS = 7;
/**
 * Open Policy Finder went live in the owner sync on this date: a record answered
 * before it, and not from Open Policy Finder, is asked again once — whatever its
 * refresh window says — when a key is configured and the work has an ISSN.
 */
export const POLICY_FINDER_SINCE = "2026-09-18T00:00:00.000Z";

type Source = NonNullable<CvItem["meta"]["selfArchiving"]>["source"];
type Meta = CvItem["meta"];

export interface SelfArchivingOptions {
  /** Jisc Open Policy Finder API key; without one only OA.Works is asked. */
  policyFinderKey?: string;
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

/** Drop the record + its sentinels from every item that is no longer a candidate. */
function withoutStaleRecords(sections: CvSection[], candidates: ReadonlySet<string>): CvSection[] {
  return sections.map((section, s) => ({
    ...section,
    items: section.items.map((item, i) =>
      candidates.has(posKey({ s, i })) ||
      (item.meta.selfArchiving === undefined &&
        item.meta.selfArchivingCheckedAt === undefined &&
        item.meta.selfArchivingTriedAt === undefined &&
        item.meta.selfArchivingOpfAt === undefined &&
        item.meta.selfArchivingOpfIssn === undefined)
        ? item
        : {
            ...item,
            meta: {
              ...item.meta,
              selfArchiving: undefined,
              selfArchivingCheckedAt: undefined,
              selfArchivingTriedAt: undefined,
              selfArchivingOpfAt: undefined,
              selfArchivingOpfIssn: undefined,
            },
          },
    ),
  }));
}

/** What Open Policy Finder said about a journal, and when (`at`). */
type JournalAnswer =
  | { status: "found"; policy: JournalPolicy; at: string; retrievedAt: string }
  | { status: "none"; at: string }
  | { status: "failed" }
  | { status: "unauthorized" };
type Answered = Extract<JournalAnswer, { at: string }>;

/** Every place the worklist may deposit in: the stored default favours the route most accept. */
const PLACES: readonly PlaceKind[] = ["hal", "zenodo", "arxiv", "other"];

/** The work still lists the ISSN its Open Policy Finder answer was for (none stamped: yes). */
const answerStillFits = (t: { issns: readonly string[]; opfIssn?: string }): boolean =>
  t.opfIssn === undefined || t.issns.includes(t.opfIssn);

/**
 * The journal answers still fresh among the owner's articles: the routes kept
 * with an Open Policy Finder record, or "none" (a fresh stamp beside another
 * source's record, or no record) — the most recent per ISSN, from works that
 * still list the ISSN the answer was for.
 */
function freshAnswers(
  candidates: ReadonlyArray<{
    issn?: string;
    issns: readonly string[];
    opfIssn?: string;
    opfAt?: string;
    item: CvItem;
  }>,
  now: string,
): Map<string, Answered> {
  const fresh = new Map<string, Answered>();
  for (const t of candidates) {
    const { issn, opfAt, item } = t;
    if (issn === undefined || !answeredWithin(opfAt, now, SELF_ARCHIVING_REFRESH_DAYS)) continue;
    if (!answerStillFits(t)) continue;
    const record = item.meta.selfArchiving;
    let answer: Answered | undefined;
    if (record?.source !== "open-policy-finder") {
      answer = { status: "none", at: opfAt! };
    } else if (record.routes) {
      const policy = {
        routes: record.routes,
        recordUpdated: record.recordUpdated,
        policyUrl: record.policyUrl,
      };
      answer = { status: "found", policy, at: opfAt!, retrievedAt: record.retrievedAt };
    }
    const held = fresh.get(issn);
    if (answer && !(held && held.at >= answer.at)) fresh.set(issn, answer);
  }
  return fresh;
}

export async function enrichCvWithSelfArchiving(
  cv: CanonicalCv,
  mailto: string,
  now: string = new Date().toISOString(),
  options: SelfArchivingOptions = {},
): Promise<CanonicalCv> {
  const key = options.policyFinderKey?.trim() || undefined;
  const today = now.slice(0, 10);
  const countable = new Set(countableWorks(cv));
  const works: Array<{ s: number; i: number; item: CvItem; issns: string[] }> = [];
  cv.sections.forEach((section, s) => {
    section.items.forEach((item, i) => {
      if (!isCandidate(item, countable)) return;
      works.push({ s, i, item, issns: key ? issnList(item.csl!.ISSN) : [] });
    });
  });
  // A journal's print and electronic ISSNs name one journal: each work is asked
  // about by the ISSN most of the owner's works share, so the journal is one call.
  const shared = new Map<string, number>();
  for (const { issns } of works) {
    for (const issn of issns) shared.set(issn, (shared.get(issn) ?? 0) + 1);
  }
  type Candidate = RotationTarget & {
    item: CvItem;
    doi: string;
    issns: string[];
    issn?: string;
    stored?: Source;
    answeredAt?: string;
    opfAt?: string;
    opfIssn?: string;
  };
  const candidates: Candidate[] = works.map(({ s, i, item, issns }) => ({
    s,
    i,
    item,
    doi: item.csl!.DOI!,
    issns,
    issn: issns.reduce<string | undefined>(
      (best, issn) => (best === undefined || shared.get(issn)! > shared.get(best)! ? issn : best),
      undefined,
    ),
    stored: item.meta.selfArchiving?.source,
    // The rotation reads the last ATTEMPT, which is never older than the last
    // answer: a work whose call failed stops counting as never examined and
    // queues behind those still waiting for their first lookup.
    checkedAt: item.meta.selfArchivingTriedAt ?? item.meta.selfArchivingCheckedAt,
    answeredAt: item.meta.selfArchivingCheckedAt,
    opfAt: item.meta.selfArchivingOpfAt,
    opfIssn: item.meta.selfArchivingOpfIssn,
  }));
  // The refresh window keys on the ANSWER, so a failed work is due again on the
  // next sync — only its place in the queue changed. A record answered before
  // Open Policy Finder was wired in is due once, when it can be asked; so is a
  // work that no longer lists the ISSN its Open Policy Finder answer was for.
  const due = candidates.filter(
    (t) =>
      !answeredWithin(t.answeredAt, now, SELF_ARCHIVING_REFRESH_DAYS) ||
      (t.issn !== undefined &&
        ((t.stored !== "open-policy-finder" && (t.answeredAt ?? "") < POLICY_FINDER_SINCE) ||
          !answerStillFits(t))),
  );
  const queued = rotationQueue(due, SELF_ARCHIVING_MAX_LOOKUPS);
  const fresh = freshAnswers(candidates, now);
  // The journals asked this sync: those of the queued works with no fresh answer.
  // Every article of an asked journal takes the answer (its siblings are
  // examined too), so the journal falls due again as one.
  const asked = new Set(
    queued.flatMap((t) => (t.issn !== undefined && !fresh.has(t.issn) ? [t.issn] : [])),
  );
  const inQueue = new Set(queued.map(posKey));
  const targets = [
    ...queued,
    ...candidates.filter(
      (t) => t.issn !== undefined && asked.has(t.issn) && !inQueue.has(posKey(t)),
    ),
  ];

  // Each lookup gets at most what remains of the pass budget (the clients also cap
  // it at their own limit), so a lookup started near the deadline ends with it.
  const deadline = Date.now() + SELF_ARCHIVING_BUDGET_MS;
  const remaining = () => Math.max(1, deadline - Date.now());
  // One Open Policy Finder call per journal per sync: the articles of a journal share it.
  const calls = new Map<string, Promise<JournalPolicyLookup>>();
  let refused = false;
  const journal = async (issn: string): Promise<JournalAnswer | undefined> => {
    const held = fresh.get(issn);
    if (held) return held;
    let call = calls.get(issn);
    if (!call) {
      // A key not accepted: no more calls this sync.
      if (refused) return undefined;
      call = fetchJournalPolicy(issn, key!, mailto, remaining());
      calls.set(issn, call);
    }
    const answer = await call;
    if (answer.status === "unauthorized") refused = true;
    if (answer.status === "found") return { ...answer, at: now, retrievedAt: now };
    if (answer.status === "none") return { status: "none", at: now };
    return answer;
  };
  const judgeFor = (item: CvItem): RouteJudge => ({
    openToday: embargoRunFor(item, today),
    fit: (locations) => PLACES.filter((place) => placeFitsLocations(place, locations)).length,
  });

  /** The work's new fields; null leaves it as it is (the attempt is still stamped). */
  const lookup = async (t: Candidate): Promise<Partial<Meta> | null> => {
    const answer = key && t.issn ? await journal(t.issn) : undefined;
    if (answer?.status === "found") {
      const permission = permissionFor(answer.policy, judgeFor(t.item));
      return {
        selfArchiving: {
          source: "open-policy-finder",
          ...permission,
          retrievedAt: answer.retrievedAt,
        },
        // Dated with the journal's answer, so its articles fall due together.
        selfArchivingCheckedAt: answer.at,
        selfArchivingOpfAt: answer.at,
        selfArchivingOpfIssn: t.issn,
      };
    }
    const opfNone =
      answer?.status === "none"
        ? { selfArchivingOpfAt: answer.at, selfArchivingOpfIssn: t.issn }
        : {};
    const opfRecord = t.stored === "open-policy-finder";
    // Open Policy Finder could be asked but gave no answer (it failed, or does
    // not accept the key): its record for this journal stays on screen until it
    // answers.
    if (opfRecord && answerStillFits(t) && key && t.issn && answer?.status !== "none") {
      return null;
    }
    // A sibling of an asked journal is not due itself: it takes Open Policy
    // Finder's answer only — unless "none" retires its Open Policy Finder record.
    if (!inQueue.has(posKey(t)) && !(opfRecord && answer?.status === "none")) {
      return answer?.status === "none" ? opfNone : null;
    }
    const result = await fetchSelfArchivingPermission(t.doi, mailto, remaining());
    if (result.status !== "failed") {
      return {
        selfArchiving:
          result.status === "found"
            ? { source: "oa.works", ...result.permission, retrievedAt: now }
            : undefined,
        selfArchivingCheckedAt: now,
        ...opfNone,
      };
    }
    // OA.Works failed. An Open Policy Finder record goes all the same once Open
    // Policy Finder has none for the journal, can no longer be asked (no key
    // configured, no readable ISSN), or was another ISSN's — nothing is shown
    // that its source would not show today.
    if (opfRecord) return { selfArchiving: undefined, ...opfNone };
    return answer?.status === "none" ? opfNone : null;
  };

  const { examined, results } = await mapWithinBudget(
    "archiving.policies",
    targets,
    lookup,
    SELF_ARCHIVING_CONCURRENCY,
    SELF_ARCHIVING_BUDGET_MS,
  );
  const hits = new Map<string, Partial<Meta>>();
  examined.forEach((target, idx) => {
    const fields = results[idx];
    if (fields) hits.set(posKey(target), fields);
  });

  // Every examined work is stamped as TRIED; only an ANSWER also stamps the
  // checked date and writes — or clears — the record.
  const sections = applyPass(cv, examined, hits, { selfArchivingTriedAt: now });
  return {
    ...cv,
    sections: withoutStaleRecords(sections, new Set(candidates.map(posKey))),
  };
}
