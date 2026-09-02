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

  // Regression guard for the Zod 4.5 `.catch()` change: a property carrying a
  // `default` is one the parser fills in when it is missing, so requiring it in
  // the published schema would reject documents `safeParseCanonicalCv` accepts.
  it("never marks a defaulted property required (the parser accepts it missing)", () => {
    const offenders: string[] = [];
    const walk = (node: unknown, path: string): void => {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) {
        node.forEach((child, i) => walk(child, path + "[" + i + "]"));
        return;
      }
      const obj = node as Record<string, unknown>;
      const props = obj.properties as Record<string, Record<string, unknown>> | undefined;
      const required = obj.required;
      if (props && Array.isArray(required)) {
        for (const name of required as string[]) {
          if (props[name] && "default" in props[name]) offenders.push(path + "." + name);
        }
      }
      for (const [key, value] of Object.entries(obj)) walk(value, path + "." + key);
    };
    walk(buildCanonicalCvJsonSchema(), "$");
    expect(offenders).toEqual([]);
  });
});
