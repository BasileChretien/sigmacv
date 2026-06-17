import { type CanonicalCv, type CvItem, type MisattributionSignal } from "./schema";

/**
 * MISATTRIBUTION DETECTION — flagging works that are probably someone else's.
 *
 * SigmaCV matches works to the account holder by identifier (ORCID / OpenAlex
 * author id), never by name string. But OpenAlex tunes its author disambiguation
 * for RECALL over precision, so its dominant error is OVER-MERGING: two real
 * people with the same name fused into one author id. That injects a stranger's
 * papers into a profile — worst for common and East-Asian/pinyin names, where the
 * namesake burden is highest. A conflicting ORCID on the paper already trips
 * `reviewFlag = "orcid-conflict"` (the decisive, near-zero-false-positive signal);
 * this module targets the remaining gap: an OpenAlex-author-id-ONLY match (no
 * confirming ORCID on the paper) that disagrees with the rest of the profile.
 *
 * It is a PURE, fail-soft pass over the already-assembled object (like
 * {@link annotateDuplicates}). It never deletes or hides anything — the flag is
 * advisory; the user decides via the existing "not mine" / "keep hidden" flow,
 * whose decisions ride `included`/`notMine` + `display.dismissedReviewCandidates`
 * and survive re-sync. The verdict itself is RECOMPUTED every build.
 *
 * PRECISION OVER RECALL by design: a wrong flag on a researcher's real paper is an
 * insult about their own work, so a work is flagged ONLY when it fails TWO strong,
 * independent checks. The first — sharing NO co-author with the confirmed works — is
 * MANDATORY (the strongest structural signal); the second is either a different
 * research field+domain OR an author-affiliation institution the user has never been
 * associated with. A temporal outlier ("pre-career") only corroborates; it can never
 * flag a work on its own. Same-field, same-network namesakes are deliberately NOT
 * caught here (that needs embeddings/an LLM judge, out of scope) — the cost of a false
 * positive outweighs that recall.
 *
 * Fairness: the heuristic uses only the user's OWN profile signals (co-authors,
 * field, institutions, year). It never infers, stores, or branches on name
 * ethnicity/origin.
 */

/** Confirmed-co-author set size below which the co-author check is too sparse to
 *  trust (early-career profiles) — it simply doesn't fire. */
const MIN_CONFIRMED_COAUTHORS = 5;
/** Number of identifier-confirmed works carrying a topic below which the field
 *  check is too sparse to trust — it simply doesn't fire. */
const MIN_CONFIRMED_FIELD_WORKS = 3;
/** Author count above which a work is hyper-authorship (large consortia): the
 *  co-author-overlap check is meaningless there, so it's skipped. */
const MAX_AUTHORS_FOR_COAUTHOR_CHECK = 25;
/** A work published more than this many years before the earliest confirmed work
 *  is a temporal outlier (corroborator only). Generous, since researchers publish
 *  during/before training and careers are non-linear. */
const PRE_CAREER_GAP_YEARS = 5;

const WEIGHTS: Record<MisattributionSignal, number> = {
  "no-coauthor-overlap": 0.4,
  "different-field": 0.4,
  "affiliation-novel": 0.3,
  "pre-career": 0.1,
};

/** Normalize a ROR id (URL or bare, any case / trailing slash) for set comparison. */
function normRor(r: string): string {
  return r.trim().toLowerCase().replace(/\/+$/, "");
}

/**
 * The account holder's profile, aggregated from their identifier-CONFIRMED works
 * (matched by ORCID — far stronger than an OpenAlex-author-id-only match). This is
 * the anchor every candidate is scored against; deriving it from ORCID-grade
 * matches (rather than unsupervised clustering) is both simpler and more accurate.
 */
export interface OwnerProfile {
  /** ORCID iDs of co-authors across confirmed works (the owner's own excluded). */
  coauthors: ReadonlySet<string>;
  /** OpenAlex research FIELD names across confirmed works. */
  fields: ReadonlySet<string>;
  /** OpenAlex research DOMAIN names across confirmed works. */
  domains: ReadonlySet<string>;
  /** How many confirmed works carried a topic field (gates the field check). */
  fieldWorkCount: number;
  /** Normalized ROR ids of institutions the user is associated with — from confirmed
   *  works' affiliations AND every positions/education entry (gates + drives the
   *  affiliation check). */
  institutions: ReadonlySet<string>;
  /** Earliest publication year among confirmed works, or undefined. */
  earliestYear?: number;
}

/** A work matched the account holder by ORCID (the strong, confirmed anchor). */
function isConfirmed(item: CvItem): boolean {
  return (
    item.authoredBySelf === true &&
    (item.meta.matchBasis === "orcid" || item.meta.matchBasis === "both")
  );
}

/** A work eligible to be SCORED: matched by OpenAlex author id only (no confirming
 *  ORCID), and carrying no OTHER review flag — only a free slot or this pass's own
 *  flag (so re-annotation is idempotent, like {@link annotateDuplicates}). A
 *  stronger flag (orcid-conflict, duplicate, …) always wins — that's precedence. */
function isScoreCandidate(item: CvItem): boolean {
  return (
    item.authoredBySelf === true &&
    item.meta.matchBasis === "openalex-id" &&
    (item.meta.reviewFlag === undefined || item.meta.reviewFlag === "likely-misattributed")
  );
}

/** Aggregate the owner's identifier-confirmed works into the scoring anchor. */
export function buildOwnerProfile(cv: CanonicalCv): OwnerProfile {
  const coauthors = new Set<string>();
  const fields = new Set<string>();
  const domains = new Set<string>();
  const institutions = new Set<string>();
  let fieldWorkCount = 0;
  let earliestYear: number | undefined;

  for (const s of cv.sections) {
    for (const it of s.items) {
      // The institution of a positions/education entry (ROR-canonicalized) is a place
      // the user is genuinely associated with — collected from EVERY item, not just
      // confirmed works, so a move/affiliation the user listed never looks "novel".
      if (it.meta.rorId) institutions.add(normRor(it.meta.rorId));
      if (!isConfirmed(it)) continue;
      for (const o of it.meta.coauthorOrcids ?? []) coauthors.add(o);
      for (const r of it.meta.workInstitutions ?? []) institutions.add(normRor(r));
      const field = it.meta.topic?.field;
      if (field) {
        fields.add(field);
        fieldWorkCount++;
      }
      const domain = it.meta.topic?.domain;
      if (domain) domains.add(domain);
      const year = it.meta.year;
      if (typeof year === "number" && (earliestYear === undefined || year < earliestYear)) {
        earliestYear = year;
      }
    }
  }

  return { coauthors, fields, domains, institutions, fieldWorkCount, earliestYear };
}

/**
 * Score ONE candidate work against the owner profile. Pure. Returns which signals
 * fired and a 0..1 confidence; `flagged` is true only when the MANDATORY
 * no-coauthor-overlap fires together with at least one of {different-field,
 * affiliation-novel} — the high-precision bar.
 */
export function scoreMisattribution(
  item: CvItem,
  profile: OwnerProfile,
): { flagged: boolean; score: number; signals: MisattributionSignal[] } {
  const signals: MisattributionSignal[] = [];

  // ── Strong: shares no co-author (by ORCID) with the confirmed profile. ──
  // Gated on a dense-enough confirmed co-author set, skipped for hyper-authorship,
  // and only evaluable when the candidate itself carries co-author ORCIDs.
  const candidateCoauthors = item.meta.coauthorOrcids ?? [];
  const authorCount = item.meta.authorCount ?? candidateCoauthors.length + 1;
  if (
    profile.coauthors.size >= MIN_CONFIRMED_COAUTHORS &&
    candidateCoauthors.length > 0 &&
    authorCount <= MAX_AUTHORS_FOR_COAUTHOR_CHECK &&
    candidateCoauthors.every((o) => !profile.coauthors.has(o))
  ) {
    signals.push("no-coauthor-overlap");
  }

  // ── Strong: a different research field, and (when known) a different domain too
  // — a cross-domain mismatch like medicine vs literature. Gated on enough
  // confirmed works carrying a field. ──
  const field = item.meta.topic?.field;
  const domain = item.meta.topic?.domain;
  if (
    profile.fieldWorkCount >= MIN_CONFIRMED_FIELD_WORKS &&
    field !== undefined &&
    !profile.fields.has(field) &&
    (domain === undefined || !profile.domains.has(domain))
  ) {
    signals.push("different-field");
  }

  // ── Strong (alternative 2nd signal): the user's affiliation on this paper is an
  // institution (by ROR) that never appears among their known institutions. Gated on
  // the user actually having known institutions; only evaluable when the candidate
  // carries a ROR'd affiliation. ──
  const candidateInstitutions = (item.meta.workInstitutions ?? []).map(normRor);
  if (
    profile.institutions.size > 0 &&
    candidateInstitutions.length > 0 &&
    candidateInstitutions.every((r) => !profile.institutions.has(r))
  ) {
    signals.push("affiliation-novel");
  }

  // ── Corroborator: published well before the earliest confirmed work. Never
  // flags on its own (see `flagged` below); only adds confidence. ──
  const year = item.meta.year;
  if (
    profile.earliestYear !== undefined &&
    typeof year === "number" &&
    year < profile.earliestYear - PRE_CAREER_GAP_YEARS
  ) {
    signals.push("pre-career");
  }

  // Mandatory no-coauthor-overlap + at least one other strong signal (field OR
  // affiliation). pre-career corroborates only and can never trigger alone.
  const flagged =
    signals.includes("no-coauthor-overlap") &&
    (signals.includes("different-field") || signals.includes("affiliation-novel"));
  const score = flagged
    ? Math.min(
        1,
        signals.reduce((sum, sig) => sum + WEIGHTS[sig], 0),
      )
    : 0;

  return { flagged, score, signals: flagged ? signals : [] };
}

/**
 * Annotate the canonical object's eligible work items with a misattribution hint,
 * recomputed (idempotent) every build. Pure + immutable + FAIL-SOFT: any error
 * returns the input unchanged so detection can never break a build.
 *
 * A scored candidate that clears the bar (no-coauthor-overlap + a field or
 * affiliation mismatch) gets `meta.reviewFlag = "likely-misattributed"` +
 * `meta.misattribution`; every other
 * item has any stale misattribution hint cleared. Items already carrying another
 * review flag are never touched (precedence — see {@link isScoreCandidate}).
 */
export function annotateMisattribution(cv: CanonicalCv): CanonicalCv {
  try {
    const profile = buildOwnerProfile(cv);

    let changed = false;
    const sections = cv.sections.map((s) => {
      let sectionChanged = false;
      const items = s.items.map((it) => {
        const eligible = isScoreCandidate(it);
        const verdict = eligible
          ? scoreMisattribution(it, profile)
          : { flagged: false, score: 0, signals: [] as MisattributionSignal[] };

        if (verdict.flagged) {
          sectionChanged = true;
          return {
            ...it,
            meta: {
              ...it.meta,
              reviewFlag: "likely-misattributed" as const,
              misattribution: { score: verdict.score, signals: verdict.signals },
            },
          };
        }

        // Not flagging: clear any stale hint so the recomputed-every-build invariant
        // holds (an item that previously qualified but no longer does).
        const hadHint =
          it.meta.reviewFlag === "likely-misattributed" || it.meta.misattribution !== undefined;
        if (!hadHint) return it;
        sectionChanged = true;
        const { misattribution: _drop, ...metaRest } = it.meta;
        return {
          ...it,
          meta: {
            ...metaRest,
            reviewFlag:
              it.meta.reviewFlag === "likely-misattributed" ? undefined : it.meta.reviewFlag,
          },
        };
      });
      if (!sectionChanged) return s;
      changed = true;
      return { ...s, items };
    });

    return changed ? { ...cv, sections } : cv;
  } catch {
    // Fail-soft: detection must never break a build/sync.
    return cv;
  }
}
