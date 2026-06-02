import type { CanonicalCv } from "./schema";

/**
 * Read interface for a FUTURE (v2) "push 'not mine' corrections upstream to
 * OpenAlex" job. We build NO push logic here — the canonical document
 * (`Cv.document`) is the durable store of assertions; this selector just
 * surfaces the (work, author-identifiers) pairs a curation push would need.
 *
 * Identifier-anchored, per the brief's "never by name string" rule: it joins
 * the owner's OpenAlex author ids with each asserted work's source id.
 */
export interface PendingNotMineAssertion {
  itemId: string;
  /** OpenAlex work URL/id the assertion is about. */
  openAlexWorkId: string;
  /** The account holder's OpenAlex author ids (the disputed attribution). */
  authorIds: string[];
  assertedAt?: string;
}

export function pendingNotMineAssertions(
  cv: CanonicalCv,
): PendingNotMineAssertion[] {
  const out: PendingNotMineAssertion[] = [];
  for (const section of cv.sections) {
    for (const item of section.items) {
      if (item.notMine && item.source === "openalex") {
        out.push({
          itemId: item.id,
          openAlexWorkId: item.sourceId,
          authorIds: cv.owner.openAlexAuthorIds,
          assertedAt: item.notMineAssertedAt,
        });
      }
    }
  }
  return out;
}
