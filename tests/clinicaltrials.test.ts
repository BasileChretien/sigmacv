import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchClinicalTrials } from "@/lib/clinicaltrials/client";

function mockStudies(studies: unknown[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(new Response(JSON.stringify({ studies }), { status: 200 }))),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function study(nctId: string, briefTitle: string, extra: Record<string, unknown>): unknown {
  return {
    protocolSection: {
      identificationModule: { nctId, briefTitle },
      statusModule: {
        overallStatus: "COMPLETED",
        startDateStruct: { date: "2021-02-23" },
        completionDateStruct: { date: "2021-11-10" },
      },
      designModule: { phases: ["PHASE1"] },
      ...extra,
    },
  };
}

describe("fetchClinicalTrials", () => {
  it("returns [] without org, and matches via overallOfficials (name + affiliation)", async () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    expect(await fetchClinicalTrials("Kathleen Sakamoto", [])).toEqual([]);
    expect(spy).not.toHaveBeenCalled();

    mockStudies([
      study("NCT04770922", "Pharmacogenomic Analysis in Pediatric ALL", {
        sponsorCollaboratorsModule: {
          leadSponsor: { name: "Cipherome, Inc." },
          responsibleParty: { type: "SPONSOR" },
        },
        contactsLocationsModule: {
          overallOfficials: [
            {
              name: "Kathleen M Sakamoto, MD, PhD",
              affiliation: "Stanford University",
              role: "PRINCIPAL_INVESTIGATOR",
            },
            {
              name: "Stephanie M Smith, MD",
              affiliation: "Stanford University",
              role: "STUDY_DIRECTOR",
            },
          ],
        },
      }),
      // Same surname, WRONG affiliation → dropped.
      study("NCT00000000", "Other", {
        contactsLocationsModule: {
          overallOfficials: [
            {
              name: "Kathleen Sakamoto",
              affiliation: "Harvard University",
              role: "PRINCIPAL_INVESTIGATOR",
            },
          ],
        },
      }),
    ]);
    const trials = await fetchClinicalTrials("Kathleen Sakamoto", ["Stanford University"]);
    expect(trials).toEqual([
      {
        source: "clinicaltrials",
        registryId: "NCT04770922",
        title: "Pharmacogenomic Analysis in Pediatric ALL",
        status: "COMPLETED",
        phase: "PHASE1",
        role: "PRINCIPAL_INVESTIGATOR",
        sponsor: "Cipherome, Inc.",
        org: "Stanford University",
        startYear: 2021,
        endYear: 2021,
      },
    ]);
  });

  it("matches an individual responsibleParty (SPONSOR_INVESTIGATOR)", async () => {
    mockStudies([
      study("NCT02066532", "Adjuvant Trial", {
        sponsorCollaboratorsModule: {
          leadSponsor: { name: "Columbia University" },
          responsibleParty: {
            type: "SPONSOR_INVESTIGATOR",
            investigatorFullName: "Dawn L. Hershman",
            investigatorAffiliation: "Columbia University",
          },
        },
        contactsLocationsModule: { overallOfficials: [] },
      }),
    ]);
    const trials = await fetchClinicalTrials("Dawn Hershman", ["Columbia University"]);
    expect(trials).toHaveLength(1);
    expect(trials[0]).toMatchObject({
      registryId: "NCT02066532",
      role: "SPONSOR_INVESTIGATOR",
      org: "Columbia University",
    });
  });

  it("fails soft on a non-OK response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response("x", { status: 500 }))),
    );
    expect(await fetchClinicalTrials("Dawn Hershman", ["Columbia University"])).toEqual([]);
  });

  it("drops a matched study whose nctId/title are whitespace-only", async () => {
    // The investigator matches, but a blank id/title must not produce a garbage
    // canonical entry (the `str` helper now trims before accepting a value).
    mockStudies([
      study("   ", "   ", {
        contactsLocationsModule: {
          overallOfficials: [
            {
              name: "Dawn L. Hershman",
              affiliation: "Columbia University",
              role: "PRINCIPAL_INVESTIGATOR",
            },
          ],
        },
      }),
    ]);
    expect(await fetchClinicalTrials("Dawn Hershman", ["Columbia University"])).toEqual([]);
  });

  it("drops a matched study with no NCT id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              studies: [
                {
                  protocolSection: {
                    identificationModule: {}, // no nctId
                    contactsLocationsModule: {
                      overallOfficials: [
                        {
                          name: "Dawn Hershman",
                          affiliation: "Columbia University",
                          role: "PRINCIPAL_INVESTIGATOR",
                        },
                      ],
                    },
                  },
                },
              ],
            }),
            { status: 200 },
          ),
        ),
      ),
    );
    expect(await fetchClinicalTrials("Dawn Hershman", ["Columbia University"])).toEqual([]);
  });
});
