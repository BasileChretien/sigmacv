import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ fetchSoftwareHeritageArchival: vi.fn() }));
vi.mock("@/lib/softwareheritage/client", () => ({
  fetchSoftwareHeritageArchival: mocks.fetchSoftwareHeritageArchival,
}));

import { buildCanonicalCv, openalexTypeClass } from "@/lib/canonical/build";
import { CV_MODELS } from "@/lib/canonical/cvModels";
import { enrichCvWithSoftwareHeritage } from "@/lib/canonical/enrich";
import { migrateSoftwareSection } from "@/lib/canonical/migrateSoftware";
import { moveSectionViewState } from "@/lib/canonical/moveSectionViewState";
import { narrativeEvidence } from "@/lib/canonical/narrativeEvidence";
import {
  DEFAULT_SECTION_ORDER,
  DisplayChoicesSchema,
  SECTION_TYPES,
  migrateCanonicalDocument,
  parseCanonicalCv,
  type CanonicalCv,
  type CvItem,
  type CvSection,
} from "@/lib/canonical/schema";
import { isSoftwareItem, isSoftwareType } from "@/lib/canonical/softwareItem";
import { profilePageJsonLd } from "@/lib/cv/publicJsonLd";
import { projectCvForPublic } from "@/lib/cv/publicProjection";
import { fetchDataciteOutputs, type DataciteOutput } from "@/lib/datacite/client";
import { SUPPORTED_LOCALES, isLegacyDatasetsTitle, sectionTitle } from "@/lib/i18n";
import type { OpenaireOutput } from "@/lib/openaire/client";
import type { OpenAlexWork } from "@/lib/openalex/types";
import { renderCvHtml } from "@/lib/render/html";

const resolved = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};
const NOW = "2026-09-04T00:00:00.000Z";

/** A venue-less OpenAlex work (so `isPreprint` would flag it) with a chosen type. */
function work(shortId: string, bareDoi: string, type: string, rawType?: string): OpenAlexWork {
  return {
    id: `https://openalex.org/${shortId}`,
    doi: `https://doi.org/${bareDoi}`,
    title: `Work ${shortId}`,
    display_name: `Work ${shortId}`,
    publication_year: 2026,
    type,
    authorships: [
      {
        author_position: "first",
        author: {
          id: "https://openalex.org/A5001069481",
          display_name: "Basile Chrétien",
          orcid: "https://orcid.org/0000-0002-7483-2489",
        },
        raw_author_name: "Basile Chrétien",
      },
    ],
    primary_location: rawType ? { raw_type: rawType } : null,
  } as unknown as OpenAlexWork;
}

const sectionOf = (cv: CanonicalCv, type: string) => cv.sections.find((s) => s.type === type);
const itemIn = (cv: CanonicalCv, type: string, id: string) =>
  sectionOf(cv, type)?.items.find((i) => i.id === id);
const everywhere = (cv: CanonicalCv, id: string) =>
  cv.sections.flatMap((s) => s.items).filter((i) => i.id === id);

const SW_DEPOSIT: DataciteOutput = {
  doi: "10.5281/zenodo.100",
  title: "sigmatool",
  type: "Software",
  year: 2025,
  publisher: "Zenodo",
  repositoryUrl: "https://github.com/user/sigmatool",
  version: "1.2.0",
  license: "MIT",
};
const DS_DEPOSIT: DataciteOutput = {
  doi: "10.5281/zenodo.200",
  title: "A dataset",
  type: "Dataset",
  year: 2024,
  publisher: "Zenodo",
};

function build(
  over: Partial<Parameters<typeof buildCanonicalCv>[0]> = {},
  previous?: CanonicalCv,
): CanonicalCv {
  return buildCanonicalCv({ id: "cv", resolved, works: [], now: NOW, previous, ...over });
}

// ─── schema / i18n registration ──────────────────────────────────────────────

describe("software section — registration", () => {
  it("is a section type ordered right after datasets", () => {
    expect(SECTION_TYPES).toContain("software");
    expect(DEFAULT_SECTION_ORDER.software).toBe(DEFAULT_SECTION_ORDER.datasets + 1);
    // Every later section shifted down by one — no two types share an order value.
    const orders = Object.values(DEFAULT_SECTION_ORDER);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it("has a real title in all ten locales, and datasets no longer says '& Software'", () => {
    const titles = new Set<string>();
    for (const locale of SUPPORTED_LOCALES) {
      const sw = sectionTitle(locale, "software");
      const ds = sectionTitle(locale, "datasets");
      expect(sw.length).toBeGreaterThan(0);
      expect(ds.length).toBeGreaterThan(0);
      expect(sw).not.toBe(ds);
      expect(isLegacyDatasetsTitle(ds)).toBe(false);
      titles.add(sw);
    }
    // Not just English copies (several locales legitimately share "Software").
    expect(titles.size).toBeGreaterThan(4);
  });

  it("recognises the pre-split default heading in every locale, and nothing else", () => {
    expect(isLegacyDatasetsTitle("Datasets & Software")).toBe(true);
    expect(isLegacyDatasetsTitle("Jeux de données et logiciels")).toBe(true);
    expect(isLegacyDatasetsTitle("データセット・ソフトウェア")).toBe(true);
    expect(isLegacyDatasetsTitle("Datasets")).toBe(false);
    expect(isLegacyDatasetsTitle("My data")).toBe(false);
    expect(isLegacyDatasetsTitle("")).toBe(false);
  });

  it("isSoftwareType / isSoftwareItem match the recorded type loosely", () => {
    expect(isSoftwareType("Software")).toBe(true);
    expect(isSoftwareType("software")).toBe(true);
    expect(isSoftwareType("SourceCode")).toBe(true);
    expect(isSoftwareType("Dataset")).toBe(false);
    expect(isSoftwareType(undefined)).toBe(false);
    expect(isSoftwareType(42)).toBe(false);
    expect(isSoftwareItem({ meta: { type: "Software" } })).toBe(true);
    expect(isSoftwareItem({ meta: {}, csl: { type: "software" } })).toBe(true);
    expect(isSoftwareItem({ meta: { type: "Dataset" }, csl: { type: "dataset" } })).toBe(false);
    expect(isSoftwareItem({ meta: {} })).toBe(false);
  });

  it("counts software as evidence for the knowledge narrative module", () => {
    const cv = build({ dataciteOutputs: [SW_DEPOSIT, DS_DEPOSIT] });
    const counts = narrativeEvidence(cv, "narrative-knowledge");
    expect(counts).toEqual(
      expect.arrayContaining([
        { type: "datasets", count: 1 },
        { type: "software", count: 1 },
      ]),
    );
  });
});

// ─── build routing per source ────────────────────────────────────────────────

describe("software section — build routing", () => {
  it("files a DataCite Software deposit in Software and a Dataset in Datasets", () => {
    const cv = build({ dataciteOutputs: [SW_DEPOSIT, DS_DEPOSIT] });
    const sw = sectionOf(cv, "software")!;
    const ds = sectionOf(cv, "datasets")!;
    expect(sw.items.map((i) => i.meta.doi)).toEqual(["10.5281/zenodo.100"]);
    expect(ds.items.map((i) => i.meta.doi)).toEqual(["10.5281/zenodo.200"]);
    expect(sw.title).toBe("Software");
    expect(ds.title).toBe("Datasets");
    expect(sw.order).toBe(DEFAULT_SECTION_ORDER.software);
    expect(ds.order).toBe(DEFAULT_SECTION_ORDER.datasets);
    expect(sw.items.every((i) => i.included)).toBe(true); // ORCID-matched → auto-included
  });

  it("stamps DataCite version + licence onto the software item's meta", () => {
    const cv = build({ dataciteOutputs: [SW_DEPOSIT] });
    const it = sectionOf(cv, "software")!.items[0]!;
    expect(it.meta.version).toBe("1.2.0");
    expect(it.meta.license).toBe("MIT");
    expect(it.meta.repositoryUrl).toBe("https://github.com/user/sigmatool");
    expect(it.meta.type).toBe("Software");
  });

  it("files an OpenAIRE software product in Software (dedup by DOI against DataCite)", () => {
    const openaireOutputs: OpenaireOutput[] = [
      { openaireId: "oa::sw", title: "OA tool", type: "software", year: 2024 },
      { openaireId: "oa::dup", title: "Dup", type: "software", doi: SW_DEPOSIT.doi, year: 2025 },
      { openaireId: "oa::ds", title: "OA data", type: "dataset", year: 2023 },
    ];
    const cv = build({ dataciteOutputs: [SW_DEPOSIT], openaireOutputs });
    expect(sectionOf(cv, "software")!.items.map((i) => i.sourceId)).toEqual([
      SW_DEPOSIT.doi,
      "oa::sw",
    ]);
    expect(sectionOf(cv, "datasets")!.items.map((i) => i.sourceId)).toEqual(["oa::ds"]);
    expect(cv.sections.flatMap((s) => s.items).some((i) => i.sourceId === "oa::dup")).toBe(false);
  });

  it("routes an ORCID-typed `software` work into Software and stamps meta.type", () => {
    const cv = build({
      works: [work("WSW", "10.7/orcid-sw", "article")],
      orcidWorkTypes: { "10.7/orcid-sw": "software" },
    });
    const it = itemIn(cv, "software", "WSW")!;
    expect(it).toBeDefined();
    expect(it.csl).toBeDefined(); // a citeproc-rendered work item
    expect(it.meta.type).toBe("software");
    expect(it.meta.peerReviewed).toBe(false);
    expect(sectionOf(cv, "datasets")).toBeUndefined();
    expect(sectionOf(cv, "publications")!.items).toHaveLength(0);
  });

  it("routes an OpenAlex `software`-typed work, and a DataCite-raw-typed Software dataset, into Software", () => {
    const cv = build({
      works: [
        work("WOASW", "10.7/oa-sw", "software"),
        work("WRAW", "10.5281/zenodo.raw", "dataset", "Software"),
        work("WDS", "10.7/oa-ds", "dataset"),
      ],
    });
    expect(itemIn(cv, "software", "WOASW")?.meta.type).toBe("software");
    expect(itemIn(cv, "software", "WRAW")?.meta.type).toBe("software");
    expect(itemIn(cv, "datasets", "WDS")).toBeDefined();
    expect(itemIn(cv, "datasets", "WDS")?.meta.type).toBe("dataset");
    expect(sectionOf(cv, "preprints")).toBeUndefined();
  });

  it("openalexTypeClass: software / dataset(raw Software) → software; dataset → dataset", () => {
    expect(openalexTypeClass(work("A", "10.1/a", "software"))).toBe("software");
    expect(openalexTypeClass(work("B", "10.1/b", "dataset", "Software"))).toBe("software");
    expect(openalexTypeClass(work("C", "10.1/c", "dataset", "Dataset"))).toBe("dataset");
    expect(openalexTypeClass(work("D", "10.1/d", "dataset"))).toBe("dataset");
    expect(openalexTypeClass(work("E", "10.1/e", "article"))).toBeUndefined();
  });

  it("lets an ORCID publication type override the OpenAlex software type (→ Publications)", () => {
    const cv = build({
      works: [work("WPUB", "10.7/pub", "software")],
      orcidWorkTypes: { "10.7/pub": "journal-article" },
    });
    expect(itemIn(cv, "publications", "WPUB")).toBeDefined();
    expect(sectionOf(cv, "software")).toBeUndefined();
  });
});

// ─── dedupe across the two sections ──────────────────────────────────────────

describe("software section — DOI dedupe across Datasets and Software", () => {
  it("drops the OpenAlex copy of a DataCite Software deposit (own DOI and concept↔version sibling)", () => {
    const cv = build({
      works: [work("WOWN", SW_DEPOSIT.doi, "dataset"), work("WSIB", "10.5281/zenodo.101", "other")],
      dataciteOutputs: [{ ...SW_DEPOSIT, relatedDois: ["10.5281/zenodo.101"] }],
    });
    expect(everywhere(cv, "WOWN")).toHaveLength(0);
    expect(everywhere(cv, "WSIB")).toHaveLength(0);
    expect(sectionOf(cv, "software")!.items).toHaveLength(1);
    expect(sectionOf(cv, "datasets")).toBeUndefined();
    expect(sectionOf(cv, "other")).toBeUndefined();
  });

  it("drops an OpenAlex software-routed work whose DOI is a DataCite Dataset deposit (cross-section)", () => {
    const cv = build({
      works: [work("WX", DS_DEPOSIT.doi, "article")],
      orcidWorkTypes: { [DS_DEPOSIT.doi]: "software" },
      dataciteOutputs: [DS_DEPOSIT],
    });
    expect(everywhere(cv, "WX")).toHaveLength(0);
    expect(sectionOf(cv, "datasets")!.items).toHaveLength(1);
    expect(sectionOf(cv, "software")).toBeUndefined();
  });

  it("drops an ORCID 'other-output' work whose DOI is already a Software entry", () => {
    const cv = build({
      works: [work("WOTH", SW_DEPOSIT.doi.toUpperCase(), "other")],
      orcidWorkTypes: { [SW_DEPOSIT.doi]: "conference-poster" },
      dataciteOutputs: [SW_DEPOSIT],
    });
    expect(everywhere(cv, "WOTH")).toHaveLength(0);
    expect(sectionOf(cv, "other")).toBeUndefined();
  });
});

// ─── curation survival on rebuild ────────────────────────────────────────────

describe("software section — curation survives a rebuild", () => {
  it("keeps a hidden software item hidden when the previous CV already had a Software section", () => {
    const first = build({ dataciteOutputs: [SW_DEPOSIT] });
    const hidden: CanonicalCv = {
      ...first,
      sections: first.sections.map((s) =>
        s.type === "software"
          ? { ...s, items: s.items.map((i) => ({ ...i, included: false, reviewedAt: NOW })) }
          : s,
      ),
    };
    const second = build({ dataciteOutputs: [SW_DEPOSIT] }, hidden);
    const it = sectionOf(second, "software")!.items[0]!;
    expect(it.included).toBe(false);
    expect(it.reviewedAt).toBe(NOW);
  });

  it("keeps curation when the item moves from a pre-split Datasets section into Software", () => {
    // Simulate a CV saved BEFORE the split: the software deposit sits under
    // `datasets` (titled "Datasets & Software"), hidden by the owner, and the
    // section itself was renamed + reordered. Passed straight to the build (no
    // on-read migration) to prove the build alone preserves the decision.
    const first = build({ dataciteOutputs: [SW_DEPOSIT, DS_DEPOSIT] });
    const sw = sectionOf(first, "software")!;
    const ds = sectionOf(first, "datasets")!;
    const preSplit: CanonicalCv = {
      ...first,
      sections: [
        ...first.sections.filter((s) => s.type !== "software" && s.type !== "datasets"),
        {
          ...ds,
          title: "Datasets & Software",
          items: [...ds.items, ...sw.items.map((i) => ({ ...i, included: false, notMine: true }))],
        },
      ],
    };
    const second = build({ dataciteOutputs: [SW_DEPOSIT, DS_DEPOSIT] }, preSplit);
    const moved = sectionOf(second, "software")!.items[0]!;
    expect(moved.meta.doi).toBe(SW_DEPOSIT.doi);
    expect(moved.included).toBe(false);
    expect(moved.notMine).toBe(true);
    // The dataset stayed put, and the legacy default heading became "Datasets".
    expect(sectionOf(second, "datasets")!.items.map((i) => i.meta.doi)).toEqual([DS_DEPOSIT.doi]);
    expect(sectionOf(second, "datasets")!.title).toBe("Datasets");
  });

  it("carries a manual software-typed entry from a pre-split Datasets section into Software", () => {
    const first = build({ dataciteOutputs: [DS_DEPOSIT] });
    const manual: CvItem = {
      id: "dataset:manual:1",
      source: "manual",
      sourceId: "manual",
      displayText: "My script (2020). https://doi.org/10.9/manual-sw",
      included: true,
      notMine: false,
      order: 5,
      authoredBySelf: true,
      selfNameVariants: [],
      meta: { type: "software" },
    };
    const manualDataset: CvItem = { ...manual, id: "dataset:manual:2", meta: {} };
    const previous: CanonicalCv = {
      ...first,
      sections: first.sections.map((s) =>
        s.type === "datasets" ? { ...s, items: [...s.items, manual, manualDataset] } : s,
      ),
    };
    const second = build({ dataciteOutputs: [DS_DEPOSIT] }, previous);
    expect(sectionOf(second, "software")!.items.map((i) => i.id)).toEqual(["dataset:manual:1"]);
    expect(sectionOf(second, "datasets")!.items.map((i) => i.id)).toEqual([
      "dataset:datacite:10-5281-zenodo-200",
      "dataset:manual:2",
    ]);
  });

  it("honours an owner-renamed datasets heading (never treated as the legacy default)", () => {
    const first = build({ dataciteOutputs: [DS_DEPOSIT] });
    const renamed: CanonicalCv = {
      ...first,
      sections: first.sections.map((s) => (s.type === "datasets" ? { ...s, title: "My data" } : s)),
    };
    const second = build({ dataciteOutputs: [DS_DEPOSIT] }, renamed);
    expect(sectionOf(second, "datasets")!.title).toBe("My data");
  });
});

// ─── on-read migration ───────────────────────────────────────────────────────

function rawItem(id: string, over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id,
    source: "datacite",
    sourceId: id,
    displayText: `Entry ${id}`,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    meta: {},
    ...over,
  };
}

function rawDoc(
  sections: unknown[],
  display: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    schemaVersion: 2,
    id: "m",
    owner: {
      orcid: "0000-0002-7483-2489",
      openAlexAuthorIds: [],
      displayName: "X",
      links: [],
      countsByYear: [],
    },
    display: { ...DisplayChoicesSchema.parse({}), ...display },
    sections,
    presets: [],
    provenance: { generatedAt: "t0", lastSyncedAt: "t0", sources: ["datacite"] },
  };
}

describe("software section — on-read migration (migrateSoftwareSection)", () => {
  it("moves software-typed items out of datasets into a new Software section right after it", () => {
    const doc = rawDoc([
      {
        id: "publications",
        type: "publications",
        title: "Publications",
        visible: true,
        order: 0,
        items: [],
      },
      {
        id: "datasets",
        type: "datasets",
        title: "Datasets & Software",
        visible: true,
        order: 5,
        items: [
          rawItem("d1", { order: 0, meta: { type: "Dataset" } }),
          rawItem("s1", { order: 1, meta: { type: "Software" }, included: false, reviewedAt: NOW }),
          rawItem("s2", { order: 2, csl: { id: "s2", type: "software", title: "T" }, meta: {} }),
        ],
      },
      { id: "grants", type: "grants", title: "Grants", visible: false, order: 8, items: [] },
    ]);
    const out = migrateSoftwareSection(doc) as { sections: CvSection[] };
    expect(out).not.toBe(doc);
    const types = out.sections.map((s) => s.type);
    expect(types).toEqual(["publications", "datasets", "software", "grants"]);
    const ds = out.sections[1]!;
    const sw = out.sections[2]!;
    expect(ds.title).toBe("Datasets"); // legacy default retitled
    expect(ds.items.map((i) => i.id)).toEqual(["d1"]);
    expect(sw.id).toBe("software");
    expect(sw.title).toBe("Software");
    expect(sw.visible).toBe(true);
    expect(sw.order).toBe(6); // datasets + 1
    expect(out.sections[3]!.order).toBe(9); // later sections shifted down one
    expect(sw.items.map((i) => i.id)).toEqual(["s1", "s2"]);
    expect(sw.items.map((i) => i.order)).toEqual([0, 1]);
    // Curation travels with the item.
    expect(sw.items[0]!.included).toBe(false);
    expect(sw.items[0]!.reviewedAt).toBe(NOW);
    // Never mutates the input.
    expect((doc.sections as CvSection[])[1]!.items).toHaveLength(3);
  });

  it("retitles in the CV's own locale and leaves an owner-renamed heading alone", () => {
    const fr = rawDoc(
      [
        {
          id: "datasets",
          type: "datasets",
          title: "Jeux de données et logiciels",
          visible: true,
          order: 5,
          items: [rawItem("d1", { meta: { type: "Dataset" } })],
        },
      ],
      { locale: "fr-FR" },
    );
    const outFr = migrateSoftwareSection(fr) as { sections: CvSection[] };
    expect(outFr.sections[0]!.title).toBe("Jeux de données");
    expect(outFr.sections).toHaveLength(1); // nothing to move → no Software section

    const custom = rawDoc([
      {
        id: "datasets",
        type: "datasets",
        title: "My data & code",
        visible: true,
        order: 5,
        items: [rawItem("s1", { meta: { type: "Software" } })],
      },
    ]);
    const outCustom = migrateSoftwareSection(custom) as { sections: CvSection[] };
    expect(outCustom.sections[0]!.title).toBe("My data & code");
    expect(outCustom.sections[1]!.type).toBe("software");
  });

  it("appends to an existing Software section instead of creating a second one", () => {
    const doc = rawDoc([
      {
        id: "datasets",
        type: "datasets",
        title: "Datasets",
        visible: true,
        order: 5,
        items: [rawItem("s-late", { order: 0, meta: { type: "Software" } })],
      },
      {
        id: "software",
        type: "software",
        title: "Software",
        visible: true,
        order: 6,
        items: [rawItem("s-old", { order: 0, meta: { type: "Software" } })],
      },
    ]);
    const out = migrateSoftwareSection(doc) as { sections: CvSection[] };
    expect(out.sections).toHaveLength(2);
    expect(out.sections[1]!.items.map((i) => i.id)).toEqual(["s-old", "s-late"]);
    expect(out.sections[1]!.items.map((i) => i.order)).toEqual([0, 1]);
    expect(out.sections[0]!.items).toHaveLength(0);
  });

  it("is identity-preserving when there is nothing to move or retitle, and defensive on junk", () => {
    const clean = rawDoc([
      {
        id: "datasets",
        type: "datasets",
        title: "Datasets",
        visible: true,
        order: 5,
        items: [rawItem("d1", { meta: { type: "Dataset" } })],
      },
    ]);
    expect(migrateSoftwareSection(clean)).toBe(clean);
    const noDatasets = rawDoc([
      { id: "p", type: "publications", title: "P", visible: true, order: 0, items: [] },
    ]);
    expect(migrateSoftwareSection(noDatasets)).toBe(noDatasets);
    expect(migrateSoftwareSection(null)).toBeNull();
    expect(migrateSoftwareSection("x")).toBe("x");
    const badSections = { schemaVersion: 2, sections: "nope" };
    expect(migrateSoftwareSection(badSections)).toBe(badSections);
    // Non-object sections / items and a non-numeric order are tolerated.
    const odd = rawDoc([
      null,
      {
        id: "datasets",
        type: "datasets",
        title: "Datasets & Software",
        items: [null, rawItem("s1", { meta: { type: "Software" } }), rawItem("d1", { order: "x" })],
      },
      "junk",
      { type: "grants", order: 9 },
      { type: "awards" },
    ]);
    const out = migrateSoftwareSection(odd) as { sections: unknown[] };
    expect(out.sections).toHaveLength(6);
    expect((out.sections[2] as CvSection).type).toBe("software");
    expect((out.sections[2] as CvSection).order).toBe(1);
    expect((out.sections[4] as CvSection).order).toBe(10);
  });

  it("runs through migrateCanonicalDocument + parseCanonicalCv for a v2 and a v1 document", () => {
    const v2 = rawDoc([
      {
        id: "datasets",
        type: "datasets",
        title: "Datasets & Software",
        visible: true,
        order: 5,
        items: [rawItem("s1", { meta: { type: "Software" } })],
      },
    ]);
    const migrated = migrateCanonicalDocument(v2) as { sections: CvSection[] };
    expect(migrated.sections.map((s) => s.type)).toEqual(["datasets", "software"]);
    const parsed = parseCanonicalCv(v2);
    expect(parsed.sections.find((s) => s.type === "software")?.items[0]?.id).toBe("s1");
    expect(parsed.sections.find((s) => s.type === "datasets")?.title).toBe("Datasets");

    const v1 = { ...v2, schemaVersion: 1, narrative: [] };
    const fromV1 = migrateCanonicalDocument(v1) as { schemaVersion: number; sections: CvSection[] };
    expect(fromV1.schemaVersion).toBe(2);
    expect(fromV1.sections.map((s) => s.type)).toEqual(["datasets", "software"]);
  });
});

// ─── per-view exclusions + presets follow the move ───────────────────────────

/** A preset snapshot whose display hid `ids` under the `datasets` section. */
function presetHiding(id: string, ids: string[], extra: Record<string, unknown> = {}) {
  return {
    id,
    name: id,
    display: { ...DisplayChoicesSchema.parse({}), excludedItems: { datasets: ids } },
    sectionVisibility: { publications: true, datasets: false },
    sectionOrder: ["publications", "datasets", "grants"],
    ...extra,
  };
}

describe("software section — per-view exclusions and presets follow the move", () => {
  const preSplitSections = [
    { id: "publications", type: "publications", title: "P", visible: true, order: 0, items: [] },
    {
      id: "datasets",
      type: "datasets",
      title: "Datasets & Software",
      visible: true,
      order: 5,
      items: [
        rawItem("A", { order: 0, meta: { type: "Dataset" } }),
        rawItem("B", { order: 1, meta: { type: "Software" } }),
        rawItem("C", { order: 2, meta: { type: "Software" } }),
      ],
    },
    { id: "grants", type: "grants", title: "G", visible: true, order: 8, items: [] },
  ];

  it("migration re-keys a hidden software item from datasets to software, on display AND presets", () => {
    const doc = {
      ...rawDoc(preSplitSections, { excludedItems: { datasets: ["A", "B"], grants: ["g"] } }),
      presets: [presetHiding("grant", ["B", "C"]), presetHiding("full", ["A"])],
    };
    const out = migrateSoftwareSection(doc) as CanonicalCv;
    expect(out.display.excludedItems).toEqual({
      datasets: ["A"],
      grants: ["g"],
      software: ["B"],
    });
    const [grant, full] = out.presets!;
    // Both moved ids left `datasets` (list pruned) and landed under `software`.
    expect(grant!.display.excludedItems).toEqual({ software: ["B", "C"] });
    // The preset that hid "Datasets & Software" keeps the split-out Software hidden
    // too, and the new section sits right after its parent in the saved order.
    expect(grant!.sectionVisibility).toEqual({
      publications: true,
      datasets: false,
      software: false,
    });
    expect(grant!.sectionOrder).toEqual(["publications", "datasets", "software", "grants"]);
    // A preset that never hid a software item keeps its exclusion list untouched.
    expect(full!.display.excludedItems).toEqual({ datasets: ["A"] });
    // Never mutates the input.
    expect((doc as unknown as CanonicalCv).display.excludedItems).toEqual({
      datasets: ["A", "B"],
      grants: ["g"],
    });
    expect(doc.presets[0]!.display.excludedItems).toEqual({ datasets: ["B", "C"] });
    // ...and the migrated document still validates.
    expect(() => parseCanonicalCv(out)).not.toThrow();
  });

  it("migration appending to an existing software section re-keys under that section's own id", () => {
    const doc = {
      ...rawDoc(
        [
          ...preSplitSections.slice(0, 2),
          { id: "sw-custom", type: "software", title: "Code", visible: true, order: 6, items: [] },
        ],
        { excludedItems: { datasets: ["B"], "sw-custom": ["old"] } },
      ),
    };
    const out = migrateSoftwareSection(doc) as CanonicalCv;
    expect(out.display.excludedItems).toEqual({ "sw-custom": ["old", "B"] });
  });

  it("rebuild re-keys a datasets-view exclusion to the Software section the deposit now lands in", () => {
    const first = build({ dataciteOutputs: [SW_DEPOSIT, DS_DEPOSIT] });
    const sw = sectionOf(first, "software")!;
    const ds = sectionOf(first, "datasets")!;
    const swId = sw.items[0]!.id;
    const dsId = ds.items[0]!.id;
    const preSplit: CanonicalCv = {
      ...first,
      display: { ...first.display, excludedItems: { datasets: [swId, dsId] } },
      sections: [
        ...first.sections.filter((s) => s.type !== "software" && s.type !== "datasets"),
        { ...ds, title: "Datasets & Software", items: [...ds.items, ...sw.items] },
      ],
      presets: [
        {
          id: "grant",
          name: "grant",
          display: { ...first.display, excludedItems: { datasets: [swId] } },
          sectionVisibility: { datasets: false },
          sectionOrder: ["publications", "datasets"],
        },
      ],
    };
    const second = build({ dataciteOutputs: [SW_DEPOSIT, DS_DEPOSIT] }, preSplit);
    expect(second.display.excludedItems).toEqual({ datasets: [dsId], software: [swId] });
    expect(second.presets![0]!.display.excludedItems).toEqual({ software: [swId] });
    expect(second.presets![0]!.sectionVisibility).toEqual({ datasets: false, software: false });
    expect(second.presets![0]!.sectionOrder).toEqual(["publications", "datasets", "software"]);
    // The public projection of that view still hides the item the owner hid.
    const pub = projectCvForPublic(second);
    expect(sectionOf(pub, "software")!.items.map((i) => i.id)).toEqual([]);
    expect(sectionOf(pub, "datasets")!.items.map((i) => i.id)).toEqual([]);
    // Nothing excluded under `datasets` → the rebuild carries display/presets as-is.
    const untouched = build({ dataciteOutputs: [SW_DEPOSIT] }, first);
    expect(untouched.display).toEqual(first.display);
    expect(untouched.presets).toEqual(first.presets);
  });

  it("public projection of a migrated document hides the re-keyed item", () => {
    const doc = rawDoc(preSplitSections, { excludedItems: { datasets: ["B"] } });
    const pub = projectCvForPublic(parseCanonicalCv(doc));
    expect(sectionOf(pub, "software")!.items.map((i) => i.id)).toEqual(["C"]);
    expect(sectionOf(pub, "datasets")!.items.map((i) => i.id)).toEqual(["A"]);
  });

  it("migration falls back to the default section ids when a raw section carries none", () => {
    // A junk document whose datasets / software sections (and a moved item) have no
    // id: the move still lands, and the exclusion re-keying uses the default ids.
    const doc = rawDoc(
      [
        {
          type: "datasets",
          items: [rawItem("B", { meta: { type: "Software" } }), { meta: { type: "Software" } }],
        },
        { type: "software", items: [] },
      ],
      { excludedItems: { datasets: ["B"] } },
    );
    const out = migrateSoftwareSection(doc) as CanonicalCv;
    expect(out.sections[1]!.items).toHaveLength(2);
    expect(out.display.excludedItems).toEqual({ software: ["B"] });
  });

  it("moveSectionViewState is identity-preserving and defensive on junk", () => {
    const base = rawDoc([], { excludedItems: { datasets: ["A"] } });
    // Nothing moved / same section / no matching id → the very same object.
    expect(moveSectionViewState(base, "datasets", "software", [])).toBe(base);
    expect(moveSectionViewState(base, "datasets", "datasets", ["A"])).toBe(base);
    expect(moveSectionViewState(base, "datasets", "software", ["Z"])).toBe(base);
    const noMap = rawDoc([], { excludedItems: undefined });
    expect(moveSectionViewState(noMap, "datasets", "software", ["A"])).toBe(noMap);
    // Junk shapes are tolerated (left as they are), and non-string ids never move.
    const junk = {
      display: "nope",
      presets: [null, 7, { display: { excludedItems: { datasets: "x" } } }, { display: null }],
    };
    expect(moveSectionViewState(junk, "datasets", "software", ["A"])).toBe(junk);
    const junkIds = { display: { excludedItems: { datasets: [1, "A", null] } } };
    const out = moveSectionViewState(junkIds, "datasets", "software", ["A"]) as {
      display: { excludedItems: Record<string, unknown[]> };
    };
    expect(out.display.excludedItems).toEqual({ datasets: [1, null], software: ["A"] });
    // Presets with junk / absent snapshots: only the parts that can follow, follow.
    const partial = {
      presets: [
        { display: { excludedItems: { datasets: ["A"] } } },
        { sectionVisibility: { datasets: true, software: false }, sectionOrder: "x" },
        { sectionVisibility: { datasets: "yes" }, sectionOrder: ["datasets", "software"] },
        { sectionVisibility: null, sectionOrder: ["publications"] },
      ],
    };
    const next = moveSectionViewState(partial, "datasets", "software", ["A"]) as typeof partial;
    expect(next.presets[0]).toEqual({ display: { excludedItems: { software: ["A"] } } });
    expect(next.presets[1]).toBe(partial.presets[1]);
    expect(next.presets[2]).toBe(partial.presets[2]);
    expect(next.presets[3]).toBe(partial.presets[3]);
    // Deduped when the target list already carries the id.
    const dup = { display: { excludedItems: { datasets: ["A"], software: ["A"] } } };
    expect(
      (moveSectionViewState(dup, "datasets", "software", ["A"]) as typeof dup).display
        .excludedItems,
    ).toEqual({ software: ["A"] });
  });
});

// ─── rendering + public JSON-LD ──────────────────────────────────────────────

function renderable(items: CvItem[], display: Record<string, unknown> = {}): CanonicalCv {
  return {
    schemaVersion: 2,
    id: "r",
    owner: {
      orcid: "0000-0002-7483-2489",
      openAlexAuthorIds: [],
      displayName: "X",
      links: [],
      countsByYear: [],
    },
    display: DisplayChoicesSchema.parse(display),
    sections: [
      { id: "software", type: "software", title: "Software", visible: true, order: 0, items },
    ],
    presets: [],
    provenance: { generatedAt: "t0", lastSyncedAt: "t0", sources: ["datacite"] },
  };
}

function swItem(id: string, over: Partial<CvItem> = {}): CvItem {
  return {
    id,
    source: "datacite",
    sourceId: id,
    displayText: `sigmatool. Zenodo (2025) [Software]. https://doi.org/10.5281/zenodo.100`,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    meta: { doi: "10.5281/zenodo.100", type: "Software" },
    ...over,
  };
}

describe("software section — rendering", () => {
  it("renders the entry line with a DOI link plus a details line (source code · version · licence)", () => {
    const html = renderCvHtml(
      renderable([
        swItem("s1", {
          meta: {
            doi: "10.5281/zenodo.100",
            type: "Software",
            repositoryUrl: "https://github.com/user/sigmatool",
            version: "1.2.0",
            license: "MIT",
          },
        }),
      ]),
    );
    expect(html).toContain('href="https://doi.org/10.5281/zenodo.100"');
    expect(html).toContain('<div class="cv-software-details">');
    expect(html).toContain('href="https://github.com/user/sigmatool"');
    expect(html).toContain(">Source code</a> · Version 1.2.0 · License: MIT</div>");
    expect(html).toContain('<h2 id="sec-software">Software');
  });

  it("omits the details line entirely when the item carries none of the three, and refuses a non-http repo", () => {
    const bare = renderCvHtml(renderable([swItem("s1")]));
    expect(bare).not.toContain('<div class="cv-software-details">');
    const js = renderCvHtml(
      renderable([
        swItem("s1", { meta: { type: "Software", repositoryUrl: "javascript:alert(1)" } }),
      ]),
    );
    expect(js).not.toContain("javascript:");
    expect(js).not.toContain('<div class="cv-software-details">');
    const versionOnly = renderCvHtml(
      renderable([swItem("s1", { meta: { type: "Software", version: "  2.0 " } })]),
    );
    expect(versionOnly).toContain('<div class="cv-software-details">Version 2.0</div>');
  });

  it("localises the details line and shows the archival link when showArchivalStatus is on", () => {
    const html = renderCvHtml(
      renderable(
        [
          swItem("s1", {
            meta: {
              type: "Software",
              repositoryUrl: "https://github.com/user/sigmatool",
              license: "MIT",
              swhid: `swh:1:snp:${"a".repeat(40)}`,
            },
          }),
        ],
        { locale: "fr-FR", showArchivalStatus: true },
      ),
    );
    expect(html).toContain(">Code source</a> · Licence : MIT</div>");
    expect(html).toContain("cv-badge-archived");
    expect(html).toContain(`https://archive.softwareheritage.org/swh:1:snp:${"a".repeat(40)}`);
  });

  it("hides the details line on the parser-safe ATS template", () => {
    const html = renderCvHtml(
      renderable(
        [swItem("s1", { meta: { type: "Software", repositoryUrl: "https://github.com/u/r" } })],
        { template: "ats" },
      ),
    );
    expect(html).toContain(".cv-software-details { display: none !important; }");
  });

  it("emits SoftwareSourceCode nodes for the Software section in the public JSON-LD", () => {
    const cv = renderable([
      swItem("s1", { csl: { id: "s1", type: "article", title: "sigmatool" } }),
    ]);
    const works = JSON.parse(profilePageJsonLd(cv, "slug")).mainEntity["@reverse"]?.author ?? [];
    expect(works).toHaveLength(1);
    expect(works[0]["@type"]).toBe("SoftwareSourceCode");
    expect(works[0]["@id"]).toBe("https://doi.org/10.5281/zenodo.100");
  });
});

// ─── CV models ───────────────────────────────────────────────────────────────

describe("software section — CV models", () => {
  it("is shown by the models whose funders count research software, and by no pure-narrative model", () => {
    const model = (id: string) => CV_MODELS.find((m) => m.id === id)!;
    for (const id of ["snsf", "nwo", "wellcome", "nih", "nsf"]) {
      expect(model(id).sections, id).toContain("software");
    }
    for (const id of ["ukri-r4ri", "royal-society", "erc", "europass", "rirekisho"]) {
      expect(model(id).sections, id).not.toContain("software");
    }
    // NSF lists software right after Publications ("Products"), before Synergistic Activities.
    const nsf = model("nsf").sections;
    expect(nsf.indexOf("software")).toBe(nsf.indexOf("publications") + 1);
  });
});

// ─── DataCite client: version + licence ──────────────────────────────────────

function res(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as unknown as Response;
}

describe("software section — DataCite version + licence extraction", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("reads attributes.version and the first rightsList identifier (else its free text)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res({
          data: [
            {
              attributes: {
                doi: "10.5281/zenodo.10",
                titles: [{ title: "Tool" }],
                types: { resourceTypeGeneral: "Software" },
                version: " v1.4.2 ",
                rightsList: [
                  { rights: "MIT License", rightsIdentifier: "MIT" },
                  { rights: "Something else" },
                ],
              },
            },
            {
              attributes: {
                doi: "10.5281/zenodo.11",
                titles: [{ title: "Tool 2" }],
                types: { resourceTypeGeneral: "Software" },
                rightsList: [{ rights: "Creative Commons Attribution 4.0" }],
              },
            },
            {
              attributes: {
                doi: "10.5281/zenodo.12",
                titles: [{ title: "Tool 3" }],
                types: { resourceTypeGeneral: "Software" },
                version: 3,
                rightsList: "not-a-list",
              },
            },
          ],
        }),
      ),
    );
    const out = await fetchDataciteOutputs("0000-0002-7483-2489");
    expect(out[0]).toMatchObject({ version: "v1.4.2", license: "MIT" });
    expect(out[1]?.version).toBeUndefined();
    expect(out[1]?.license).toBe("Creative Commons Attribution 4.0");
    expect(out[2]?.version).toBeUndefined();
    expect(out[2]?.license).toBeUndefined();
  });
});

// ─── Software Heritage enrichment targets the Software section ───────────────

describe("software section — Software Heritage enrichment", () => {
  beforeEach(() => mocks.fetchSoftwareHeritageArchival.mockReset());

  it("looks up items of the Software section (and a software-typed straggler under Datasets), never a plain dataset", async () => {
    mocks.fetchSoftwareHeritageArchival.mockResolvedValue({
      swhid: `swh:1:snp:${"b".repeat(40)}`,
      archivedAt: "2026-01-01",
    });
    const cv: CanonicalCv = {
      ...renderable([
        swItem("s1", { meta: { repositoryUrl: "https://github.com/u/one" } }), // no type: section decides
        swItem("hidden", { included: false, meta: { repositoryUrl: "https://github.com/u/hid" } }),
      ]),
      sections: [
        ...renderable([
          swItem("s1", { meta: { repositoryUrl: "https://github.com/u/one" } }),
          swItem("hidden", {
            included: false,
            meta: { repositoryUrl: "https://github.com/u/hid" },
          }),
        ]).sections,
        {
          id: "datasets",
          type: "datasets",
          title: "Datasets",
          visible: true,
          order: 1,
          items: [
            swItem("straggler", {
              meta: { type: "Software", repositoryUrl: "https://github.com/u/two" },
            }),
            swItem("plain", {
              meta: { type: "Dataset", repositoryUrl: "https://github.com/u/three" },
            }),
          ],
        },
      ],
    };
    const out = await enrichCvWithSoftwareHeritage(cv);
    const urls = mocks.fetchSoftwareHeritageArchival.mock.calls.map((c) => c[0]).sort();
    expect(urls).toEqual(["https://github.com/u/one", "https://github.com/u/two"]);
    expect(itemIn(out, "software", "s1")?.meta.swhid).toBe(`swh:1:snp:${"b".repeat(40)}`);
    expect(itemIn(out, "datasets", "straggler")?.meta.swhArchivedAt).toBe("2026-01-01");
    expect(itemIn(out, "datasets", "plain")?.meta.swhid).toBeUndefined();
    expect(itemIn(out, "software", "hidden")?.meta.swhid).toBeUndefined();
    expect(out.provenance.sources).toContain("softwareheritage");
  });
});
