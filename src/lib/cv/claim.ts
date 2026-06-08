import {
  buildClaimedItem,
  claimAuthors,
  claimedIsPreprint,
  selfIndexById,
  type ClaimAuthor,
} from "@/lib/canonical/claim";
import { addClaimedWork, cvHasWork } from "@/lib/canonical/curate";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { fetchWorkByDoi } from "@/lib/openalex/client";
import { resolveAuthorByOrcid, type ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import { normalizeOrcid, shortId } from "@/lib/openalex/types";
import { CvNotFoundError, getCvForUser, saveCvForUser } from "./sync";

/**
 * "Add a work by DOI" orchestration. The work + all its metadata (year, citations,
 * FWCI, author positions, peer-reviewed status) is pulled from OpenAlex, so the
 * figures stay source-driven; only OWNERSHIP is user-asserted. Two phases:
 *   • previewClaim — DOI → resolved work + author list + dedup (no mutation), so
 *     the editor can show a preview and (when there's no id match) an author picker;
 *   • addClaimByDoi — build + append + save, returning the updated CV.
 */

async function resolveOrFallback(orcid: string): Promise<ResolvedAuthor> {
  return (
    (await resolveAuthorByOrcid(orcid)) ?? {
      orcid: normalizeOrcid(orcid),
      authorIds: [],
      displayName: "",
    }
  );
}

export interface ClaimPreview {
  found: boolean;
  /** The work is already in the user's CV (refuse to add a duplicate). */
  alreadyInCv: boolean;
  title?: string;
  year?: number;
  venue?: string;
  authors: ClaimAuthor[];
  /** 0-based author index identified by ORCID / OpenAlex id, or -1 (user must pick). */
  idMatchedIndex: number;
}

export async function previewClaim(
  userId: string,
  orcid: string,
  doi: string,
): Promise<ClaimPreview> {
  const work = await fetchWorkByDoi(doi);
  if (!work) {
    return { found: false, alreadyInCv: false, authors: [], idMatchedIndex: -1 };
  }
  const resolved = await resolveOrFallback(orcid);
  const saved = await getCvForUser(userId);
  const alreadyInCv = saved ? cvHasWork(saved, { id: shortId(work.id), doi }) : false;
  return {
    found: true,
    alreadyInCv,
    title: work.title ?? work.display_name ?? undefined,
    year: work.publication_year ?? undefined,
    venue: work.primary_location?.source?.display_name ?? undefined,
    authors: claimAuthors(work, resolved),
    idMatchedIndex: selfIndexById(work, resolved),
  };
}

export interface ClaimResult {
  found: boolean;
  added: boolean;
  alreadyInCv: boolean;
  cv: CanonicalCv | null;
}

export async function addClaimByDoi(
  userId: string,
  orcid: string,
  doi: string,
  selfAuthorIndex?: number,
): Promise<ClaimResult> {
  const work = await fetchWorkByDoi(doi);
  if (!work) return { found: false, added: false, alreadyInCv: false, cv: null };

  const saved = await getCvForUser(userId);
  if (!saved) throw new CvNotFoundError();
  if (cvHasWork(saved, { id: shortId(work.id), doi })) {
    return { found: true, added: false, alreadyInCv: true, cv: saved };
  }

  const resolved = await resolveOrFallback(orcid);
  const item = buildClaimedItem(work, resolved, { selfAuthorIndex });
  const cv = await saveCvForUser(userId, addClaimedWork(saved, item, claimedIsPreprint(work)));
  return { found: true, added: true, alreadyInCv: false, cv };
}
