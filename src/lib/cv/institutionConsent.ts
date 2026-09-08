import { safeParseCanonicalCv, type CanonicalCv } from "@/lib/canonical/schema";
import {
  positionInstitutionNames,
  positionRorId,
  visibleCurrentPositions,
} from "@/lib/cv/currentPositions";

/**
 * Institution-page consent (`Cv.showOnInstitutionPage` + `Cv.consentedRorIds`).
 *
 * The consent is PINNED to ROR ids the researcher ticks among their visible
 * current positions, and is never re-derived from the document on a write —
 * unlike the OAI set key (`Cv.currentRorId`), which follows the first current
 * position on every save. A consent given at one institution therefore cannot
 * migrate to the next: when a consented id is no longer among the visible
 * current positions it is LAPSED — kept in the row (shown in the editor with a
 * per-id "Remove", and resuming if that affiliation becomes current again),
 * never on a page, and the editor re-asks for the new affiliation. A public
 * institution page lists a CV under exactly the consented ids that are still
 * current ({@link institutionPageListing}).
 */

/** Upper bound on ids per CV (a dual or triple appointment is the realistic max). */
export const MAX_CONSENTED_ROR_IDS = 5;

export interface VisibleAffiliation {
  /** Bare ROR id (the ror.org path segment). */
  rorId: string;
  /** The institution as the CV shows it (the owner's rename when set). */
  name: string;
}

/**
 * The institutions of ALL visible current positions, one entry per ROR id
 * (first position wins the display name), in CV order. This is the picker the
 * editor offers: nothing outside it can be consented to.
 */
export function visibleCurrentAffiliations(cv: CanonicalCv): VisibleAffiliation[] {
  const seen = new Set<string>();
  const out: VisibleAffiliation[] = [];
  for (const pos of visibleCurrentPositions(cv)) {
    const rorId = positionRorId(pos);
    if (!rorId || seen.has(rorId)) continue;
    seen.add(rorId);
    out.push({ rorId, name: positionInstitutionNames(pos, rorId).display });
  }
  return out;
}

/** The ROR ids of {@link visibleCurrentAffiliations}. */
export function visibleCurrentRorIds(cv: CanonicalCv): string[] {
  return visibleCurrentAffiliations(cv).map((a) => a.rorId);
}

/** Thrown when a consent names an id that is not a visible current affiliation
 *  (or too many ids). The API maps it to 422. */
export class InstitutionConsentError extends Error {
  readonly unknownRorIds: string[];
  constructor(message: string, unknownRorIds: string[] = []) {
    super(message);
    this.name = "InstitutionConsentError";
    this.unknownRorIds = unknownRorIds;
  }
}

export interface InstitutionPageRequest {
  show: boolean;
  rorIds: readonly string[];
}

export interface InstitutionConsentColumns {
  showOnInstitutionPage: boolean;
  consentedRorIds: string[];
}

/**
 * Validate a requested consent against the STORED document's visible current
 * affiliations and normalise it to the columns to write. An id is accepted if
 * it is a visible current affiliation OR already stored (a lapsed id the owner
 * keeps — it was validated when first given, and may be re-posted alongside a
 * new tick but never introduced this way). A withdrawal (`show:false`) never
 * validates — it must always be possible, even after the position went; a
 * toggle with nothing ticked is a withdrawal.
 */
export function resolveInstitutionConsent(
  requested: InstitutionPageRequest,
  currentRorIds: readonly string[],
  storedRorIds: readonly string[] = [],
): InstitutionConsentColumns {
  if (!requested.show) return { showOnInstitutionPage: false, consentedRorIds: [] };
  const ids = [...new Set(requested.rorIds)];
  if (ids.length > MAX_CONSENTED_ROR_IDS) {
    throw new InstitutionConsentError(
      `At most ${MAX_CONSENTED_ROR_IDS} institutions can be chosen.`,
    );
  }
  const allowed = new Set([...currentRorIds, ...storedRorIds]);
  const unknown = ids.filter((id) => !allowed.has(id));
  if (unknown.length > 0) {
    throw new InstitutionConsentError(
      `Not a visible current affiliation of this CV: ${unknown.join(", ")}`,
      unknown,
    );
  }
  if (ids.length === 0) return { showOnInstitutionPage: false, consentedRorIds: [] };
  return { showOnInstitutionPage: true, consentedRorIds: ids };
}

export interface InstitutionConsentRow extends InstitutionConsentColumns {
  published: boolean;
  publicIndexable: boolean;
  /** The stored canonical document; parsed here unless `currentRorIds` is given. */
  document: unknown;
}

export interface InstitutionPageListing {
  /** Whether any institution page may list this CV right now. */
  listed: boolean;
  /** Consented ids that are still visible current positions — the pages that list the CV. */
  activeRorIds: string[];
  /** Consented ids no longer among the visible current positions: not shown, re-asked. */
  lapsedRorIds: string[];
}

/**
 * The DERIVED listing state of a row: `showOnInstitutionPage` gates it, the
 * page requires a published + indexable CV (the consent is cleared with either,
 * but a reader must not rely on that), and each consented id is active only
 * while it is a visible current position of the document AS IT IS NOW. An
 * unparseable document has no current positions, so every consent lapses.
 */
export function institutionPageListing(
  row: InstitutionConsentRow,
  currentRorIds?: readonly string[],
): InstitutionPageListing {
  const current = new Set(currentRorIds ?? currentIdsOf(row.document));
  const activeRorIds = row.consentedRorIds.filter((id) => current.has(id));
  const lapsedRorIds = row.consentedRorIds.filter((id) => !current.has(id));
  const listed =
    row.showOnInstitutionPage && row.published && row.publicIndexable && activeRorIds.length > 0;
  return { listed, activeRorIds, lapsedRorIds };
}

function currentIdsOf(document: unknown): string[] {
  const parsed = safeParseCanonicalCv(document);
  return parsed.success ? visibleCurrentRorIds(parsed.data) : [];
}

/** The institution-page part of the publish state the editor renders: the
 *  stored consent, the picker (visible current affiliations) and the re-ask. */
export interface InstitutionPageState extends InstitutionConsentColumns {
  /** Visible current affiliations the picker offers (ids + display names). */
  currentAffiliations: VisibleAffiliation[];
  /** The ids of {@link currentAffiliations}. */
  visibleCurrentRorIds: string[];
  /** Consented ids no longer among the visible current positions — re-asked, never moved. */
  lapsedRorIds: string[];
}

/** The state of a CV that never opted in (and the client's default). */
export const NO_INSTITUTION_PAGE: InstitutionPageState = {
  showOnInstitutionPage: false,
  consentedRorIds: [],
  currentAffiliations: [],
  visibleCurrentRorIds: [],
  lapsedRorIds: [],
};

export function institutionPageState(
  cv: CanonicalCv | null,
  columns: InstitutionConsentColumns,
  flags: { published: boolean; publicIndexable: boolean },
): InstitutionPageState {
  const currentAffiliations = cv ? visibleCurrentAffiliations(cv) : [];
  const visibleCurrentRorIds = currentAffiliations.map((a) => a.rorId);
  const { lapsedRorIds } = institutionPageListing(
    { ...columns, ...flags, document: null },
    visibleCurrentRorIds,
  );
  return {
    showOnInstitutionPage: columns.showOnInstitutionPage,
    consentedRorIds: columns.consentedRorIds,
    currentAffiliations,
    visibleCurrentRorIds,
    lapsedRorIds,
  };
}
