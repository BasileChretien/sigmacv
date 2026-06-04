import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { getRenderer } from "@/lib/render";
import { renderCvWebpage, webpageRenderer } from "@/lib/render/webpage";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const hasApa = listAvailableStyles().includes("apa");
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};
const works = worksFixture as unknown as OpenAlexWork[];
const cv = buildCanonicalCv({ id: "w", resolved, works, now: "2026-06-02T00:00:00.000Z" });

describe("getRenderer", () => {
  it("resolves the webpage renderer", async () => {
    const r = await getRenderer("webpage");
    expect(r.format).toBe("webpage");
  });
});

describe.skipIf(!hasApa)("renderCvWebpage", () => {
  it("is a standalone, animated, interactive HTML document", () => {
    const html = renderCvWebpage(cv);
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain('<html lang="en-US">');
    expect(html).toContain("</html>");
    // The CV content is present.
    expect(html).toContain("Basile");
    expect(html.toLowerCase()).toContain("adverse drug reactions");
    // Animation: a living gradient hero + a pure-CSS entrance (no JS, so content
    // can never get stuck hidden — content is always revealed by the animation's
    // fill-mode). No <script> at all.
    expect(html).toContain("@keyframes heroShift");
    expect(html).toContain("@keyframes cvRise");
    expect(html).toContain("animation: cvRise");
    expect(html).not.toContain("<script");
    // Respects reduced-motion + declares light colour scheme.
    expect(html).toContain("prefers-reduced-motion");
    expect(html).toContain("color-scheme: light");
  });

  it("exposes a downloadable .html result", async () => {
    const res = await webpageRenderer.render({ cv });
    expect(res.mimeType).toContain("text/html");
    expect(res.filename).toMatch(/-cv-web\.html$/);
    expect(res.html).toContain("<!DOCTYPE html>");
  });
});
