import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay, updateOwner } from "@/lib/canonical/curate";
import { projectCvForPublic } from "@/lib/cv/publicProjection";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const works = worksFixture as unknown as OpenAlexWork[];
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};

function makeCv() {
  return updateOwner(
    buildCanonicalCv({ id: "pp", resolved, works, now: "2026-06-02T00:00:00.000Z" }),
    {
      contact: {
        email: "me@example.org",
        phone: "+81-90-0000-0000",
        location: "Nagoya, Japan",
        website: "https://example.org",
      },
      personal: {
        address: "1-2-3 Somewhere",
        dateOfBirth: "1990-01-01",
        gender: "x",
        nationality: "French",
      },
    },
  );
}

describe("projectCvForPublic", () => {
  it("always strips rirekisho personal fields (no opt-in exists)", () => {
    const pub = projectCvForPublic(makeCv());
    expect(pub.owner.personal).toBeUndefined();
  });

  it("hides all contact fields by default (per-field consent defaults off)", () => {
    const pub = projectCvForPublic(makeCv());
    // website is kept (a public link the user added); email/phone/location gone.
    expect(pub.owner.contact).toEqual({ website: "https://example.org" });
  });

  it("shows only the contact fields the owner explicitly opted in", () => {
    const cv = updateDisplay(makeCv(), {
      publicContact: { email: true, phone: false, location: true },
    });
    const pub = projectCvForPublic(cv);
    expect(pub.owner.contact).toEqual({
      email: "me@example.org",
      location: "Nagoya, Japan",
      website: "https://example.org",
    });
    expect(pub.owner.contact?.phone).toBeUndefined();
  });

  it("drops the contact block entirely when nothing remains public", () => {
    // Fresh build (no website) so the merge in updateOwner can't retain one.
    const base = buildCanonicalCv({
      id: "pp2",
      resolved,
      works,
      now: "2026-06-02T00:00:00.000Z",
    });
    const cv = updateOwner(base, { contact: { email: "me@example.org", phone: "123" } });
    // No opt-in + no website -> contact becomes undefined.
    expect(projectCvForPublic(cv).owner.contact).toBeUndefined();
  });

  it("does not mutate the input (immutability)", () => {
    const cv = makeCv();
    projectCvForPublic(cv);
    expect(cv.owner.personal).toBeDefined();
    expect(cv.owner.contact?.email).toBe("me@example.org");
  });
});
