import { prisma } from "@/lib/db";
import { logger } from "@/lib/log";
import { normalizeOrcid } from "@/lib/openalex/types";

/**
 * Open Editors Plus (OEP) adapter — journal editorial roles by ORCID.
 *
 * Reads from the `OepEditorialRole` reference table, which is bulk-imported from
 * the committed OEP seed (`npm run oep:import`; see scripts/oep-import.ts). With
 * an empty table the integration is a no-op (no editorial section), so the app
 * runs without it. Every lookup fails soft (returns []) so an OEP hiccup never
 * breaks a sync.
 *
 * The OEP snapshot has no editorial-term dates, so `startYear`/`endYear` are
 * left undefined (the field stays in the type for manually-added roles + future
 * date-bearing sources).
 */
export interface EditorialRole {
  journal: string;
  role: string;
  startYear?: number;
  endYear?: number;
}

export async function fetchEditorialRoles(
  orcid: string,
): Promise<EditorialRole[]> {
  const bare = normalizeOrcid(orcid);
  if (!bare) return [];
  try {
    const rows = await prisma.oepEditorialRole.findMany({
      where: { orcid: bare },
      select: { journal: true, role: true },
      orderBy: [{ journal: "asc" }, { role: "asc" }],
    });
    return rows.map((r) => ({ journal: r.journal, role: r.role }));
  } catch (err) {
    logger.warn("oep.editorial_roles_failed", { err });
    return [];
  }
}
