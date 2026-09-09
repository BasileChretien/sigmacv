import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Pages whose content depends on a RUNTIME secret must not be prerendered at
 * image build time (where no secret exists): the objection pages decide from
 * PREVIEW_SUPPRESSION_KEY whether objections are available, and a static
 * render baked "unavailable" into production HTML on 2026-09-09.
 */
describe("runtime-env pages render per request", () => {
  it.each(["src/app/object/page.tsx", "src/app/[locale]/object/page.tsx"])(
    '%s exports dynamic = "force-dynamic"',
    (file) => {
      expect(readFileSync(file, "utf8")).toMatch(/export const dynamic = "force-dynamic";/);
    },
  );
});
