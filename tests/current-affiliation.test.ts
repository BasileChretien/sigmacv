import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db", () => ({ prisma: { institution: { findUnique } } }));

import { loadCurrentAffiliationCountry } from "@/lib/archiving/currentAffiliation";

/**
 * The owner's current-affiliation country for the deposit routes: the first
 * usable ROR id's country as ROR recorded it, upper-case ISO code, fail-soft.
 */

beforeEach(() => findUnique.mockReset());

describe("loadCurrentAffiliationCountry", () => {
  it("reads the first usable ROR id's country, upper-cased", async () => {
    findUnique.mockResolvedValue({ country: " jp " });
    expect(await loadCurrentAffiliationCountry(["junk", "https://ror.org/04chrp450"])).toBe("JP");
    expect(findUnique).toHaveBeenCalledWith({
      where: { rorId: "04chrp450" },
      select: { country: true },
    });
  });

  it("answers undefined without a usable id (no query), without a row or a country code, or on a database error", async () => {
    expect(await loadCurrentAffiliationCountry([])).toBeUndefined();
    expect(await loadCurrentAffiliationCountry(["not-a-ror"])).toBeUndefined();
    expect(findUnique).not.toHaveBeenCalled();
    findUnique.mockResolvedValueOnce(null);
    expect(await loadCurrentAffiliationCountry(["04chrp450"])).toBeUndefined();
    findUnique.mockResolvedValueOnce({ country: "Japan" });
    expect(await loadCurrentAffiliationCountry(["04chrp450"])).toBeUndefined();
    findUnique.mockRejectedValueOnce(new Error("db down"));
    expect(await loadCurrentAffiliationCountry(["04chrp450"])).toBeUndefined();
  });
});
