import { prisma } from "@/lib/db";
import { safeParseCanonicalCv } from "@/lib/canonical/schema";
import { normalizeOrcid } from "@/lib/openalex/types";
import { doiOf, NO_CORRECTIONS, type OwnerCorrections } from "./ownerCorrections";

/**
 * Read a researcher's own disambiguation corrections, for the anonymous preview.
 *
 * SERVER-SIDE ONLY and FAIL-SOFT: any error yields no corrections and the preview
 * renders exactly as it would have. Never exposed as an endpoint — an
 * ORCID→"has an account" oracle would be a membership-enumeration leak — and the
 * output is identical in shape whether or not an account exists.
 *
 * The privacy line it observes is documented on {@link OwnerCorrections}: only
 * corrections that REMOVE a work ("not mine") or REMOVE a warning (a confirmed
 * work) are read. Never `included`, notes, presets or contact.
 */

/** Bound the sets so a pathological stored document can't blow up memory. */
const MAX_CORRECTIONS = 5000;

export async function fetchOwnerCorrections(rawOrcid: string): Promise<OwnerCorrections> {
  try {
    const orcid = normalizeOrcid(rawOrcid);
    if (!orcid) return NO_CORRECTIONS;
    const row = await prisma.user.findUnique({
      where: { orcid },
      select: { cv: { select: { document: true } } },
    });
    const parsed = safeParseCanonicalCv(row?.cv?.document);
    if (!parsed.success) return NO_CORRECTIONS;

    const notMineIds = new Set<string>();
    const notMineDois = new Set<string>();
    const confirmedIds = new Set<string>();
    const confirmedDois = new Set<string>();
    let seen = 0;
    for (const section of parsed.data.sections) {
      for (const item of section.items) {
        if (seen >= MAX_CORRECTIONS) break;
        const doi = doiOf(item);
        // A rejection outranks a confirmation: an item can carry both, and
        // "not mine" is the stronger, later statement.
        if (item.notMine) {
          seen += 1;
          notMineIds.add(item.id);
          if (doi) notMineDois.add(doi);
        } else if (item.reviewedAt) {
          seen += 1;
          confirmedIds.add(item.id);
          if (doi) confirmedDois.add(doi);
        }
      }
    }
    return { notMineIds, notMineDois, confirmedIds, confirmedDois };
  } catch {
    return NO_CORRECTIONS;
  }
}
