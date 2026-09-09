import { beforeEach, describe, expect, it, vi } from "vitest";

Object.assign(process.env, {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(20),
  ORCID_CLIENT_ID: "APP-1",
  ORCID_CLIENT_SECRET: "secret",
  OPENALEX_MAILTO: "ci@example.org",
  AUTH_URL: "https://sigmacv.test",
});

/**
 * GDPR: deleting the account removes the researcher from the reconciliation
 * export at once. The `User → Cv → CvSnapshot` cascade drops the designated
 * frozen version with the row, so the reader — which joins on it — finds
 * nothing. Simulated here with a tiny in-memory table shared by the delete
 * route's `user.delete` and the export reader's `cv.findMany`, both applying
 * the real where-clause semantics.
 */

interface Row {
  userId: string;
  orcid: string | null;
  showOnInstitutionPage: boolean;
  shareReconciliationRows: boolean;
  published: boolean;
  publicIndexable: boolean;
  consentedRorIds: string[];
  visibleCurrentRorIds: string[];
  snapshots: Array<{
    forReconciliation: boolean;
    isPublic: boolean;
    version: number;
    /** The rows stored at designation; null when never designated. */
    reconciliationRows: unknown;
  }>;
}

const table = vi.hoisted(() => ({ rows: [] as Row[] }));

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  enforceRateLimit: vi.fn(),
  isSameOrigin: vi.fn(),
  withdrawMintedSnapshotDois: vi.fn(),
  rateLimitDeleteMany: vi.fn(),
}));

/** A designated version with its stored rows, as the where clause sees it. */
function designated(
  s: Row["snapshots"][number],
  some: { forReconciliation: boolean; isPublic: boolean },
): boolean {
  return (
    s.forReconciliation === some.forReconciliation &&
    s.isPublic === some.isPublic &&
    // `reconciliationRows: { not: Prisma.AnyNull }` — neither SQL nor JSON null.
    s.reconciliationRows !== null &&
    s.reconciliationRows !== undefined
  );
}

/** The reconciliation gate, evaluated in memory the way Postgres would. */
function matches(row: Row, where: Record<string, unknown>): boolean {
  const has = (key: "consentedRorIds" | "visibleCurrentRorIds") =>
    row[key].includes((where[key] as { has: string }).has);
  const some = (where.snapshots as { some: { forReconciliation: boolean; isPublic: boolean } })
    .some;
  const user = where.user as { orcid: { not: null } };
  expect(user.orcid).toEqual({ not: null });
  return (
    row.showOnInstitutionPage === where.showOnInstitutionPage &&
    row.shareReconciliationRows === where.shareReconciliationRows &&
    row.published === where.published &&
    row.publicIndexable === where.publicIndexable &&
    has("consentedRorIds") &&
    has("visibleCurrentRorIds") &&
    row.orcid !== null &&
    row.snapshots.some((s) => designated(s, some))
  );
}

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/cv/snapshotStore", () => ({
  withdrawMintedSnapshotDois: mocks.withdrawMintedSnapshotDois,
}));
vi.mock("@/lib/rateLimitStore", () => ({ enforceRateLimit: mocks.enforceRateLimit }));
vi.mock("@/lib/security/origin", () => ({ isSameOrigin: mocks.isSameOrigin }));
vi.mock("@/lib/log", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        const row = table.rows.find((r) => r.userId === where.id);
        return row ? { orcid: row.orcid, cv: { consentedRorIds: row.consentedRorIds } } : null;
      },
      // The cascade: the CV and its snapshots go with the user.
      delete: async ({ where }: { where: { id: string } }) => {
        table.rows = table.rows.filter((r) => r.userId !== where.id);
        return {};
      },
    },
    cv: {
      findMany: async ({ where, take }: { where: Record<string, unknown>; take: number }) =>
        table.rows
          .filter((r) => matches(r, where))
          .slice(0, take)
          .map((r) => ({
            consentedRorIds: r.consentedRorIds,
            visibleCurrentRorIds: r.visibleCurrentRorIds,
            user: { orcid: r.orcid },
            snapshots: r.snapshots
              .filter((s) => designated(s, { forReconciliation: true, isPublic: true }))
              .map(({ version, reconciliationRows }) => ({ version, reconciliationRows })),
          })),
      count: async ({ where }: { where: Record<string, unknown> }) =>
        table.rows.filter((r) => matches(r, where)).length,
    },
    rateLimitWindow: { deleteMany: mocks.rateLimitDeleteMany },
  },
}));

import { DELETE } from "@/app/api/account/route";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { freezeCanonical } from "@/lib/cv/snapshots";
import { countReconciliationSources } from "@/lib/cv/listed";
import { reconciliationExport } from "@/lib/institutions/reconciliation";
import { storedReconciliationRows } from "@/lib/institutions/reconciliationRows";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const ROR = "04chrp450";
const ORCID = "0000-0002-7483-2489";
const OTHER_ORCID = "0000-0003-0449-6261";

function row(userId: string, orcid: string): Row {
  const doc = buildCanonicalCv({
    id: `cv-${userId}`,
    resolved: { orcid, authorIds: ["A5001069481"], displayName: "A Researcher" },
    works: (worksFixture as unknown as OpenAlexWork[]).slice(0, 2),
    now: "2026-09-08T00:00:00.000Z",
  });
  return {
    userId,
    orcid,
    showOnInstitutionPage: true,
    shareReconciliationRows: true,
    published: true,
    publicIndexable: true,
    consentedRorIds: [ROR],
    visibleCurrentRorIds: [ROR],
    snapshots: [
      {
        forReconciliation: true,
        isPublic: true,
        version: 1,
        // What the designation stored: the rows, computed once from the frozen copy.
        reconciliationRows: storedReconciliationRows(freezeCanonical(doc), {
          snapshotVersion: 1,
          contentHash: null,
          frozenAt: "2026-09-08T10:00:00.000Z",
        }),
      },
    ],
  };
}

beforeEach(() => {
  for (const m of Object.values(mocks)) m.mockReset();
  mocks.auth.mockResolvedValue({ user: { id: "u1" } });
  mocks.isSameOrigin.mockReturnValue(true);
  mocks.enforceRateLimit.mockResolvedValue({ ok: true });
  mocks.withdrawMintedSnapshotDois.mockResolvedValue({ attempted: 0, withdrawn: 0 });
  mocks.rateLimitDeleteMany.mockResolvedValue({ count: 0 });
  table.rows = [row("u1", ORCID), row("u2", OTHER_ORCID)];
});

describe("account deletion and the reconciliation export", () => {
  it("before the deletion the export names the researcher; after it, nothing of theirs remains — the other contributor is untouched", async () => {
    const before = await reconciliationExport(ROR);
    expect(before.contributorCount).toBe(2);
    expect(before.rows.some((r) => r.orcid === ORCID)).toBe(true);
    expect(await countReconciliationSources(ROR)).toBe(2);

    const res = await DELETE(new Request("https://sigmacv.test/api/account", { method: "DELETE" }));
    expect(res.status).toBe(200);

    const after = await reconciliationExport(ROR);
    expect(after.contributorCount).toBe(1);
    expect(after.rows.some((r) => r.orcid === ORCID)).toBe(false);
    expect(after.rows.every((r) => r.orcid === OTHER_ORCID)).toBe(true);
    expect(JSON.stringify(after)).not.toContain(ORCID);
    expect(await countReconciliationSources(ROR)).toBe(1);
  });

  it("a withdrawal of the second opt-in, or of the designation, removes the rows with the next request", async () => {
    table.rows[0]!.shareReconciliationRows = false;
    expect((await reconciliationExport(ROR)).rows.some((r) => r.orcid === ORCID)).toBe(false);
    table.rows[0]!.shareReconciliationRows = true;
    table.rows[0]!.snapshots[0]!.forReconciliation = false;
    expect((await reconciliationExport(ROR)).rows.some((r) => r.orcid === ORCID)).toBe(false);
    // A designated version made private is no source either.
    table.rows[0]!.snapshots[0]!.forReconciliation = true;
    table.rows[0]!.snapshots[0]!.isPublic = false;
    expect((await reconciliationExport(ROR)).rows.some((r) => r.orcid === ORCID)).toBe(false);
    // The lapse rule: a consented id no longer a visible current position.
    table.rows[0]!.snapshots[0]!.isPublic = true;
    table.rows[0]!.visibleCurrentRorIds = [];
    expect((await reconciliationExport(ROR)).rows.some((r) => r.orcid === ORCID)).toBe(false);
  });

  it("the page's count and the export's contributorCount agree: no ORCID or no stored rows is neither counted nor exported; a tampered stored value is skipped by the export and not counted as a contributor", async () => {
    const agree = async (expected: number) => {
      const out = await reconciliationExport(ROR);
      expect(out.contributorCount).toBe(expected);
      expect(await countReconciliationSources(ROR)).toBe(expected);
      return out;
    };
    await agree(2);
    // An account with no ORCID iD is out of both, in SQL.
    table.rows[0]!.orcid = null;
    await agree(1);
    table.rows[0]!.orcid = ORCID;
    // A designated version whose rows were never stored (written by an older
    // build) is out of both until it is designated again.
    const stored = table.rows[0]!.snapshots[0]!.reconciliationRows;
    table.rows[0]!.snapshots[0]!.reconciliationRows = null;
    await agree(1);
    table.rows[0]!.snapshots[0]!.reconciliationRows = stored;
    await agree(2);
    // A stored value that no longer parses is the one case SQL cannot see:
    // the export skips it and does not count it as a contributor.
    table.rows[0]!.snapshots[0]!.reconciliationRows = { v: 1, rows: [{ overdue: true }] };
    const out = await reconciliationExport(ROR);
    expect(out.contributorCount).toBe(1);
    expect(out.rows.every((r) => r.orcid === OTHER_ORCID)).toBe(true);
    expect(JSON.stringify(out)).not.toContain("overdue");
  });
});
