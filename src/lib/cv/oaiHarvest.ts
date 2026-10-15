import { findOaiDeletion, hasOaiDeletions, listOaiDeletions } from "@/lib/cv/oaiDeletions";
import { WHOLE_REPOSITORY } from "@/lib/cv/oaiState";
import { listPublicCvRecords } from "@/lib/cv/sync";
import {
  OAI_DELETED_PAGE_SIZE,
  OAI_PAGE_SIZE,
  rorSetSpec,
  type OaiDeletedRecord,
  type OaiListPage,
  type OaiPlan,
} from "@/lib/oai/oai";

/**
 * The OAI list verbs' reads, in the order a harvester meets them: every CV the
 * endpoint serves (with its works), then — on the pages after the last of
 * them — every record it no longer serves (`OaiDeletion`), within the same
 * set and dates. The route turns the page into XML; the consent gates live in
 * the readers.
 */

type ListPlan = Extract<OaiPlan, { kind: "list" }>;

/** One page of a list request. Empty (no record, no deleted record) when
 *  nothing matches — the route answers `noRecordsMatch`, or
 *  `badResumptionToken` for a resumed list. */
export async function readOaiListPage(plan: ListPlan): Promise<OaiListPage> {
  const filters = { set: plan.set, from: plan.from, until: plan.until };
  const base = {
    filters,
    metadataPrefix: plan.metadataPrefix,
    resumed:
      plan.after !== undefined || plan.offset !== undefined || plan.deletedAfter !== undefined,
  };
  // A set-filtered list reports what left THAT set; a plain one, what left
  // the repository.
  const deletedFrom = {
    setSpec: plan.set ? rorSetSpec(plan.set) : WHOLE_REPOSITORY,
    from: plan.from,
    until: plan.until,
  };
  if (plan.deletedAfter === undefined) {
    const live = await listPublicCvRecords({
      limit: OAI_PAGE_SIZE,
      after: plan.after,
      offset: plan.offset,
      ...filters,
    });
    if (live.next !== null || live.records.length > 0) {
      const next =
        live.next ?? ((await hasOaiDeletions(deletedFrom)) ? { deletedAfter: "" } : null);
      return { ...base, records: live.records, next };
    }
  }
  const page = await listOaiDeletions({
    ...deletedFrom,
    after: plan.deletedAfter ?? "",
    limit: OAI_DELETED_PAGE_SIZE,
  });
  const deleted: OaiDeletedRecord[] = page.rows.map((row) => ({
    identifier: row.identifier,
    datestamp: row.deletedAt,
    ...(plan.set ? { setSpec: deletedFrom.setSpec } : {}),
    deleted: true,
  }));
  return {
    ...base,
    records: [],
    deleted,
    next: page.next === null ? null : { deletedAfter: page.next },
  };
}

/** `GetRecord` for an identifier the endpoint no longer serves: its deleted
 *  record, or null when it never was one (or it has expired). */
export async function findDeletedRecord(identifier: string): Promise<OaiDeletedRecord | null> {
  const deletedAt = await findOaiDeletion(identifier);
  return deletedAt ? { identifier, datestamp: deletedAt, deleted: true } : null;
}
