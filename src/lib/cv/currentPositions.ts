import { itemDisplayText, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";
import { visibleItems, visibleSections } from "@/lib/canonical/curate";
import { ROR_ID_PATTERN, bareRorId } from "@/lib/ror/id";

/**
 * The ONE rule for "current position", shared by the OAI `ror:<id>` set key
 * (`publicJsonLd.currentAffiliation`) and the institution-page consent
 * (`institutionConsent`): a VISIBLE position with no end year. An owner-set
 * date-range override replaces the source dates entirely, so its own `endYear`
 * is what counts. List order is not trusted — the dates are.
 */
export function visibleCurrentPositions(cv: CanonicalCv): CvItem[] {
  const section = visibleSections(cv).find((s) => s.type === "positions");
  if (!section) return [];
  return visibleItems(section).filter((p) => {
    const end = p.meta.dateRangeOverride ? p.meta.dateRangeOverride.endYear : p.meta.endYear;
    return end === undefined;
  });
}

/** The bare ROR id a position resolves to, or null (no id, a foreign or junk
 *  value, or a body that is not a 9-char ROR id — the same {@link ROR_ID_PATTERN}
 *  the consent API enforces, so the picker never offers an id it would refuse). */
export function positionRorId(pos: Pick<CvItem, "meta">): string | null {
  const raw = pos.meta.rorId?.trim();
  const bare = raw ? bareRorId(raw) : null;
  return bare && ROR_ID_PATTERN.test(bare) ? bare : null;
}

/** A position's institution names: the canonical (source / ROR) `name`, and the
 *  owner's rename `display` when set (else the canonical). */
export function positionInstitutionNames(
  pos: CvItem,
  rorId: string,
): { canonical: string; display: string } {
  const canonical = pos.meta.institution?.trim() || itemDisplayText(pos)?.trim() || `ROR ${rorId}`;
  const display = pos.meta.institutionOverride?.trim() || canonical;
  return { canonical, display };
}
