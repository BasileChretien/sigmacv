import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay } from "@/lib/canonical/curate";
import { iconSvg } from "@/lib/render/icons";
import { renderCvHtml } from "@/lib/render/html";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";

const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};
const base = buildCanonicalCv({ id: "w", resolved, works: [], now: "2026-06-18T00:00:00.000Z" });

describe("header ORCID iD line — brand icon", () => {
  it("leads the ORCID iD line with the green ORCID icon", () => {
    const html = renderCvHtml(base);
    // The dedicated iD line now carries the ORCID brand mark (its signature green).
    expect(html).toContain('<div class="cv-ids">');
    expect(html).toContain('fill="#A6CE39"'); // ORCID green, only used by the ORCID icon
    // The icon precedes the "ORCID:" label + the linked iD.
    expect(html).toContain(`${iconSvg("orcid")}ORCID:`);
    expect(html).toContain('href="https://orcid.org/0000-0002-7483-2489"');
  });

  it("suppresses the icon on the parser-safe ATS template but keeps the iD", () => {
    const html = renderCvHtml(updateDisplay(base, { template: "ats" }));
    expect(html).not.toContain('fill="#A6CE39"'); // no decorative icon on ATS
    expect(html).toContain("ORCID:");
    expect(html).toContain('href="https://orcid.org/0000-0002-7483-2489"');
  });

  it("renders no iD line when the owner has no ORCID", () => {
    const noOrcid = { ...base, owner: { ...base.owner, orcid: "" } };
    expect(renderCvHtml(noOrcid)).not.toContain('class="cv-ids"');
  });
});
