import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay } from "@/lib/canonical/curate";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { buildRoCrateMetadata, rocrateRenderer } from "@/lib/render/rocrate";

interface MakeOpts {
  orcid?: string;
  displayName?: string;
  cvLicense?: CanonicalCv["display"]["cvLicense"];
}

function makeCv(opts: MakeOpts = {}): CanonicalCv {
  let cv = buildCanonicalCv({
    id: "j",
    resolved: {
      orcid: "0000-0002-7483-2489",
      authorIds: ["A5001069481"],
      displayName: "Ada Lovelace",
    },
    works: [],
    now: "2026-06-02T00:00:00.000Z",
  });
  if (opts.orcid !== undefined) cv = { ...cv, owner: { ...cv.owner, orcid: opts.orcid } };
  if (opts.displayName !== undefined)
    cv = { ...cv, owner: { ...cv.owner, displayName: opts.displayName } };
  if (opts.cvLicense) cv = updateDisplay(cv, { cvLicense: opts.cvLicense });
  return cv;
}

/** Find the entity with a given @id in an RO-Crate @graph. */
function entity(meta: Record<string, unknown>, id: string): Record<string, unknown> | undefined {
  const graph = meta["@graph"] as Record<string, unknown>[];
  return graph.find((e) => e["@id"] === id);
}

describe("buildRoCrateMetadata", () => {
  it("describes the CV as an RO-Crate Dataset with author, license and file parts", () => {
    const meta = buildRoCrateMetadata(makeCv({ cvLicense: "CC-BY-4.0" }));
    expect(meta["@context"]).toBe("https://w3id.org/ro/crate/1.1/context");

    const descriptor = entity(meta, "ro-crate-metadata.json");
    expect((descriptor?.conformsTo as { "@id": string })["@id"]).toBe(
      "https://w3id.org/ro/crate/1.1",
    );

    const root = entity(meta, "./");
    expect(root?.["@type"]).toBe("Dataset");
    expect(root?.datePublished).toBe("2026-06-02T00:00:00.000Z");
    expect((root?.author as { "@id": string })["@id"]).toBe(
      "https://orcid.org/0000-0002-7483-2489",
    );
    expect((root?.license as { "@id": string })["@id"]).toContain("CC-BY-4.0");
    expect((root?.hasPart as { "@id": string }[]).map((p) => p["@id"])).toEqual([
      "cv.json",
      "cv.csl.json",
      "cv.bib",
      "cv.html",
    ]);

    // Author is a Person keyed by the ORCID IRI; license is its own entity.
    const person = entity(meta, "https://orcid.org/0000-0002-7483-2489");
    expect(person?.["@type"]).toBe("Person");
    expect(person?.identifier).toBe("https://orcid.org/0000-0002-7483-2489");
    expect(entity(meta, "https://spdx.org/licenses/CC-BY-4.0.html")).toBeDefined();
    // Each bundled file is a File entity.
    for (const id of ["cv.json", "cv.csl.json", "cv.bib", "cv.html"]) {
      expect(entity(meta, id)?.["@type"]).toBe("File");
    }
  });

  it("falls back to a local author id and omits the license when there is none", () => {
    const meta = buildRoCrateMetadata(makeCv({ orcid: "", displayName: "" }));
    const root = entity(meta, "./");
    expect((root?.author as { "@id": string })["@id"]).toBe("#author");
    expect(root?.license).toBeUndefined();
    // Empty display name falls back to a generic label.
    expect(root?.name).toBe("Researcher — Curriculum Vitae");
    const person = entity(meta, "#author");
    expect(person?.["@type"]).toBe("Person");
    expect(person?.name).toBe("Researcher");
    expect(person?.identifier).toBeUndefined();
  });

  it("rejects a malformed ORCID, using the local author id", () => {
    const meta = buildRoCrateMetadata(makeCv({ orcid: "not-an-orcid" }));
    expect((entity(meta, "./")?.author as { "@id": string })["@id"]).toBe("#author");
  });
});

describe("rocrateRenderer", () => {
  it("produces a ZIP containing the metadata descriptor and all bundled files", async () => {
    const result = await rocrateRenderer.render({ cv: makeCv({ cvLicense: "CC-BY-4.0" }) });
    expect(result.mimeType).toBe("application/zip");
    expect(result.filename).toMatch(/\.crate\.zip$/);
    expect(result.buffer).toBeInstanceOf(Buffer);

    const zip = await JSZip.loadAsync(result.buffer as Buffer);
    expect(Object.keys(zip.files).sort()).toEqual([
      "cv.bib",
      "cv.csl.json",
      "cv.html",
      "cv.json",
      "ro-crate-metadata.json",
    ]);
    // The metadata file is valid JSON-LD with the RO-Crate context.
    const metaText = await zip.file("ro-crate-metadata.json")!.async("string");
    expect(JSON.parse(metaText)["@context"]).toBe("https://w3id.org/ro/crate/1.1/context");
    // The canonical object round-trips.
    const canonical = JSON.parse(await zip.file("cv.json")!.async("string"));
    expect(canonical.owner.displayName).toBe("Ada Lovelace");
  });
});
