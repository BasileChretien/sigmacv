import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { setItemInView, setItemNotMine, updateDisplay, updateOwner } from "@/lib/canonical/curate";
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

  it("gates metrics + chart data behind their display opt-ins and strips presets", () => {
    const base = makeCv();
    const cv = {
      ...base,
      owner: {
        ...base.owner,
        metrics: { h_index: 5 },
        countsByYear: [{ year: 2020, works: 1, citations: 2 }],
      },
      presets: [{ id: "p1", name: "Grant", display: base.display, sectionVisibility: {} }],
    };
    // Opt-ins OFF (defaults): the .json machine format must not leak the figures
    // or the saved presets.
    const off = projectCvForPublic(cv);
    expect(off.owner.metrics).toBeUndefined();
    expect(off.owner.countsByYear).toEqual([]);
    expect(off.presets).toEqual([]);
    // Opt-ins ON: the figures the owner chose to show are published.
    const on = projectCvForPublic(updateDisplay(cv, { showMetrics: true, showCharts: true }));
    expect(on.owner.metrics).toEqual({ h_index: 5 });
    expect(on.owner.countsByYear).toEqual([{ year: 2020, works: 1, citations: 2 }]);
    expect(on.presets).toEqual([]); // presets are always stripped
  });

  it("drops hidden / 'not mine' items and strips their research metadata", () => {
    let cv = makeCv();
    const sectionId = cv.sections[0]!.id;
    const itemId = cv.sections[0]!.items[0]!.id;
    cv = setItemNotMine(cv, sectionId, itemId, true, {
      reason: "different-person",
      now: "2026-06-02T00:00:00.000Z",
    });
    const pub = projectCvForPublic(cv);
    // The disavowed work is absent from the public view…
    expect(pub.sections.flatMap((s) => s.items).find((i) => i.id === itemId)).toBeUndefined();
    // …and no remaining item carries the disambiguation reason/timestamp.
    for (const s of pub.sections) {
      for (const it of s.items) {
        expect(it.notMineReason).toBeUndefined();
        expect(it.notMineAssertedAt).toBeUndefined();
      }
    }
    // The stored canonical doc is untouched (research signal preserved).
    expect(cv.sections[0]!.items.find((i) => i.id === itemId)?.notMine).toBe(true);
  });

  it("applies the published view's exclusions and doesn't ship the exclude list", () => {
    const cv = makeCv();
    const sec = cv.sections.find((s) => s.type === "publications")!;
    const id = sec.items[0]!.id;
    const withExcl = setItemInView(cv, sec.id, id, false);
    const pub = projectCvForPublic(withExcl);
    const pubSec = pub.sections.find((s) => s.type === "publications")!;
    // The excluded work is absent from the public output (all formats)…
    expect(pubSec.items.some((it) => it.id === id)).toBe(false);
    // …and the exclude-id list itself is not shipped in the public json.
    expect(pub.display.excludedItems).toBeUndefined();
    // Input is untouched (immutable).
    expect(
      withExcl.sections.find((s) => s.type === "publications")!.items.some((it) => it.id === id),
    ).toBe(true);
  });
});
