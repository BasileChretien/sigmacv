import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import type { DataciteOutput } from "@/lib/datacite/client";
import type { OpenaireOutput } from "@/lib/openaire/client";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { CanonicalCv } from "@/lib/canonical/schema";

const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A1"],
  displayName: "Basile Chrétien",
};

/** Items of the Datasets AND Software sections (the split is by recorded type). */
const dsItems = (cv: CanonicalCv) =>
  cv.sections.filter((s) => s.type === "datasets" || s.type === "software").flatMap((s) => s.items);
const sectionTypeOf = (cv: CanonicalCv, id: string) =>
  cv.sections.find((s) => s.items.some((i) => i.id === id))?.type;

describe("datasets/software item meta.type + meta.repositoryUrl (build.ts)", () => {
  it("stamps DataCite's resourceTypeGeneral onto meta.type", () => {
    const cv = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [],
      dataciteOutputs: [
        { doi: "10.5281/zenodo.1", title: "A dataset", type: "Dataset", year: 2024 },
        {
          doi: "10.5281/zenodo.2",
          title: "A tool",
          type: "Software",
          year: 2024,
          repositoryUrl: "https://github.com/user/repo",
        },
      ] as DataciteOutput[],
      now: "2026-06-02T00:00:00.000Z",
    });
    const items = dsItems(cv);
    const dataset = items.find((i) => i.meta.doi === "10.5281/zenodo.1")!;
    const software = items.find((i) => i.meta.doi === "10.5281/zenodo.2")!;
    expect(dataset.meta.type).toBe("Dataset");
    expect(dataset.meta.repositoryUrl).toBeUndefined();
    expect(software.meta.type).toBe("Software");
    expect(software.meta.repositoryUrl).toBe("https://github.com/user/repo");
    expect(sectionTypeOf(cv, dataset.id)).toBe("datasets");
    expect(sectionTypeOf(cv, software.id)).toBe("software");
  });

  it("stamps OpenAIRE's own dataset|software type onto meta.type", () => {
    const cv = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [],
      openaireOutputs: [
        { openaireId: "oa1", title: "An OpenAIRE dataset", type: "dataset", year: 2024 },
        { openaireId: "oa2", title: "An OpenAIRE tool", type: "software", year: 2024 },
      ] as OpenaireOutput[],
      now: "2026-06-02T00:00:00.000Z",
    });
    const items = dsItems(cv);
    const oaDataset = items.find((i) => i.sourceId === "oa1")!;
    const oaSoftware = items.find((i) => i.sourceId === "oa2")!;
    expect(oaDataset.meta.type).toBe("dataset");
    expect(oaSoftware.meta.type).toBe("software");
    expect(sectionTypeOf(cv, oaDataset.id)).toBe("datasets");
    expect(sectionTypeOf(cv, oaSoftware.id)).toBe("software");
  });
});
