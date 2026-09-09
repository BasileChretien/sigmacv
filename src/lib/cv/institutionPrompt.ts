import type { InstitutionPageState, VisibleAffiliation } from "@/lib/cv/institutionConsent";

/**
 * The active-choice institution prompt and the worklist's "Institution
 * listing" status line — the DISCOVERABILITY half of the institution consents.
 *
 * The consents themselves stay OFF by default (a pre-ticked box is not consent:
 * CJEU C-673/17 Planet49; EDPB guidelines 05/2020), and the privacy notice
 * promises exactly that. What this module adds is the moment: the choice is
 * put in front of the researcher once, when it can apply (a published,
 * indexable page and a current position linked to a ROR record), and stays
 * visible in the worklist until made. Nothing is decided by silence — "Not
 * now" sends no request and is remembered per SET of ROR ids, so a new
 * affiliation asks again, as the consent design promises. A "yes" is one
 * request carrying the FULL current publish state (the route treats every
 * omitted flag as false) plus the three listing fields.
 */

/** The publish state the editor tracks (a GET /api/cv/publish answer, keyed
 *  as the host stores it). Structurally the same shape `PublishControls`
 *  reports through `onPublishStateChange`. */
export interface PublishSnapshot {
  published: boolean;
  slug: string | null;
  indexable: boolean;
  listUnderAffiliation: boolean;
  affiliationRorId: string | null;
  institutionPage: InstitutionPageState;
}

/** Versioned so a future change of the disclosure can re-ask everyone once. */
export const INSTITUTION_PROMPT_KEY_PREFIX = "sigmacv:institution-listing-prompt-v1:";

/** A canonical key for a set of ROR ids: order-independent, deduplicated. */
export function affiliationSetKey(rorIds: readonly string[]): string {
  return [...new Set(rorIds)].sort().join("+");
}

/** The localStorage key under which an answer for this set is remembered. */
export function promptDismissalKey(rorIds: readonly string[]): string {
  return `${INSTITUTION_PROMPT_KEY_PREFIX}${affiliationSetKey(rorIds)}`;
}

/** The two localStorage methods the prompt needs (injectable for tests). */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** The browser's localStorage, or null on the server / when access throws
 *  (private mode, cookies blocked) — the prompt then simply shows. */
export function browserStorage(): StorageLike | null {
  try {
    return (globalThis as { localStorage?: StorageLike }).localStorage ?? null;
  } catch {
    return null;
  }
}

/** Whether the researcher already answered ("Not now", "Yes", or a later
 *  withdrawal) for exactly this set of ROR ids. An empty set is never asked. */
export function isPromptDismissed(
  rorIds: readonly string[],
  storage: StorageLike | null = browserStorage(),
): boolean {
  if (rorIds.length === 0 || !storage) return false;
  try {
    return storage.getItem(promptDismissalKey(rorIds)) === "1";
  } catch {
    return false;
  }
}

/** Remember an answer for this set of ROR ids (best-effort: a blocked storage
 *  only means the prompt may show again after a reload). */
export function rememberPromptDismissal(
  rorIds: readonly string[],
  storage: StorageLike | null = browserStorage(),
): void {
  if (rorIds.length === 0 || !storage) return;
  try {
    storage.setItem(promptDismissalKey(rorIds), "1");
  } catch {
    /* non-fatal */
  }
}

/** Whether the CV is in this institution's OAI-PMH set. That set is keyed by
 *  the ONE position the server picked (`affiliationRorId`), so the consent
 *  applies to that id alone — never to every current affiliation. */
function inRepositorySet(state: PublishSnapshot, rorId: string): boolean {
  return state.listUnderAffiliation && state.affiliationRorId === rorId;
}

/** Whether the CV is on this institution's page (the pinned-id consent). */
function onInstitutionPage(state: PublishSnapshot, rorId: string): boolean {
  return (
    state.institutionPage.showOnInstitutionPage &&
    state.institutionPage.consentedRorIds.includes(rorId)
  );
}

/**
 * The two consents are two SURFACES, and a researcher can be on one without
 * the other — so collapsing them into one boolean would tell someone already
 * on the institution's page that they are "not yet listed" and ask again.
 * Four states, named for what is true:
 *  • `both`      — in the repository set AND on the institution page;
 *  • `page-only` — on the institution page, not in the repository set;
 *  • `set-only`  — in the repository set, not on the institution page;
 *  • `none`      — on NEITHER: the only state the prompt asks about.
 */
export type AffiliationListingState = "none" | "page-only" | "set-only" | "both";

export function affiliationListingState(
  state: PublishSnapshot,
  rorId: string,
): AffiliationListingState {
  const inSet = inRepositorySet(state, rorId);
  const onPage = onInstitutionPage(state, rorId);
  if (inSet && onPage) return "both";
  if (onPage) return "page-only";
  if (inSet) return "set-only";
  return "none";
}

function affiliationsInState(
  state: PublishSnapshot,
  want: AffiliationListingState,
): VisibleAffiliation[] {
  return state.institutionPage.currentAffiliations.filter(
    (a) => affiliationListingState(state, a.rorId) === want,
  );
}

/** The visible current affiliations (ROR-linked) the CV is listed under on
 *  BOTH surfaces. */
export function listedAffiliations(state: PublishSnapshot): VisibleAffiliation[] {
  return affiliationsInState(state, "both");
}

/** The visible current affiliations (ROR-linked) the CV is on NEITHER surface
 *  for — the open choice the prompt and the worklist line put forward. */
export function unlistedAffiliations(state: PublishSnapshot): VisibleAffiliation[] {
  return affiliationsInState(state, "none");
}

/** On the institution's page, but not in its OAI-PMH set. */
export function pageOnlyAffiliations(state: PublishSnapshot): VisibleAffiliation[] {
  return affiliationsInState(state, "page-only");
}

/** In the institution's OAI-PMH set, but not on its page. */
export function setOnlyAffiliations(state: PublishSnapshot): VisibleAffiliation[] {
  return affiliationsInState(state, "set-only");
}

/** A listing can only be given on a published, indexable page (both consents
 *  require indexing; the server clears them without it). */
export function canListNow(state: PublishSnapshot): boolean {
  return state.published && state.indexable;
}

/** The visibility rule of the one-time prompt: the page is live and indexable,
 *  at least one current affiliation is not yet listed, and the researcher has
 *  not already answered for this set of ROR ids. */
export function shouldOfferInstitutionPrompt(state: PublishSnapshot, dismissed: boolean): boolean {
  return !dismissed && canListNow(state) && unlistedAffiliations(state).length > 0;
}

/** The body one "yes" posts: the FULL current publish state (every omitted
 *  flag would read as false) plus the three listing fields. Ids already
 *  stored are KEPT — a lapsed id resumes if that affiliation becomes current
 *  again — and the ticked ones are added. */
export interface InstitutionListingBody {
  published: boolean;
  indexable: boolean;
  listUnderAffiliation: true;
  showOnInstitutionPage: true;
  consentedRorIds: string[];
  shareReconciliationRows: boolean;
}

export function institutionListingBody(
  state: PublishSnapshot,
  rorIds: readonly string[],
): InstitutionListingBody {
  return {
    published: state.published,
    indexable: state.indexable,
    listUnderAffiliation: true,
    showOnInstitutionPage: true,
    consentedRorIds: [...new Set([...state.institutionPage.consentedRorIds, ...rorIds])],
    shareReconciliationRows: state.institutionPage.shareReconciliationRows,
  };
}

/** The API's answer shape (POST and GET /api/cv/publish). */
interface PublishStateResponse extends InstitutionPageState {
  published: boolean;
  publicSlug: string | null;
  indexable: boolean;
  listUnderAffiliation: boolean;
  affiliationRorId: string | null;
}

function isPublishStateResponse(data: unknown): data is PublishStateResponse {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  const nullableString = (v: unknown) => v === null || typeof v === "string";
  return (
    typeof d.published === "boolean" &&
    nullableString(d.publicSlug) &&
    typeof d.indexable === "boolean" &&
    typeof d.listUnderAffiliation === "boolean" &&
    nullableString(d.affiliationRorId) &&
    typeof d.showOnInstitutionPage === "boolean" &&
    Array.isArray(d.consentedRorIds) &&
    Array.isArray(d.currentAffiliations) &&
    Array.isArray(d.visibleCurrentRorIds) &&
    Array.isArray(d.lapsedRorIds) &&
    typeof d.shareReconciliationRows === "boolean"
  );
}

/** The API answer as the snapshot the host tracks, or null when the shape is
 *  not the full publish state (the caller then leaves its state untouched). */
export function publishSnapshotFromResponse(data: unknown): PublishSnapshot | null {
  if (!isPublishStateResponse(data)) return null;
  return {
    published: data.published,
    slug: data.publicSlug,
    indexable: data.indexable,
    listUnderAffiliation: data.listUnderAffiliation,
    affiliationRorId: data.affiliationRorId,
    institutionPage: {
      showOnInstitutionPage: data.showOnInstitutionPage,
      consentedRorIds: data.consentedRorIds,
      currentAffiliations: data.currentAffiliations,
      visibleCurrentRorIds: data.visibleCurrentRorIds,
      lapsedRorIds: data.lapsedRorIds,
      shareReconciliationRows: data.shareReconciliationRows,
    },
  };
}

/** ONE request that lists the CV under `rorIds` (the full state + the three
 *  fields), answering the server's state or null on any failure — the caller
 *  shows the generic publish error and leaves its state as it was. */
export async function postInstitutionListing(
  state: PublishSnapshot,
  rorIds: readonly string[],
): Promise<PublishSnapshot | null> {
  try {
    const res = await fetch("/api/cv/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(institutionListingBody(state, rorIds)),
    });
    if (!res.ok) return null;
    return publishSnapshotFromResponse(await res.json());
  } catch {
    return null;
  }
}
