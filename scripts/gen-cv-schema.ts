import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { z } from "zod";
import { CANONICAL_SCHEMA_VERSION, CanonicalCvSchema } from "@/lib/canonical/schema";

/**
 * Generate the PUBLISHED JSON Schema for the canonical CV object.
 *
 * SigmaCV's single source of truth is the Zod `CanonicalCvSchema`. This derives a
 * standard JSON Schema (draft-07) from it so other tools can validate / adopt the
 * format. Committed at `public/schema/cv/v2.json` → served at the stable `$id`
 * below; a unit test (`tests/cv-json-schema.test.ts`) fails if the committed file
 * drifts from the Zod schema, so regenerate with `npm run gen:schema` after any
 * change to `canonical/schema.ts`.
 */

/** Stable, canonical published location of the schema (its `$id`). */
export const CV_SCHEMA_ID = "https://sigmacv.org/schema/cv/v2.json";

/** Build the published JSON Schema object from the Zod canonical schema. Pure. */
export function buildCanonicalCvJsonSchema(): Record<string, unknown> {
  const generated = z.toJSONSchema(CanonicalCvSchema, {
    // Keep draft-07 (matches the published artifact + the drift-guard test).
    target: "draft-7",
    // Describe the INPUT shape so fields with a `.default()` stay optional, as
    // the previous generator emitted them (a produced CV has them, but a
    // consumer validating a partial document should not be forced to supply them).
    io: "input",
    // Inline reused subschemas → one self-contained document (no `$defs`),
    // which the widest range of validators and editors consume directly.
    reused: "inline",
  }) as Record<string, unknown>;
  return {
    ...generated,
    $id: CV_SCHEMA_ID,
    title: "SigmaCV canonical CV",
    description: `The canonical CV object SigmaCV produces and validates (schemaVersion ${CANONICAL_SCHEMA_VERSION}). Derived from the Zod schema; source at https://github.com/BasileChretien/sigmacv.`,
  };
}

/** Absolute path of the committed artifact. */
export const CV_SCHEMA_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../public/schema/cv/v2.json",
);

// Run directly (`tsx scripts/gen-cv-schema.ts`) → (re)write the committed file.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  mkdirSync(dirname(CV_SCHEMA_PATH), { recursive: true });
  writeFileSync(CV_SCHEMA_PATH, `${JSON.stringify(buildCanonicalCvJsonSchema(), null, 2)}\n`);
  // eslint-disable-next-line no-console
  console.log(`Wrote ${CV_SCHEMA_PATH}`);
}
