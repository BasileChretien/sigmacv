import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay } from "@/lib/canonical/curate";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { computeCvHealth } from "@/lib/cv/health";
import { serializePublicCv } from "@/lib/cv/publicFormats";
import { projectCvForPreview, projectCvForPublic } from "@/lib/cv/publicProjection";
import {
  SELF_REFERENCE_MIN_SHARE,
  SELF_REFERENCE_MIN_WORKS,
  selfReferenceNotice,
  selfReferenceShare,
} from "@/lib/cv/selfReference";
import { renderCvHtml } from "@/lib/render/html";
import { renderCvMarkdown } from "@/lib/render/markdown";
import { renderPublicCvHtml } from "@/lib/render/publicStyles";
import type { CanonicalCv, CvItem, CvSection } from "@/lib/canonical/schema";

const resolved = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};

function base(): CanonicalCv {
  return buildCanonicalCv({ id: "SR", resolved, works: [], now: "2026-06-02T00:00:00.000Z" });
}

function work(
  id: string,
  refCount?: number,
  selfRefs?: number,
  over: Partial<CvItem> = {},
): CvItem {
  return {
    id,
    source: "openalex",
    sourceId: `https://openalex.org/${id}`,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    csl: { id, type: "article-journal", title: `Paper ${id}`, issued: { "date-parts": [[2024]] } },
    meta: { refCount, selfRefs, peerReviewed: true },
    ...over,
  } as CvItem;
}

function pubs(items: CvItem[]): CvSection {
  return {
    id: "publications",
    type: "publications",
    title: "Publications",
    visible: true,
    order: 0,
    items,
  } as CvSection;
}

function cvWith(items: CvItem[], display: Record<string, unknown> = {}): CanonicalCv {
  return { ...updateDisplay(base(), { locale: "en-US", ...display }), sections: [pubs(items)] };
}

/** 12 works, 40 refs each, 20 self-refs each → share 0.5 over n = 12. */
function highSelfRefItems(): CvItem[] {
  return Array.from({ length: 12 }, (_, i) => work(`W${i}`, 40, 20));
}

describe("selfReferenceShare", () => {
  it("is undefined when no countable work carries reference counts", () => {
    expect(selfReferenceShare(cvWith([work("a"), work("b", 0, 0)]))).toBeUndefined();
    expect(selfReferenceShare(base())).toBeUndefined();
  });

  it("is a ratio of sums over works with refCount > 0", () => {
    const s = selfReferenceShare(cvWith([work("a", 10, 5), work("b", 30, 3), work("c", 0, 0)]));
    expect(s).toEqual({ share: 8 / 40, works: 2, selfRefs: 8, refCount: 40 });
  });

  it("clamps a malformed selfRefs to [0, refCount] and skips non-countable works", () => {
    const s = selfReferenceShare(
      cvWith([
        work("a", 10, 50), // self > refs → clamped to 10
        work("b", 10, -3), // negative → 0
        work("h", 10, 10, { included: false }), // hidden → skipped
        work("p", 10, 10, { meta: { refCount: 10, selfRefs: 10, peerReviewed: false } }), // not countable
      ]),
    );
    expect(s).toEqual({ share: 0.5, works: 2, selfRefs: 10, refCount: 20 });
  });
});

describe("selfReferenceNotice thresholds", () => {
  it("fires at share ≥ 0.30 over n ≥ 10", () => {
    const n = selfReferenceNotice(cvWith(highSelfRefItems()));
    expect(n).toEqual({ share: 0.5, works: 12, selfRefs: 240, refCount: 480 });
    expect(SELF_REFERENCE_MIN_SHARE).toBe(0.3);
    expect(SELF_REFERENCE_MIN_WORKS).toBe(10);
  });

  it("stays quiet below the share threshold", () => {
    const items = Array.from({ length: 12 }, (_, i) => work(`W${i}`, 100, 29));
    expect(selfReferenceShare(cvWith(items))?.share).toBeCloseTo(0.29);
    expect(selfReferenceNotice(cvWith(items))).toBeUndefined();
  });

  it("stays quiet below the sample threshold, and with no data", () => {
    const items = Array.from({ length: 9 }, (_, i) => work(`W${i}`, 10, 9));
    expect(selfReferenceNotice(cvWith(items))).toBeUndefined();
    expect(selfReferenceNotice(base())).toBeUndefined();
  });

  it("fires exactly at the boundaries", () => {
    const items = Array.from({ length: 10 }, (_, i) => work(`W${i}`, 10, 3));
    expect(selfReferenceNotice(cvWith(items))).toEqual({
      share: 0.3,
      works: 10,
      selfRefs: 30,
      refCount: 100,
    });
  });
});

describe("computeCvHealth carries the notice as information only", () => {
  it("adds selfReference without touching total, and omits it when quiet", () => {
    const loud = computeCvHealth(cvWith(highSelfRefItems()));
    expect(loud.total).toBe(0);
    expect(loud.selfReference?.share).toBe(0.5);
    const quiet = computeCvHealth(cvWith([work("a", 10, 1)]));
    expect("selfReference" in quiet).toBe(false);
  });
});

describe("the self-referencing share never leaves the owner's editor", () => {
  const hasApa = listAvailableStyles().includes("apa");
  const cv = cvWith(highSelfRefItems(), {
    showProvenance: true,
    showMetrics: true,
    showOutputLedger: true,
    showAuthorshipTable: true,
    showCollaboration: true,
    showWorkIndicators: true,
    showCitationCounts: true,
    cslStyle: "apa",
  });
  // What the panel would say, and the raw ingredients: none may surface.
  const forbidden = [/self[- ]?ref/i, /own work/i, /selfRefs/, /refCount/, /50%/, /n = 12/];

  it.runIf(hasApa)("is absent from the HTML/PDF document and the public page render", () => {
    for (const html of [renderCvHtml(cv), renderPublicCvHtml(projectCvForPublic(cv))]) {
      for (const re of forbidden) expect(html).not.toMatch(re);
    }
  });

  it.runIf(hasApa)("is absent from the Markdown export", () => {
    const md = renderCvMarkdown(cv);
    for (const re of forbidden) expect(md).not.toMatch(re);
  });

  it("is absent from the public JSON, and its ingredients are stripped by both projections", () => {
    const json = serializePublicCv(projectCvForPublic(cv), "json", "slug").body;
    for (const re of forbidden) expect(json).not.toMatch(re);
    for (const projected of [projectCvForPublic(cv), projectCvForPreview(cv)]) {
      for (const it of projected.sections.flatMap((s) => s.items)) {
        expect(it.meta.refCount).toBeUndefined();
        expect(it.meta.selfRefs).toBeUndefined();
      }
      expect(selfReferenceShare(projected)).toBeUndefined();
    }
  });
});
