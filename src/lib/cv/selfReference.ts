import type { CanonicalCv } from "@/lib/canonical/schema";
import { countableWorks } from "@/lib/render/countable";

/**
 * SELF-REFERENCING SHARE — OWNER-ONLY.
 *
 * The share of the references in the owner's papers that point at the owner's
 * own works: Σ `meta.selfRefs` ÷ Σ `meta.refCount` over the countable works that
 * carry a reference list. A ratio of sums, not a mean of per-work ratios, so a
 * two-reference note cannot dominate a fifty-reference review.
 *
 * This figure is surfaced to the OWNER only, as information in the editor's
 * health panel (a fact some assessment panels look at), and is NEVER rendered
 * on any CV output, the public page, or the machine downloads — the per-work
 * counts it is built from are stripped by the public projection for the same
 * reason. Self-citation is a normal part of a research programme (a lab citing
 * its own prior work), so a high share is not a fault; but it is a number an
 * owner should know before a panel points it out. It is not a score and must
 * not be turned into one.
 */
export interface SelfReferenceShare {
  /** Σ selfRefs ÷ Σ refCount, 0..1. */
  share: number;
  /** Number of works the ratio is computed over (those with `refCount > 0`). */
  works: number;
  selfRefs: number;
  refCount: number;
}

/** Below this share the notice is not shown at all. */
export const SELF_REFERENCE_MIN_SHARE = 0.3;
/** Below this many works with references the ratio is too noisy to mention. */
export const SELF_REFERENCE_MIN_WORKS = 10;

/**
 * The owner's self-referencing share over the countable works with a reference
 * list, or undefined when no work carries reference counts (a CV synced before
 * the counts existed, or a corpus OpenAlex holds no reference lists for).
 */
export function selfReferenceShare(cv: CanonicalCv): SelfReferenceShare | undefined {
  let works = 0;
  let selfRefs = 0;
  let refCount = 0;
  for (const w of countableWorks(cv)) {
    const refs = w.meta.refCount;
    if (typeof refs !== "number" || refs <= 0) continue;
    works += 1;
    refCount += refs;
    selfRefs += Math.min(refs, Math.max(0, w.meta.selfRefs ?? 0));
  }
  if (works === 0) return undefined;
  return { share: selfRefs / refCount, works, selfRefs, refCount };
}

/**
 * The share when it is worth telling the owner: at least
 * {@link SELF_REFERENCE_MIN_SHARE} over at least {@link SELF_REFERENCE_MIN_WORKS}
 * works. Undefined otherwise — a low share is unremarkable and a small sample is
 * noise, and the panel stays quiet rather than nag.
 */
export function selfReferenceNotice(cv: CanonicalCv): SelfReferenceShare | undefined {
  const s = selfReferenceShare(cv);
  if (!s) return undefined;
  if (s.works < SELF_REFERENCE_MIN_WORKS || s.share < SELF_REFERENCE_MIN_SHARE) return undefined;
  return s;
}
