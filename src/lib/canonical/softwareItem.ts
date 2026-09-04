import type { CvItem } from "./schema";

/**
 * Whether a datasets/software-style item IS research software, judged from the
 * type its source recorded: DataCite `resourceTypeGeneral` ("Software"), OpenAIRE's
 * result type (`software`), ORCID's work-type (`software`) or an OpenAlex work
 * whose DataCite `raw_type` was Software — all stamped on `meta.type` by the build —
 * plus the CSL `type` for a citation item. Loose on purpose (`soft` / `code`), the
 * single test shared by the build's section routing, the on-read migration
 * (`migrateSoftware.ts`), the public JSON-LD (SoftwareSourceCode vs Dataset) and
 * the Software Heritage enrichment, so the four can never disagree.
 */
export function isSoftwareItem(
  item: Pick<CvItem, "meta"> & { csl?: { type?: string } | undefined },
): boolean {
  return isSoftwareType(item.csl?.type) || isSoftwareType(item.meta.type);
}

/** The bare type-string test behind {@link isSoftwareItem}. */
export function isSoftwareType(type: unknown): boolean {
  return typeof type === "string" && /soft|code/i.test(type);
}
