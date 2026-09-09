import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";
import { projectCvForPublic } from "@/lib/cv/publicProjection";
import {
  READER_VIEW_KEEP,
  isReaderViewRequested,
  readerViewActive,
  readerViewBannerHtml,
  readerViewCv,
  readerViewHeadTags,
  readerViewLinkHtml,
} from "@/lib/cv/readerView";
import { parseViewFilters, viewFilterBarHtml, viewFilterQuery } from "@/lib/cv/viewFilter";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { renderStrings } from "@/lib/i18n/render";
import { escapeHtml } from "@/lib/render/escape";
import { renderCvHtml } from "@/lib/render/html";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";

const hasApa = listAvailableStyles().includes("apa");

const SELF = "https://openalex.org/A5001069481";
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};

function work(id: string, year: number, oa: boolean): OpenAlexWork {
  return {
    id: `https://openalex.org/${id}`,
    title: `Study ${id}`,
    display_name: `Study ${id}`,
    type: "article",
    publication_year: year,
    authorships: [{ author: { id: SELF, display_name: "B" }, raw_author_name: "B" }],
    primary_location: { source: { display_name: "Journal A", type: "journal" } },
    open_access: { is_oa: oa, oa_status: oa ? "gold" : "closed" },
  } as unknown as OpenAlexWork;
}

function makeCv(allow: boolean): CanonicalCv {
  const cv = buildCanonicalCv({
    id: "rv",
    resolved,
    works: [work("W1", 2025, true), work("W2", 2019, false), work("W3", 2014, true)],
    now: "2026-06-02T00:00:00.000Z",
  });
  return { ...cv, display: { ...cv.display, allowReaderMode: allow } };
}

const params = (q: string) => new URL(`https://sigmacv.test/p/abc${q}`).searchParams;

/** The banner for a CV as the route builds it: the public projection under the
 *  reader-mode preset, in the given language. */
function banner(cv: CanonicalCv, q = "?view=reader", locale: Locale = "en-US"): string {
  const reader = readerViewCv(projectCvForPublic({ ...cv, display: { ...cv.display, locale } }));
  return readerViewBannerHtml(reader, parseViewFilters(params(q)));
}

describe("reader view request + gate", () => {
  it("recognises exactly ?view=reader", () => {
    expect(isReaderViewRequested(params("?view=reader"))).toBe(true);
    expect(isReaderViewRequested(params("?view=reader&since=2020"))).toBe(true);
    expect(isReaderViewRequested(params(""))).toBe(false);
    expect(isReaderViewRequested(params("?view=READER"))).toBe(false);
    expect(isReaderViewRequested(params("?view=print"))).toBe(false);
    expect(isReaderViewRequested(params("?reader=1"))).toBe(false);
  });

  it("serves the view only when requested AND the owner opted in (fails closed)", () => {
    expect(readerViewActive(params("?view=reader"), makeCv(true))).toBe(true);
    expect(readerViewActive(params("?view=reader"), makeCv(false))).toBe(false);
    expect(readerViewActive(params(""), makeCv(true))).toBe(false);
    // A CV whose display predates the flag (undefined) is treated as off.
    const legacy = makeCv(true);
    const { allowReaderMode: _drop, ...rest } = legacy.display;
    expect(
      readerViewActive(params("?view=reader"), {
        ...legacy,
        display: rest as CanonicalCv["display"],
      }),
    ).toBe(false);
  });
});

describe("readerViewCv", () => {
  it("returns a new CV with the reader-mode preset applied, leaving the input untouched", () => {
    const cv = makeCv(true);
    const before = structuredClone(cv);
    const out = readerViewCv(cv);
    expect(out).not.toBe(cv);
    expect(cv).toEqual(before);
    expect(out.display.showProvenance).toBe(true);
    expect(out.display.showOpenAccess).toBe(true);
    expect(out.display.hideRetracted).toBe(false);
    expect(out.display.showMetrics).toBe(cv.display.showMetrics);
    expect(out.sections).toBe(cv.sections);
    expect(out.owner).toBe(cv.owner);
  });
});

describe("reader view chrome", () => {
  it("links to ?view=reader from the standard page, preserving active filters", () => {
    const html = readerViewLinkHtml(parseViewFilters(params("?since=2020&oa=1")), "en-US");
    expect(html).toMatch(/^<nav class="cv-readerbar"/);
    expect(html).toContain('href="?since=2020&amp;oa=1&amp;view=reader"');
    expect(html).toContain(">Reader view</a>");
    expect(html).toContain('title="Show the provenance, verification and context signals');
    // No filters → just the view param.
    expect(readerViewLinkHtml(parseViewFilters(params("")), "en-US")).toContain(
      'href="?view=reader"',
    );
  });

  it("renders the banner with the score disclaimer and a back link that drops only the view param", () => {
    const html = banner(makeCv(true), "?type=article&view=reader");
    expect(html).toMatch(/^<aside class="cv-readerbanner" role="note">/);
    expect(html).toContain("Nothing here is a score.");
    expect(html).toContain('<a href="?type=article">Back to the standard page</a>');
    // Unfiltered → "?" (clears every param, the same convention as the filter chips).
    expect(banner(makeCv(true))).toContain('<a href="?">');
  });

  it("can omit the back link (a version frozen AS the reader view has no standard page)", () => {
    const html = readerViewBannerHtml(makeCv(true), parseViewFilters(params("")), {
      backLink: false,
    });
    expect(html).toContain("Nothing here is a score.");
    expect(html).not.toContain(">Back to the standard page<");
    expect(readerViewBannerHtml(makeCv(true), parseViewFilters(params("")), {})).toContain(
      ">Back to the standard page<",
    );
  });

  it("localizes the chrome — the banner speaks the CV's language", () => {
    expect(readerViewLinkHtml(parseViewFilters(params("")), "fr-FR")).toContain("Vue évaluateur");
    expect(banner(makeCv(true), "?view=reader", "ja-JP")).toContain("審査者ビュー");
  });

  it("emits a noindex robots meta for the reader view head", () => {
    expect(readerViewHeadTags()).toBe('<meta name="robots" content="noindex, nofollow" />');
  });
});

// ─── recipient notice ─────────────────────────────────────────────────────────

describe("reader banner: recipient notice", () => {
  const NOTICE_KEYS = [
    "readerNoticePurpose",
    "readerNoticeThirdParty",
    "readerNoticeRetracted",
    "readerNoticeAbsence",
  ] as const;

  it("states the recipient notice as a plain block (no <details>) in every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = renderStrings(loc);
      const html = banner(makeCv(true), "?view=reader", loc);
      expect(html, loc).toContain('<p class="cv-readernotice">');
      for (const key of NOTICE_KEYS) expect(html, `${loc} ${key}`).toContain(escapeHtml(s[key]));
      expect(html, loc).not.toContain("<details");
      // Short sentences: the notice must fit under the banner on paper.
      for (const key of NOTICE_KEYS) expect(s[key].length, `${loc} ${key}`).toBeLessThan(260);
    }
  });

  it("keeps the lead sentence + back link first, then the notice, then the legend", () => {
    const html = banner(makeCv(true));
    const lead = html.indexOf("Nothing here is a score.");
    const back = html.indexOf('<a href="?">Back to the standard page</a>');
    const notice = html.indexOf('<p class="cv-readernotice">');
    const legend = html.indexOf('<div class="cv-readerlegend">');
    expect(lead).toBeGreaterThan(-1);
    expect(lead).toBeLessThan(back);
    expect(back).toBeLessThan(notice);
    expect(notice).toBeLessThan(legend);
    expect(html.endsWith("</div></aside>")).toBe(true);
    expect(html).toContain("rests on the reader&#39;s own lawful basis");
  });

  it("describes the reader's position rather than instructing them (sentence 1, CJK locales)", () => {
    // en-US is descriptive ("rests on"); the CJK sentences must be too — not a
    // "must" / "please" addressed to the reader.
    expect(renderStrings("zh-CN").readerNoticePurpose).toContain(
      "任何用于评估的使用，均以读者自身的合法依据为前提。",
    );
    expect(renderStrings("zh-CN").readerNoticePurpose).not.toContain("均须");
    expect(renderStrings("ja-JP").readerNoticePurpose).toContain(
      "評価目的での利用は、閲覧者自身の適法な根拠に基づくものです。",
    );
    expect(renderStrings("ja-JP").readerNoticePurpose).not.toContain("ください");
    expect(renderStrings("ko-KR").readerNoticePurpose).toContain(
      "평가 목적의 이용은 열람자 자신의 적법한 근거에 따릅니다.",
    );
    expect(renderStrings("ko-KR").readerNoticePurpose).not.toContain("따라야 합니다");
  });

  it("phrases the absence sentence plainly and names the section by its rendered heading", () => {
    expect(renderStrings("en-US").readerNoticeAbsence).toBe(
      "A missing career-context section does not mean there is none, and an empty source does not mean no output.",
    );
    // ko-KR: the section heading renders as "경력 배경" — the notice must name it the same way.
    expect(renderStrings("ko-KR").readerNoticeAbsence).toContain("경력 배경 섹션");
    expect(renderStrings("ko-KR").readerNoticeAbsence).not.toContain("경력 맥락");
  });
});

// ─── print-visible legend (built from what the page shows) ───────────────────

type Meta = CvItem["meta"];

function item(id: string, source: string, meta: Meta = {}, over: Partial<CvItem> = {}): CvItem {
  return {
    id,
    source,
    sourceId: id,
    displayText: `Entry ${id}`,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: false,
    selfNameVariants: [],
    meta,
    ...over,
  } as CvItem;
}

interface SectionSpec {
  id: string;
  type: string;
  items: CvItem[];
}

function cvWith(sections: SectionSpec[], display: Record<string, unknown> = {}): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "legend",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Basile Chrétien" },
    // The per-work indicator pills are the OWNER's toggle (reader mode no longer
    // forces them on: 2026-09-08 panel, defect 5); the legend fixtures switch it
    // on so the pills exist to be explained.
    display: { allowReaderMode: true, showWorkIndicators: true, ...display },
    sections: sections.map((s, i) => ({
      id: s.id,
      type: s.type,
      title: s.id,
      visible: true,
      order: i,
      items: s.items,
    })),
    provenance: { generatedAt: "2026-09-04T00:00:00.000Z", sources: ["openalex"] },
  });
}

/** Every mark and badge the legend can explain, on one CV: an OpenAlex work
 *  with an OA badge + RCR/FWCI pills, a retracted OpenAlex work, a DataCite
 *  dataset, an institution-verified ORCID position, a manual supervision. */
function fullCv(): CanonicalCv {
  return cvWith([
    {
      id: "publications",
      type: "publications",
      items: [
        item("w1", "openalex", { oaStatus: "gold", rcr: 0.8, fwci: 1.2, year: 2015 }),
        item("w2", "openalex", { retracted: true, year: 2012 }),
      ],
    },
    { id: "datasets", type: "datasets", items: [item("d1", "datacite", {})] },
    {
      id: "positions",
      type: "positions",
      items: [item("p1", "orcid", { verified: true, institution: "Nagoya University" })],
    },
    {
      id: "supervision",
      type: "supervision",
      items: [item("s1", "manual", { superviseeName: "Jane Doe", degreeLevel: "phd" })],
    },
  ]);
}

const legendOf = (html: string) =>
  html.match(/<div class="cv-readerlegend">[\s\S]*?<\/div>/)?.[0] ?? "";
const linesOf = (legend: string) => [...legend.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
const pairLine = (label: string, text: string) =>
  `<b>${escapeHtml(label)}</b> — ${escapeHtml(text)}`;

describe("reader banner: print-visible legend", () => {
  it("explains every mark the page shows — and only those — in at most six lines", () => {
    const s = renderStrings("en-US");
    const legend = legendOf(banner(fullCv()));
    expect(legend).toContain(
      `<span class="cv-readerlegend-label">${escapeHtml(s.readerLegendLabel)}</span>`,
    );
    const lines = linesOf(legend);
    expect(lines).toEqual([
      // 1. the mark names the SOURCE, listing the sources actually on the page
      escapeHtml(
        "Grey mark after an entry: the source its record came from (OpenAlex and DataCite).",
      ),
      // 2. the one non-source mark the public page can carry
      pairLine("Manual", "Entered by the owner"),
      // 3–5. the badges present
      pairLine("Verified", s.badgeVerifiedTitle),
      pairLine("Retracted", s.badgeRetractedTitle),
      pairLine("OA", "Open access (gold)"),
      // 6. the per-work indicator pills present, with their caveats
      pairLine("RCR · FWCI", `${s.indicatorRcrTitle} ${s.indicatorFwciTitle}`),
    ]);
    expect(lines.length).toBeLessThanOrEqual(6);
  });

  it("omits every line whose mark is absent (a plain OpenAlex-only page gets one line)", () => {
    const s = renderStrings("en-US");
    const cv = cvWith([
      { id: "publications", type: "publications", items: [item("w1", "openalex", { year: 2015 })] },
    ]);
    const lines = linesOf(legendOf(banner(cv)));
    expect(lines).toEqual([
      escapeHtml("Grey mark after an entry: the source its record came from (OpenAlex)."),
    ]);
    const html = banner(cv);
    for (const absent of [
      s.provLabelManual,
      s.provLabelClaimed,
      s.badgeVerified,
      s.badgeRetracted,
      s.badgeOpenAccess,
      "RCR",
      "FWCI",
    ]) {
      expect(html).not.toContain(`<li><b>${escapeHtml(absent)}`);
    }
    expect(html).not.toContain("Matched to the owner");
  });

  it("drops the legend entirely when the page lists nothing to explain", () => {
    const empty = cvWith([{ id: "publications", type: "publications", items: [] }]);
    const html = banner(empty);
    expect(html).toContain('<p class="cv-readernotice">');
    expect(html).not.toContain("cv-readerlegend");
    expect(html.endsWith("</p></aside>")).toBe(true);
    // Positions / Education render as structured records without the mark: no
    // provenance line — but their institution-verified mark is still explained.
    const historyOnly = cvWith([
      {
        id: "positions",
        type: "positions",
        items: [item("p1", "orcid", { verified: true, institution: "Nagoya University" })],
      },
    ]);
    const lines = linesOf(legendOf(banner(historyOnly)));
    expect(lines).toEqual([pairLine("Verified", renderStrings("en-US").badgeVerifiedTitle)]);
  });

  it("counts only entries the page lists: hidden, 'not mine' and per-view-excluded ones do not", () => {
    const cv = cvWith(
      [
        {
          id: "publications",
          type: "publications",
          items: [
            item("w1", "openalex", { year: 2015 }),
            item("w2", "openalex", { retracted: true, year: 2012 }, { included: false }),
            item("w3", "datacite", { oaStatus: "green" }, { notMine: true }),
            item("w4", "dblp", { rcr: 2 }),
          ],
        },
      ],
      { excludedItems: { publications: ["w4"] } },
    );
    const lines = linesOf(legendOf(banner(cv)));
    expect(lines).toEqual([
      escapeHtml("Grey mark after an entry: the source its record came from (OpenAlex)."),
    ]);
  });

  it("puts the parenthetical away when no listed mark names a source", () => {
    const cv = cvWith([
      {
        id: "supervision",
        type: "supervision",
        items: [item("s1", "manual", { superviseeName: "Jane Doe", degreeLevel: "phd" })],
      },
    ]);
    const lines = linesOf(legendOf(banner(cv)));
    expect(lines).toEqual([
      escapeHtml("Grey mark after an entry: the source its record came from."),
      pairLine("Manual", "Entered by the owner"),
    ]);
    // Same in a locale whose parentheses are full-width.
    const ja = linesOf(legendOf(banner(cv, "?view=reader", "ja-JP")));
    expect(ja[0]).toBe(escapeHtml("項目の後ろの灰色の印：そのレコードの出典。"));
    expect(ja[0]).not.toContain("（");
  });

  it("explains an owner-claimed or identifier-matched mark only when the render carries it", () => {
    const s = renderStrings("en-US");
    const cv = cvWith([
      {
        id: "publications",
        type: "publications",
        items: [
          item("w1", "openalex", { matchBasis: "claimed", year: 2015 }),
          item("w2", "openalex", { matchBasis: "orcid", year: 2014 }),
          item("w3", "openalex", { matchBasis: "orcid", year: 2013 }),
          item("w4", "openalex", { year: 2012 }),
        ],
      },
    ]);
    // An owner-side render (no projection) still carries the match basis.
    const ownerSide = readerViewBannerHtml(readerViewCv(cv), parseViewFilters(params("")));
    expect(linesOf(legendOf(ownerSide))).toEqual([
      escapeHtml("Grey mark after an entry: the source its record came from (OpenAlex)."),
      pairLine(s.provLabelClaimed, s.provMatchClaimed),
      pairLine("ORCID", s.provMatchOrcid),
    ]);
    // The public projection strips it, so the public page never explains a mark
    // it cannot show — an "ORCID" mark there would name the SOURCE, not a match.
    const pub = banner(cv);
    expect(pub).not.toContain(`<li><b>${escapeHtml(s.provLabelClaimed)}`);
    expect(pub).not.toContain("Matched to the owner");
    expect(linesOf(legendOf(pub))).toEqual([
      escapeHtml("Grey mark after an entry: the source its record came from (OpenAlex)."),
    ]);
  });

  it("lists the indicator pills actually shown, with their own caveats", () => {
    const s = renderStrings("en-US");
    const only = (meta: Meta) =>
      linesOf(
        legendOf(
          banner(
            cvWith([
              {
                id: "publications",
                type: "publications",
                items: [item("w1", "openalex", { year: 2015, ...meta })],
              },
            ]),
          ),
        ),
      ).at(-1);
    expect(only({ rcr: 1.5 })).toBe(pairLine("RCR", s.indicatorRcrTitle));
    expect(only({ fwci: 0.4 })).toBe(pairLine("FWCI", s.indicatorFwciTitle));
    expect(only({ clinicalCitations: 3 })).toBe(
      pairLine(s.indicatorClinicalCitationsLabel, s.indicatorClinicalCitationsTitle),
    );
    // A zero FWCI on a very recent work is not shown as a pill — so not explained.
    const recent = new Date().getUTCFullYear();
    expect(only({ fwci: 0, year: recent })).not.toContain("FWCI");
  });

  it("explains no indicator pill when the owner left the indicators off (reader mode does not force them)", () => {
    const cv = cvWith(
      [
        {
          id: "publications",
          type: "publications",
          items: [item("w1", "openalex", { year: 2015, rcr: 1.5, fwci: 2 })],
        },
      ],
      { showWorkIndicators: false },
    );
    const lines = linesOf(legendOf(banner(cv)));
    expect(lines.join(" ")).not.toMatch(/RCR|FWCI/);
  });

  it("names the open-access statuses behind the OA badges shown", () => {
    const cv = cvWith([
      {
        id: "publications",
        type: "publications",
        items: [
          item("w1", "openalex", { oaStatus: "gold", year: 2015 }),
          item("w2", "openalex", { oaStatus: "green", year: 2014 }),
          item("w3", "openalex", { oaStatus: "gold", year: 2013 }),
        ],
      },
    ]);
    expect(linesOf(legendOf(banner(cv))).at(-1)).toBe(
      pairLine("OA", "Open access (gold and green)"),
    );
  });

  it("uses the same strings as the marks' and badges' tooltips, in every locale, within six lines", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = renderStrings(loc);
      // The reworded line names the source and takes the sources actually shown.
      expect(s.readerLegendProvenance, loc).toContain("{sources}");
      expect(s.readerLegendProvenance, loc).not.toMatch(/OpenAlex.*ID|ORCID iD/);
      const legend = legendOf(banner(fullCv(), "?view=reader", loc));
      const lines = linesOf(legend);
      expect(lines.length, loc).toBe(6);
      expect(lines[0], loc).not.toContain("{sources}");
      expect(lines[0], loc).toContain("OpenAlex");
      expect(lines[0], loc).toContain("DataCite");
      expect(lines[1], loc).toBe(pairLine(s.provLabelManual, s.provSourceManual));
      expect(lines[2], loc).toBe(pairLine(s.badgeVerified, s.badgeVerifiedTitle));
      expect(lines[3], loc).toBe(pairLine(s.badgeRetracted, s.badgeRetractedTitle));
      expect(lines[4], loc).toBe(
        pairLine(s.badgeOpenAccess, s.badgeOpenAccessTitle.replace("{status}", "gold")),
      );
      expect(lines[5], loc).toBe(
        pairLine("RCR · FWCI", `${s.indicatorRcrTitle} ${s.indicatorFwciTitle}`),
      );
    }
  });
});

describe.skipIf(!hasApa)("reader banner print CSS (needs vendored CSL assets)", () => {
  it("no longer hides the banner in print — only its back link stays web-only", () => {
    const html = renderCvHtml(makeCv(true));
    // The page-box print block (the one after @page) carries the web-only list.
    const print = html.slice(html.indexOf("@page {"));
    const hidden = print.match(/\.cv-itemtools,[^{]*\{ display: none !important; \}/)?.[0] ?? "";
    expect(hidden).toContain(".cv-readerbar");
    expect(hidden).toContain(".cv-filterbar");
    expect(hidden).not.toContain(".cv-readerbanner");
    expect(print).toContain(".cv-readerbanner a { display: none; }");
    expect(print).toContain(".cv-readerbanner { break-inside: avoid; }");
  });
});

describe("viewFilterQuery / viewFilterBarHtml `keep`", () => {
  it("carries extra params through the serialized query, after the filter params", () => {
    const f = parseViewFilters(params("?since=2020"));
    expect(viewFilterQuery(f)).toBe("?since=2020");
    expect(viewFilterQuery(f, READER_VIEW_KEEP)).toBe("?since=2020&view=reader");
    expect(viewFilterQuery(parseViewFilters(params("")), READER_VIEW_KEEP)).toBe("?view=reader");
    expect(viewFilterQuery(parseViewFilters(params("")))).toBe("?");
  });

  it("keeps view=reader on every facet chip so a facet never drops the reader view", () => {
    const cv = makeCv(true);
    const f = parseViewFilters(params("?view=reader"));
    const bar = viewFilterBarHtml(cv, f, "en-US", READER_VIEW_KEEP);
    const hrefs = [...bar.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
    expect(hrefs.length).toBeGreaterThan(2);
    for (const h of hrefs) expect(h).toContain("view=reader");
    // Without `keep` the chips are unchanged (the standard page's bar).
    const plain = viewFilterBarHtml(cv, f, "en-US");
    expect(plain).not.toContain("view=reader");
  });
});
