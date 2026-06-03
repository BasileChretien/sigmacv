import { logger } from "@/lib/log";
import { normalizeOrcid } from "@/lib/openalex/types";

/**
 * Open Editors Plus (OEP) adapter — editorial roles by ORCID.
 *
 * OEP is the project owner's own dataset; this reads it from a configurable
 * JSON source (`OEP_DATA_URL`). With no source configured the integration is a
 * no-op (no editorial section), so the app runs without it.
 *
 * Expected dataset shape (JSON array):
 *   [{ "orcid": "0000-...", "journal": "…", "role": "Associate Editor",
 *      "startYear": 2020, "endYear": 2023 }, …]
 */
export interface EditorialRole {
  journal: string;
  role: string;
  startYear?: number;
  endYear?: number;
}

interface OepRecord {
  orcid?: string;
  journal?: string;
  role?: string;
  startYear?: number;
  endYear?: number;
}

export async function fetchEditorialRoles(
  orcid: string,
): Promise<EditorialRole[]> {
  const url = process.env.OEP_DATA_URL;
  if (!url) return [];

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) {
      logger.warn("oep.dataset_fetch_failed", { status: res.status });
      return [];
    }
    const data = (await res.json()) as OepRecord[];
    const bare = normalizeOrcid(orcid);
    return data
      .filter(
        (r) => r.journal && r.role && normalizeOrcid(r.orcid) === bare,
      )
      .map((r) => ({
        journal: r.journal as string,
        role: r.role as string,
        startYear: r.startYear,
        endYear: r.endYear,
      }));
  } catch (err) {
    logger.warn("oep.editorial_roles_failed", { err });
    return [];
  }
}
