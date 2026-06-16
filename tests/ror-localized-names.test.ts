import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { setItemTextOverride, updateDisplay } from "@/lib/canonical/curate";
import { displayInstitution } from "@/lib/canonical/schema";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import type { OrcidPosition } from "@/lib/orcid/client";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import { renderCvHtml } from "@/lib/render/html";
import { __clearRorCache, DISPLAY_NAME_LANGS, resolveInstitution } from "@/lib/ror/client";

// ── ROR client: localized-name extraction ────────────────────────────────────

function res(body: unknown) {
  return { ok: true, json: async () => body } as unknown as Response;
}

describe("DISPLAY_NAME_LANGS", () => {
  it("stays in sync with the SUPPORTED_LOCALES language subtags", () => {
    const expected = new Set(SUPPORTED_LOCALES.map((l) => l.split("-")[0]));
    expect(new Set(DISPLAY_NAME_LANGS)).toEqual(expected);
  });
});

describe("resolveInstitution localized names", () => {
  beforeEach(() => __clearRorCache());
  afterEach(() => vi.restoreAllMocks());

  it("extracts a lang→value map, prefers label over alias, drops unsupported langs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res({
          items: [
            {
              chosen: true,
              organization: {
                id: "https://ror.org/04chrp450",
                names: [
                  { types: ["ror_display", "label"], value: "Nagoya University", lang: "en" },
                  { types: ["label"], value: "名古屋大学", lang: "ja" },
                  { types: ["alias"], value: "Nagoya Daigaku", lang: "ja" }, // alias must NOT win over the ja label
                  { types: ["label"], value: "Université de Nagoya", lang: "fr" },
                  { types: ["label"], value: "Universitas Nagoyaensis", lang: "la" }, // unsupported → dropped
                  { types: ["label"], value: "no-lang label" }, // no lang → ignored
                ],
              },
            },
          ],
        }),
      ),
    );
    const org = await resolveInstitution("Nagoya Univ.");
    expect(org?.name).toBe("Nagoya University");
    expect(org?.names).toEqual({
      en: "Nagoya University",
      ja: "名古屋大学",
      fr: "Université de Nagoya",
    });
  });

  it("omits the names map when no supported localized variant exists", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res({
          items: [
            {
              chosen: true,
              organization: {
                id: "https://ror.org/x",
                names: [{ types: ["ror_display"], value: "Some Org", lang: "la" }],
              },
            },
          ],
        }),
      ),
    );
    const org = await resolveInstitution("some org");
    expect(org?.name).toBe("Some Org");
    expect(org?.names).toBeUndefined();
  });
});

// ── schema: displayInstitution picker ─────────────────────────────────────────

describe("displayInstitution", () => {
  const meta = {
    meta: { institution: "Nagoya University", institutionNames: { ja: "名古屋大学" } },
  };

  it("returns the CV-language variant when ROR provides one", () => {
    expect(displayInstitution(meta, "ja-JP")).toBe("名古屋大学");
  });

  it("falls back to the canonical name (ror_display, NOT forced English) otherwise", () => {
    expect(displayInstitution(meta, "de-DE")).toBe("Nagoya University");
    expect(displayInstitution(meta, "en-US")).toBe("Nagoya University");
  });

  it("returns the base name when there are no localized variants", () => {
    expect(displayInstitution({ meta: { institution: "X University" } }, "ja-JP")).toBe(
      "X University",
    );
  });

  it("returns undefined when the item carries no institution", () => {
    expect(displayInstitution({ meta: {} }, "ja-JP")).toBeUndefined();
  });
});

// ── render integration ────────────────────────────────────────────────────────

const hasApa = listAvailableStyles().includes("apa");

const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A1"],
  displayName: "Basile Chrétien",
};

function cvWithPosition(extra: Partial<OrcidPosition> = {}) {
  const employments: OrcidPosition[] = [
    {
      putCode: "p1",
      organization: "Nagoya University",
      roleTitle: "Professor",
      startYear: 2020,
      rorId: "https://ror.org/04chrp450",
      institutionNames: { ja: "名古屋大学", fr: "Université de Nagoya" },
      ...extra,
    },
  ];
  return buildCanonicalCv({
    id: "cv1",
    resolved,
    works: [],
    now: "2026-06-10T00:00:00.000Z",
    employments,
  });
}

describe.skipIf(!hasApa)("locale-aware institution rendering", () => {
  it("shows the CV-language ROR name and links it (ja-JP)", () => {
    const html = renderCvHtml(updateDisplay(cvWithPosition(), { locale: "ja-JP" }));
    expect(html).toContain("名古屋大学");
    expect(html).not.toContain("Nagoya University");
    // The ROR link wraps the localized name, not the canonical one.
    expect(html).toMatch(/<a class="cv-ror-link"[^>]*>名古屋大学<\/a>/);
  });

  it("falls back to the canonical name when no variant matches the CV language (de-DE)", () => {
    const html = renderCvHtml(updateDisplay(cvWithPosition(), { locale: "de-DE" }));
    expect(html).toContain("Nagoya University");
    expect(html).not.toContain("名古屋大学");
    expect(html).toMatch(/<a class="cv-ror-link"[^>]*>Nagoya University<\/a>/);
  });

  it("uses a non-English variant for a matching locale (fr-FR)", () => {
    const html = renderCvHtml(updateDisplay(cvWithPosition(), { locale: "fr-FR" }));
    expect(html).toContain("Université de Nagoya");
  });

  it("localizes the ongoing date term to the CV language (fr-FR: present → présent)", () => {
    const html = renderCvHtml(updateDisplay(cvWithPosition(), { locale: "fr-FR" }));
    expect(html).toContain("2020–présent");
    expect(html).not.toContain("2020–present");
  });

  it("keeps the English date term for an en-US CV", () => {
    const html = renderCvHtml(updateDisplay(cvWithPosition(), { locale: "en-US" }));
    expect(html).toContain("2020–present");
  });

  it("does NOT localize when the user has overridden the line", () => {
    let cv = updateDisplay(cvWithPosition(), { locale: "ja-JP" });
    cv = setItemTextOverride(
      cv,
      "positions",
      "position:orcid:p1",
      "Professor, Nagoya University (my edit)",
    );
    const html = renderCvHtml(cv);
    expect(html).toContain("Professor, Nagoya University (my edit)");
    expect(html).not.toContain("名古屋大学");
  });
});
