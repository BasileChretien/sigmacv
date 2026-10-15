import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listPublicCvRecords: vi.fn(),
  hasOaiDeletions: vi.fn(),
  listOaiDeletions: vi.fn(),
  findOaiDeletion: vi.fn(),
}));

vi.mock("@/lib/cv/sync", () => ({ listPublicCvRecords: mocks.listPublicCvRecords }));
vi.mock("@/lib/cv/oaiDeletions", () => ({
  hasOaiDeletions: mocks.hasOaiDeletions,
  listOaiDeletions: mocks.listOaiDeletions,
  findOaiDeletion: mocks.findOaiDeletion,
}));

import { buildCanonicalCv } from "@/lib/canonical/build";
import { findDeletedRecord, readOaiListPage } from "@/lib/cv/oaiHarvest";
import { OAI_DELETED_PAGE_SIZE, OAI_PAGE_SIZE, type OaiRecordInput } from "@/lib/oai/oai";

const RECORD: OaiRecordInput = {
  slug: "ada-x7",
  datestamp: new Date("2026-06-09T10:00:00.000Z"),
  cv: buildCanonicalCv({
    id: "x",
    resolved: { orcid: "0000-0002-7483-2489", authorIds: ["A1"], displayName: "Ada" },
    works: [],
    now: "2026-06-02T00:00:00.000Z",
  }),
};
const GONE = new Date("2026-10-14T09:00:00.000Z");
const list = (extra: Record<string, unknown> = {}) =>
  ({ kind: "list", verb: "ListRecords", metadataPrefix: "oai_dc", ...extra }) as const;

beforeEach(() => {
  for (const m of Object.values(mocks)) m.mockReset();
  mocks.hasOaiDeletions.mockResolvedValue(false);
  mocks.listOaiDeletions.mockResolvedValue({ rows: [], next: null });
});

describe("readOaiListPage", () => {
  it("lists served CVs first, and resumes after the last row id while more follow", async () => {
    mocks.listPublicCvRecords.mockResolvedValue({ records: [RECORD], next: { after: "c9" } });
    const page = await readOaiListPage(list({ set: "04chrp450" }));
    expect(mocks.listPublicCvRecords).toHaveBeenCalledWith({
      limit: OAI_PAGE_SIZE,
      after: undefined,
      offset: undefined,
      set: "04chrp450",
      from: undefined,
      until: undefined,
    });
    expect(page).toMatchObject({ records: [RECORD], next: { after: "c9" }, resumed: false });
    expect(mocks.hasOaiDeletions).not.toHaveBeenCalled();
  });

  it("the last page of served CVs hands on to the deleted records when any match", async () => {
    mocks.listPublicCvRecords.mockResolvedValue({ records: [RECORD], next: null });
    mocks.hasOaiDeletions.mockResolvedValue(true);
    const from = new Date("2026-10-01T00:00:00Z");
    const page = await readOaiListPage(list({ after: "c9", from }));
    expect(mocks.hasOaiDeletions).toHaveBeenCalledWith({ setSpec: "", from, until: undefined });
    expect(page).toMatchObject({ records: [RECORD], next: { deletedAfter: "" }, resumed: true });
    // ... and ends the list when none does.
    mocks.hasOaiDeletions.mockResolvedValue(false);
    expect((await readOaiListPage(list())).next).toBeNull();
  });

  it("a set-filtered list reports what left THAT set, with the set in each header", async () => {
    mocks.listOaiDeletions.mockResolvedValue({
      rows: [{ identifier: "oai:sigmacv.org:ada-x7", deletedAt: GONE }],
      next: "d7",
    });
    const page = await readOaiListPage(list({ set: "04chrp450", deletedAfter: "" }));
    expect(mocks.listPublicCvRecords).not.toHaveBeenCalled();
    expect(mocks.listOaiDeletions).toHaveBeenCalledWith({
      setSpec: "ror:04chrp450",
      from: undefined,
      until: undefined,
      after: "",
      limit: OAI_DELETED_PAGE_SIZE,
    });
    expect(page).toMatchObject({
      records: [],
      deleted: [
        {
          identifier: "oai:sigmacv.org:ada-x7",
          datestamp: GONE,
          setSpec: "ror:04chrp450",
          deleted: true,
        },
      ],
      next: { deletedAfter: "d7" },
      resumed: true,
    });
  });

  it("a list with no served CV goes straight to the deleted records, with no set in a plain list", async () => {
    mocks.listPublicCvRecords.mockResolvedValue({ records: [], next: null });
    mocks.listOaiDeletions.mockResolvedValue({
      rows: [{ identifier: "oai:sigmacv.org:ada-x7/w/W1", deletedAt: GONE }],
      next: null,
    });
    const until = new Date("2026-10-15T23:59:59Z");
    const page = await readOaiListPage(list({ until }));
    expect(mocks.listOaiDeletions).toHaveBeenCalledWith(
      expect.objectContaining({ setSpec: "", until, after: "" }),
    );
    expect(page.deleted).toEqual([
      { identifier: "oai:sigmacv.org:ada-x7/w/W1", datestamp: GONE, deleted: true },
    ]);
    expect(page.next).toBeNull();
  });

  it("nothing at all is an empty page (the route answers noRecordsMatch)", async () => {
    mocks.listPublicCvRecords.mockResolvedValue({ records: [], next: null });
    const page = await readOaiListPage(list());
    expect(page.records).toEqual([]);
    expect(page.deleted).toEqual([]);
    expect(page.resumed).toBe(false);
  });
});

describe("findDeletedRecord", () => {
  it("is the deleted record while it lasts, else null", async () => {
    mocks.findOaiDeletion.mockResolvedValueOnce(GONE).mockResolvedValueOnce(null);
    expect(await findDeletedRecord("oai:sigmacv.org:ada-x7")).toEqual({
      identifier: "oai:sigmacv.org:ada-x7",
      datestamp: GONE,
      deleted: true,
    });
    expect(await findDeletedRecord("oai:sigmacv.org:nobody")).toBeNull();
  });
});
