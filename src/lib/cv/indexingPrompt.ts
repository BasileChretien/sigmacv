import {
  browserStorage,
  publishSnapshotFromResponse,
  type PublishSnapshot,
  type StorageLike,
} from "./institutionPrompt";

/**
 * The active-choice INDEXING prompt and the worklist's "Search indexing"
 * status line — the discoverability half of the publish consents, one step
 * before the institution listing (which requires indexing).
 *
 * Indexing stays OFF by default: a pre-ticked box is not consent (CJEU
 * C-673/17 Planet49; EDPB guidelines 05/2020), and the privacy notice promises
 * exactly that. What this module adds is the moment: once the page is live and
 * not yet indexable, the choice is put in front of the researcher once, and
 * stays visible in the worklist until made. Nothing is decided by silence —
 * "Not now" sends no request and is remembered per PAGE (its slug), so a page
 * published afresh asks again. A "yes" is one request carrying the FULL current
 * publish state (the route treats every omitted flag as false) with
 * `indexable: true`.
 */

/** Versioned so a future change of the disclosure can re-ask everyone once. */
export const INDEXING_PROMPT_KEY_PREFIX = "sigmacv:indexing-prompt-v1:";

/** The localStorage key under which an answer for this page is remembered. */
export function indexingPromptKey(slug: string): string {
  return INDEXING_PROMPT_KEY_PREFIX + slug;
}

/** Whether the researcher already answered ("Not now" or "Yes") for this page.
 *  An unpublished CV (no slug) is never asked. */
export function isIndexingPromptDismissed(
  slug: string | null,
  storage: StorageLike | null = browserStorage(),
): boolean {
  if (!slug || !storage) return false;
  try {
    return storage.getItem(indexingPromptKey(slug)) === "1";
  } catch {
    return false;
  }
}

/** Remember an answer for this page (best-effort: a blocked storage only
 *  means the prompt may show again after a reload). */
export function rememberIndexingPromptDismissal(
  slug: string | null,
  storage: StorageLike | null = browserStorage(),
): void {
  if (!slug || !storage) return;
  try {
    storage.setItem(indexingPromptKey(slug), "1");
  } catch {
    /* non-fatal */
  }
}

/** The visibility rule of the one-time prompt: the page is live, not yet
 *  indexable, and the researcher has not already answered for it. */
export function shouldOfferIndexingPrompt(state: PublishSnapshot, dismissed: boolean): boolean {
  return !dismissed && state.published && state.slug !== null && !state.indexable;
}

/**
 * The worklist line's state, named for what is true:
 *  • `unpublished` — no live page: nothing to decide (the line is not shown);
 *  • `undecided`   — live, not indexable, not yet answered: the open choice;
 *  • `off`         — live, not indexable, answered "Not now";
 *  • `on`          — indexable.
 */
export type IndexingWorklistState = "unpublished" | "undecided" | "off" | "on";

export function indexingWorklistState(
  state: PublishSnapshot,
  dismissed: boolean,
): IndexingWorklistState {
  if (!state.published || state.slug === null) return "unpublished";
  if (state.indexable) return "on";
  return dismissed ? "off" : "undecided";
}

/** The body one "yes" posts: the FULL current publish state (every omitted
 *  flag would read as false) with indexing switched on. The institution
 *  consents are carried unchanged — a "yes" to indexing is never a "yes" to
 *  listing, which is asked separately, afterwards. */
export interface IndexingBody {
  published: true;
  indexable: true;
  listUnderAffiliation: boolean;
  showOnInstitutionPage: boolean;
  consentedRorIds: string[];
  shareReconciliationRows: boolean;
}

export function indexingBody(state: PublishSnapshot): IndexingBody {
  return {
    published: true,
    indexable: true,
    listUnderAffiliation: state.listUnderAffiliation,
    showOnInstitutionPage: state.institutionPage.showOnInstitutionPage,
    consentedRorIds: [...state.institutionPage.consentedRorIds],
    shareReconciliationRows: state.institutionPage.shareReconciliationRows,
  };
}

/** ONE request that switches indexing on, answering the server's state or
 *  null on any failure — the caller shows the generic publish error and
 *  leaves its state as it was. */
export async function postIndexing(
  state: PublishSnapshot,
  fetchImpl: typeof fetch = fetch,
): Promise<PublishSnapshot | null> {
  try {
    const res = await fetchImpl("/api/cv/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(indexingBody(state)),
    });
    if (!res.ok) return null;
    return publishSnapshotFromResponse(await res.json());
  } catch {
    return null;
  }
}
