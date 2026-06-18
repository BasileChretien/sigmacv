import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateOwner } from "@/lib/canonical/curate";
import { renderCvHtml } from "@/lib/render/html";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";

const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};
const base = buildCanonicalCv({ id: "w", resolved, works: [], now: "2026-06-18T00:00:00.000Z" });

describe("contact Website field — icon auto-detection", () => {
  it("a LinkedIn URL in the Website field gets the LinkedIn brand mark + a clean label", () => {
    const cv = updateOwner(base, { contact: { website: "https://www.linkedin.com/in/foo" } });
    const html = renderCvHtml(cv);
    // The visible label is the auto-detected service ("LinkedIn"), not the raw URL —
    // which only happens when the host is detected (a globe fallback shows the URL).
    expect(html).toContain(">LinkedIn</a>");
    // The clickable href still carries the real URL.
    expect(html).toContain('href="https://www.linkedin.com/in/foo"');
  });

  it("a generic website keeps the globe icon and shows its URL text", () => {
    const cv = updateOwner(base, { contact: { website: "https://example.org" } });
    const html = renderCvHtml(cv);
    expect(html).toContain("example.org");
  });
});
