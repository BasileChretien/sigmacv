import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CV_SCHEMA_ID, CV_SCHEMA_PATH, buildCanonicalCvJsonSchema } from "../scripts/gen-cv-schema";

describe("published canonical CV JSON Schema", () => {
  it("is a self-contained draft-07 schema with the stable $id and core properties", () => {
    const s = buildCanonicalCvJsonSchema();
    expect(String(s.$schema)).toContain("draft-07");
    expect(s.$id).toBe(CV_SCHEMA_ID);
    expect(s.type).toBe("object");
    const props = s.properties as Record<string, unknown>;
    for (const key of ["schemaVersion", "owner", "display", "sections", "provenance"]) {
      expect(props[key]).toBeDefined();
    }
    // $refStrategy "none" → no shared definitions block (fully inlined).
    expect(s.definitions).toBeUndefined();
  });

  it("matches the committed public/schema/cv/v2.json (run `npm run gen:schema` if this fails)", () => {
    const committed = JSON.parse(readFileSync(CV_SCHEMA_PATH, "utf8"));
    expect(committed).toEqual(buildCanonicalCvJsonSchema());
  });
});
