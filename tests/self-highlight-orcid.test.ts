import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { setItemIncluded } from "@/lib/canonical/curate";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { renderCvHtml } from "@/lib/render/html";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";

const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};
const hasApa = listAvailableStyles().includes("apa");

/**
 * An ORCID-discovered work whose "Chrétien" authorship OpenAlex put on an ORPHAN
 * author profile — no ORCID, an author id NOT in the holder's resolved set — and
 * with the odd casing OpenAlex sometimes stores ("ChréTien"). This is the exact
 * shape of the two real papers that weren't highlighting.
 */
function orphanWork(): OpenAlexWork {
  return {
    id: "https://openalex.org/W_ORPHAN",
    doi: "https://doi.org/10.1093/ehjcvp/pvaf027",
    title: "Anticancer drugs and cardiac dysfunction",
    display_name: "Anticancer drugs and cardiac dysfunction",
    publication_year: 2025,
    type: "article",
    primary_location: { source: { display_name: "Eur. Heart J.", type: "journal" } },
    authorships: [
      {
        author: { id: "https://openalex.org/A5053303683", display_name: "Damien Legallois" },
        author_position: "first",
      },
      {
        author: {
          id: "https://openalex.org/A5062007856",
          display_name: "Basile ChréTien",
          orcid: null,
        },
        raw_author_name: "Basile Chrétien",
        author_position: "middle",
      },
    ],
  } as unknown as OpenAlexWork;
}

function buildWithOrphan() {
  return buildCanonicalCv({
    id: "cv",
    resolved,
    works: [],
    orcidDiscoveredWorks: [orphanWork()],
    now: "2026-06-02T00:00:00.000Z",
  });
}

describe("self-name highlight on ORCID-discovered (orphan-profile) works", () => {
  it("fills selfNameVariants from the owner name when no authorship identifier-matches", () => {
    const item = buildWithOrphan()
      .sections.flatMap((s) => s.items)
      .find((i) => i.id === "W_ORPHAN")!;
    expect(item.meta.reviewFlag).toBe("orcid-doi");
    // No authorship carried a recognised identifier, so the matcher couldn't flag one…
    expect(item.authoredBySelf).toBe(false);
    // …but the work IS the holder's (ORCID-DOI), so the variants are filled from the
    // owner name — including the bare family token the citation styles render.
    expect(item.selfNameVariants).toContain("Chrétien");
  });

  it.skipIf(!hasApa)(
    "highlights the self name in the rendered CV (case-insensitive — matches 'ChréTien')",
    () => {
      let cv = buildWithOrphan();
      // The candidate starts hidden; the holder keeps it (shows it).
      cv = setItemIncluded(cv, "publications", "W_ORPHAN", true);
      const html = renderCvHtml(cv);
      // The odd-cased family token OpenAlex stored is wrapped, even though the
      // variant is "Chrétien" (lower-case t) — case-insensitive matching.
      expect(html).toContain('<span class="cv-self">ChréTien</span>');
    },
  );
});
